type CartItemLike = {
  price: number;
  quantity: number;
};

export type CartTotalsInput = {
  items: CartItemLike[];
  discount?: number;
  deliveryFee?: number;
  tax?: number;
};

export const calculateCartTotals = ({
  items,
  discount = 0,
  deliveryFee = 0,
  tax = 0,
}: CartTotalsInput) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discount + deliveryFee + tax);

  return {
    subtotal,
    discount,
    deliveryFee,
    tax,
    finalTotal,
  };
};
