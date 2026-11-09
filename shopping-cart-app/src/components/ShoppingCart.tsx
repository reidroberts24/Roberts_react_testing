import { useState } from 'react';
import {
  CartItem,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  formatCurrency,
} from '../utils/cartUtils';

export function ShoppingCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const addItem = () => {
    if (!productName.trim() || !productPrice) {
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      return;
    }

    const newItem: CartItem = {
      id: Date.now(),
      name: productName.trim(),
      price: price,
      quantity: 1,
    };

    setItems([...items, newItem]);
    setProductName('');
    setProductPrice('');
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal);
  const tax = calculateTax(subtotal - discount);
  const total = calculateTotal(items);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Shopping Cart</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Product name"
          aria-label="Product name"
        />
        <input
          type="number"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
          placeholder="Price"
          aria-label="Product price"
        />
        <button onClick={addItem}>Add to Cart</button>
      </div>

      {items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {items.map((item) => (
              <li key={item.id} style={{ marginBottom: '10px' }}>
                <span>{item.name}</span> -
                <span>{formatCurrency(item.price)}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                  min="1"
                  style={{ width: '60px', margin: '0 10px' }}
                  aria-label={`Quantity for ${item.name}`}
                />
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '10px' }}>
            <p>Subtotal: {formatCurrency(subtotal)}</p>
            <p>Discount: -{formatCurrency(discount)}</p>
            <p>Tax: {formatCurrency(tax)}</p>
            <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
              Total: {formatCurrency(total)}
            </p>
          </div>

          <button onClick={clearCart} style={{ marginTop: '10px' }}>
            Clear Cart
          </button>
        </>
      )}
    </div>
  );
}
