import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { getDeliveryQuote, getFulfillmentOptions } from '@/lib/fulfillment';
import { ORDER_STATUS, ORDER_TYPE, PAYMENT_DONE } from '@/lib/order';

// Simple interface for the order items
interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// A temporary workaround for non-autoincrementing primary keys
function generateTemporaryId() {
  return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000000);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'Session ID is missing.' }, { status: 400 });
  }

  try {
    // Check if we already processed this session to prevent duplicates
    const existingOrder = await prisma.business_order.findFirst({
      where: {
        PAYMENT_MODE: 'stripe',
        // Use a combination of session metadata to identify duplicates
        EMAIL_ADDRESS: { not: null },
        CREATION_DATETIME: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        CREATION_DATETIME: 'desc'
      }
    });

    // Retrieve the session with expanded line items and customer details
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product', 'customer', 'payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ success: false, error: 'Payment not successful.' }, { status: 402 });
    }

    // Check if this exact session was already processed
    if (existingOrder && 
        existingOrder.EMAIL_ADDRESS === (session.customer_email || session.metadata?.customerEmail) &&
        Math.abs(Number(existingOrder.ORDER_FINAL_AMOUNT || existingOrder.ORDER_AMOUNT) - Number(session.amount_total || 0) / 100) < 0.01) {
      
      // Get line items with expanded product details
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
        expand: ['data.price.product']
      });

      // Format items with complete product data
      const items = lineItems.data.map(item => ({
        id: item.id,
        price: {
          id: item.price?.id,
          product: item.price?.product,
          unit_amount: item.price?.unit_amount,
          currency: item.price?.currency,
        },
        quantity: item.quantity,
        description: item.description,
        amount_subtotal: item.amount_subtotal,
        amount_total: item.amount_total,
        // Include any other relevant fields
      }));
      
      // Return the existing order with complete product data
      return NextResponse.json({ 
        success: true, 
        orderId: existingOrder.BUSINESS_ORDER_ID,
        orderNumber: `ORD-${existingOrder.BUSINESS_ORDER_ID}`,
        customerId: existingOrder.VISITOR_ID || undefined,
        customerName: `${existingOrder.FIRST_NAME} ${existingOrder.LAST_NAME}`,
        customerEmail: existingOrder.EMAIL_ADDRESS || '',
        items,
        amount_subtotal: Number(existingOrder.ORDER_AMOUNT || 0) * 100,
        amount_total: Number(existingOrder.ORDER_AMOUNT || 0) * 100,
        payment_method_types: ['card'],
        message: 'Order already processed',
        shipping: {
          address: {
            line1: existingOrder.ADDRESS_STREET || '',
            city: existingOrder.ADDRESS_TOWN || '',
            postal_code: existingOrder.ADDRESS_ZIP || '',
            country: existingOrder.ADDRESS_COUNTRY_CODE || 'CH'
          }
        }
      });
    }

    // Extract line items and metadata
    const lineItems = session.line_items?.data;
    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No items found in order.' }, { status: 400 });
    }

    // Get the first product to determine the business
    const firstProductId = parseInt((lineItems[0].price?.product as Stripe.Product)?.metadata?.productId || '0', 10);
    if (!firstProductId) {
      return NextResponse.json({ success: false, error: 'Invalid product in order.' }, { status: 400 });
    }

    // Find the business associated with the first product
    const productRecord = await prisma.business_product.findUnique({
      where: { BUSINESS_PRODUCT_ID: firstProductId },
      select: { BUSINESS_ID: true }
    });

    if (!productRecord || !productRecord.BUSINESS_ID) {
      return NextResponse.json({ success: false, error: 'Could not determine business for this order.' }, { status: 500 });
    }
    const businessId = productRecord.BUSINESS_ID;
    const orderType = session.metadata?.orderType === ORDER_TYPE.pickup ? ORDER_TYPE.pickup : ORDER_TYPE.delivery;
    const settings = await prisma.business_settings.findUnique({ where: { BUSINESS_ID: businessId } });

    if (orderType === ORDER_TYPE.pickup) {
      if (!getFulfillmentOptions(settings).pickupEnabled) {
        return NextResponse.json({ success: false, error: 'Pickup is currently unavailable.' }, { status: 400 });
      }
    } else {
      const quote = getDeliveryQuote(
        settings,
        session.metadata?.zip || '',
        Number(session.metadata?.totalAmount || 0)
      );
      if (!quote.available) {
        return NextResponse.json({ success: false, error: quote.reason || 'Delivery unavailable.' }, { status: 400 });
      }
    }

    // Get or create customer in our database
    let customerId: number | null = null;
    const sessionUser = await getServerSession(authOptions);
    
    if (sessionUser?.user?.email) {
      // For authenticated users
      const user = await prisma.visitors_account.findUnique({
        where: { EMAIL_ADDRESS: sessionUser.user.email },
        select: { VISITORS_ACCOUNT_ID: true }
      });
      
      if (user) {
        customerId = Number(user.VISITORS_ACCOUNT_ID);
      }
    } else if (session.customer_email) {
      // For guest users, check if they exist by email
      const existingUser = await prisma.visitors_account.findUnique({
        where: { EMAIL_ADDRESS: session.customer_email },
        select: { VISITORS_ACCOUNT_ID: true }
      });

      if (existingUser) {
        customerId = Number(existingUser.VISITORS_ACCOUNT_ID);
      }
    }

    // Calculate order totals
    const orderTotal = lineItems.reduce((sum, item) => {
      return sum + (item.amount_total || 0);
    }, 0) / 100; // Convert from cents to currency
    const shippingCharges = Number(session.metadata?.shippingCharges || 0);
    const finalTotal = Number(session.amount_total || 0) / 100 || orderTotal + shippingCharges;

    // Get shipping details from session or metadata
    const shippingAddress = (session as any).shipping?.address as Stripe.Address | null;
    const customerDetails = session.customer_details as Stripe.Checkout.Session.CustomerDetails | null;
    
    // Create the order in the database
    const newOrder = await prisma.business_order.create({
      data: {
        BUSINESS_ORDER_ID: generateTemporaryId(),
        CREATION_DATETIME: new Date(),
        BUSINESS_ID: businessId,
        VISITOR_ID: customerId || 0,
        PAYMENT_DONE: PAYMENT_DONE.paid,
        PAYMENT_MODE: 'stripe',
        ORDER_STATUS: ORDER_STATUS.preparing,
        ORDER_TYPE: orderType,
        TERMINAL: 'web',
        FIRST_NAME: session.metadata?.customerName?.split(' ')[0] || 'Guest',
        LAST_NAME: session.metadata?.customerName?.split(' ').slice(1).join(' ') || 'User',
        ADDRESS_STREET: orderType === ORDER_TYPE.delivery ? shippingAddress?.line1 || session.metadata?.street || '' : '',
        // Convert ZIP code to string to match the expected type
        ADDRESS_ZIP: orderType === ORDER_TYPE.delivery ? shippingAddress?.postal_code || session.metadata?.zip || '' : '',
        ADDRESS_TOWN: orderType === ORDER_TYPE.delivery ? shippingAddress?.city || session.metadata?.city || '' : '',
        ADDRESS_COUNTRY_CODE: shippingAddress?.country || session.metadata?.country || 'CH',
        // Using PHONE_NUMBER to match the Prisma schema
        PHONE_NUMBER: customerDetails?.phone || session.metadata?.customerPhone || '',
        EMAIL_ADDRESS: session.customer_email || session.metadata?.customerEmail || '',
        ORDER_GROSS_AMOUNT: orderTotal,
        ORDER_NET_AMOUNT: orderTotal,
        ORDER_AMOUNT: orderTotal,
        SHIPPING_CHARGES: shippingCharges,
        ORDER_FINAL_AMOUNT: finalTotal,
        // Note: Additional order details will be stored in the database via raw SQL
      },
    });

    // Create order details for each item
    for (const item of lineItems) {
      const product = item.price?.product as Stripe.Product;
      const productId = parseInt(product.metadata?.productId || '0', 10);
      
      if (productId) {
        await prisma.$executeRaw`
          INSERT INTO business_order_detail (
            BUSINESS_ORDER_DETAIL_ID,
            CREATION_DATETIME,
            BUSINESS_ORDER_ID,
            BUSINESS_PRODUCT_ID,
            ORDER_QUANTITY,
            PRODUCT_SELL_PRICE,
            PRODUCT_PRICE,
            QUANTITY_BALANCE
          ) VALUES (
            ${generateTemporaryId()},
            NOW(),
            ${newOrder.BUSINESS_ORDER_ID},
            ${productId},
            ${item.quantity || 1},
            ${(item.price?.unit_amount || 0) / 100},
            ${(item.amount_total || 0) / 100},
            ${item.quantity || 1}
          )
        `;
      }
    }

    // Set delivery time to 1 hour from now
    const deliveryTime = new Date();
    deliveryTime.setHours(deliveryTime.getHours() + 1);
    
    // Update order with delivery time
    await prisma.$executeRaw`
      UPDATE business_order 
      SET DELIVERY_DATETIME = ${deliveryTime}
      WHERE BUSINESS_ORDER_ID = ${newOrder.BUSINESS_ORDER_ID}
    `;

    // Get order items from line items
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    // Process each line item from Stripe
    for (const item of lineItems) {
      const product = item.price?.product as Stripe.Product;
      const amount = item.amount_total || 0;
      const quantity = item.quantity || 1;
      
      orderItems.push({
        id: parseInt(product.metadata?.productId || '0', 10),
        name: product.name || 'Product',
        price: amount / 100, // Convert to currency
        quantity: quantity
      });
      
      subtotal += amount;
    }
    
    // Convert to currency
    subtotal = subtotal / 100;
    const total = finalTotal;

    return NextResponse.json({ 
      success: true, 
      orderId: newOrder.BUSINESS_ORDER_ID,
      orderNumber: `ORD-${newOrder.BUSINESS_ORDER_ID}`,
      customerId: customerId || undefined,
      customerName: session.metadata?.customerName || 'Customer',
      customerEmail: session.customer_email || session.metadata?.customerEmail || '',
      shipping: {
        address: {
          line1: orderType === ORDER_TYPE.delivery ? shippingAddress?.line1 || session.metadata?.street || '' : '',
          city: orderType === ORDER_TYPE.delivery ? shippingAddress?.city || session.metadata?.city || '' : '',
          postal_code: orderType === ORDER_TYPE.delivery ? shippingAddress?.postal_code || session.metadata?.zip || '' : '',
          country: shippingAddress?.country || session.metadata?.country || 'CH'
        }
      },
      items: orderItems.map(item => ({
        description: item.name,
        quantity: item.quantity,
        amount_total: item.price * 100, // In cents
        price: {
          unit_amount: item.price * 100 / item.quantity, // Per unit price in cents
          product: {
            name: item.name,
            metadata: {
              productId: item.id.toString()
            }
          }
        }
      })),
      amount_subtotal: subtotal * 100, // In cents
      amount_total: total * 100, // In cents
      shipping_amount: shippingCharges * 100,
      orderType,
      payment_method_types: ['card']
    });

  } catch (error) {
    console.error('Error verifying order:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { success: false, error: `Order verification failed: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}
