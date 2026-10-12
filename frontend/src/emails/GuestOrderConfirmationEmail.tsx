import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type GuestOrderConfirmationData = {
  orderNumber: string;
  restaurantName: string;
  items: Array<{ name: string; quantity: number; subtotal: string }>;
  total: string;
  paymentStatus: string;
  fulfillment: string;
  trackingUrl: string;
};

export default function GuestOrderConfirmationEmail({
  orderNumber,
  restaurantName,
  items,
  total,
  paymentStatus,
  fulfillment,
  trackingUrl,
}: GuestOrderConfirmationData) {
  return (
    <Html>
      <Head />
      <Preview>Your Foodeez order {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Order received</Heading>
          <Text>Thank you for ordering from {restaurantName}.</Text>
          <Section style={panel}>
            <Text><strong>Order:</strong> {orderNumber}</Text>
            <Text><strong>Fulfillment:</strong> {fulfillment}</Text>
            <Text><strong>Payment:</strong> {paymentStatus}</Text>
            {items.map((item, index) => (
              <Text key={`${item.name}-${index}`}>
                {item.quantity} × {item.name}: {item.subtotal}
              </Text>
            ))}
            <Text><strong>Total:</strong> {total}</Text>
          </Section>
          <Button href={trackingUrl} style={button}>Track this order</Button>
          <Text style={footer}>This private link opens only this order. Please do not share it.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "32px", maxWidth: "560px" };
const heading = { color: "#1f2937", fontSize: "24px" };
const panel = { borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", margin: "24px 0" };
const button = { backgroundColor: "#176B3A", color: "#ffffff", padding: "12px 18px", borderRadius: "6px" };
const footer = { color: "#6b7280", fontSize: "13px", marginTop: "24px" };
