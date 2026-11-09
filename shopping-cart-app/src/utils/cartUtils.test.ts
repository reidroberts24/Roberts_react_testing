import { describe, it, expect } from 'vitest';
import {
  type CartItem,
  calculateItemTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  formatCurrency,
  isValidQuantity,
} from './cartUtils';

const makeItem = (price: number, quantity = 1, id = 1): CartItem => ({
  id,
  name: `Item ${id}`,
  price,
  quantity,
});

describe('cartUtils', () => {
  describe('calculateItemTotal', () => {
    it('should multiply price by quantity', () => {
      expect(calculateItemTotal(makeItem(10, 3))).toBe(30);
    });

    it('should return the price when quantity is 1', () => {
      expect(calculateItemTotal(makeItem(24.5))).toBe(24.5);
    });

    it('should return 0 when price is 0', () => {
      expect(calculateItemTotal(makeItem(0, 5))).toBe(0);
    });

    it('should return 0 when quantity is 0', () => {
      expect(calculateItemTotal(makeItem(10, 0))).toBe(0);
    });

    it('should handle decimal prices', () => {
      expect(calculateItemTotal(makeItem(19.99, 3))).toBeCloseTo(59.97);
    });
  });

  describe('calculateSubtotal', () => {
    it('should return 0 for an empty cart', () => {
      expect(calculateSubtotal([])).toBe(0);
    });

    it('should return the item total for a single item', () => {
      expect(calculateSubtotal([makeItem(15, 2)])).toBe(30);
    });

    it('should add up the totals of multiple items', () => {
      const items = [makeItem(10, 2, 1), makeItem(5.5, 4, 2)];
      expect(calculateSubtotal(items)).toBe(42);
    });

    it('should handle floating-point addition', () => {
      const items = [makeItem(0.1, 1, 1), makeItem(0.2, 1, 2)];
      expect(calculateSubtotal(items)).toBeCloseTo(0.3);
    });

    it('should not change the items passed in', () => {
      const items = [makeItem(10, 2)];
      calculateSubtotal(items);
      expect(items).toEqual([{ id: 1, name: 'Item 1', price: 10, quantity: 2 }]);
    });
  });

  describe('calculateDiscount', () => {
    it('should return 0 when subtotal is 0', () => {
      expect(calculateDiscount(0)).toBe(0);
    });

    it('should return 0 just below $50', () => {
      expect(calculateDiscount(49.99)).toBe(0);
    });

    it('should apply 5% at exactly $50', () => {
      expect(calculateDiscount(50)).toBeCloseTo(2.5);
    });

    it('should apply 5% between $50 and $100', () => {
      expect(calculateDiscount(75)).toBeCloseTo(3.75);
    });

    it('should still apply 5% just below $100', () => {
      expect(calculateDiscount(99.99)).toBeCloseTo(4.9995, 4);
    });

    it('should apply 10% at exactly $100', () => {
      expect(calculateDiscount(100)).toBeCloseTo(10);
    });

    it('should apply 10% above $100', () => {
      expect(calculateDiscount(1000)).toBeCloseTo(100);
    });

    it('should return 0 for a negative subtotal', () => {
      expect(calculateDiscount(-10)).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('should return 0 when amount is 0', () => {
      expect(calculateTax(0)).toBe(0);
    });

    it('should charge 8% on a whole amount', () => {
      expect(calculateTax(100)).toBeCloseTo(8);
    });

    it('should charge 8% on a decimal amount', () => {
      expect(calculateTax(19.99)).toBeCloseTo(1.5992, 4);
    });

    it('should return negative tax for a negative amount', () => {
      expect(calculateTax(-50)).toBeCloseTo(-4);
    });
  });

  describe('calculateTotal', () => {
    it('should return 0 for an empty cart', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('should only add tax when there is no discount', () => {
      expect(calculateTotal([makeItem(40)])).toBe(43.2);
    });

    it('should apply no discount just below $50', () => {
      expect(calculateTotal([makeItem(49.99)])).toBe(53.99);
    });

    it('should apply the 5% discount before tax at $50', () => {
      expect(calculateTotal([makeItem(50)])).toBe(51.3);
    });

    it('should apply the 5% discount just below $100', () => {
      expect(calculateTotal([makeItem(99.99)])).toBe(102.59);
    });

    it('should apply the 10% discount before tax at $100', () => {
      expect(calculateTotal([makeItem(100)])).toBe(97.2);
    });

    it('should use the combined subtotal to pick the discount', () => {
      const items = [makeItem(30, 2, 1), makeItem(20, 2, 2)];
      expect(calculateTotal(items)).toBe(97.2);
    });

    it('should round the result to 2 decimal places', () => {
      expect(calculateTotal([makeItem(33.33)])).toBe(36);
    });

    it('should cost less at $100 than at $99.99 because of the bigger discount', () => {
      expect(calculateTotal([makeItem(100)])).toBeLessThan(calculateTotal([makeItem(99.99)]));
    });
  });

  describe('formatCurrency', () => {
    it('should add a dollar sign and 2 decimals to a whole number', () => {
      expect(formatCurrency(5)).toBe('$5.00');
    });

    it('should format 0', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should pad a single decimal', () => {
      expect(formatCurrency(1.5)).toBe('$1.50');
    });

    it('should round down to 2 decimals', () => {
      expect(formatCurrency(1.234)).toBe('$1.23');
    });

    it('should round up to the next dollar', () => {
      expect(formatCurrency(9.999)).toBe('$10.00');
    });

    it('should show 1.005 as $1.00 because of floating-point storage', () => {
      expect(formatCurrency(1.005)).toBe('$1.00');
    });

    it('should not add thousands separators', () => {
      expect(formatCurrency(1000)).toBe('$1000.00');
    });

    it('should put the dollar sign before the minus on negatives', () => {
      expect(formatCurrency(-5)).toBe('$-5.00');
    });

    it('should always match the currency format', () => {
      expect(formatCurrency(1234.5)).toMatch(/^\$\d+\.\d{2}$/);
    });
  });

  describe('isValidQuantity', () => {
    it.each([1, 5, 1000000])('should accept the positive integer %d', (quantity) => {
      expect(isValidQuantity(quantity)).toBe(true);
    });

    it.each([0, -1, 1.5, NaN, Infinity, -Infinity])('should reject %d', (quantity) => {
      expect(isValidQuantity(quantity)).toBe(false);
    });
  });
});
