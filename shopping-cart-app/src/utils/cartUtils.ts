export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Calculates the total price for a single cart item
 */
export function calculateItemTotal(item: CartItem): number {
  return item.price * item.quantity;
}

/**
 * Calculates the subtotal for all items in the cart
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

/**
 * Calculates discount based on subtotal
 * 10% discount if subtotal >= $100
 * 5% discount if subtotal >= $50
 * No discount otherwise
 */
export function calculateDiscount(subtotal: number): number {
  if (subtotal >= 100) {
    return subtotal * 0.1;
  } else if (subtotal >= 50) {
    return subtotal * 0.05;
  }
  return 0;
}

/**
 * Calculates tax (8% of amount after discount)
 */
export function calculateTax(amount: number): number {
  return amount * 0.08;
}

/**
 * Calculates the final total (subtotal - discount + tax)
 */
export function calculateTotal(items: CartItem[]): number {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal);
  const afterDiscount = subtotal - discount;
  const tax = calculateTax(afterDiscount);
  return Number((afterDiscount + tax).toFixed(2));
}

/**
 * Formats a number as a currency string
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Validates that quantity is a positive integer
 */
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}
