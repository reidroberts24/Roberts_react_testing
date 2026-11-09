import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ShoppingCart } from './ShoppingCart';

const nameInput = () => screen.getByLabelText('Product name');
const priceInput = () => screen.getByLabelText('Product price');
const addButton = () => screen.getByRole('button', { name: 'Add to Cart' });
const clearButton = () => screen.queryByRole('button', { name: 'Clear Cart' });
const quantityInput = (name: string) => screen.getByLabelText(`Quantity for ${name}`);

const setup = () => {
  const user = userEvent.setup();
  render(<ShoppingCart />);
  return user;
};

const addProduct = async (user: UserEvent, name: string, price: string) => {
  await user.type(nameInput(), name);
  await user.type(priceInput(), price);
  await user.click(addButton());
};

const replaceQuantity = async (user: UserEvent, name: string, value: string) => {
  await user.tripleClick(quantityInput(name));
  await user.paste(value);
};

const removeButtonFor = (name: string) => {
  const row = screen.getByText(name).closest('li') as HTMLElement;
  return within(row).getByRole('button', { name: 'Remove' });
};

const expectSummary = (subtotal: string, discount: string, tax: string, total: string) => {
  expect(screen.getByText(`Subtotal: ${subtotal}`)).toBeInTheDocument();
  expect(screen.getByText(`Discount: -${discount}`)).toBeInTheDocument();
  expect(screen.getByText(`Tax: ${tax}`)).toBeInTheDocument();
  expect(screen.getByText(`Total: ${total}`)).toBeInTheDocument();
};

describe('ShoppingCart', () => {
  describe('initial render', () => {
    it('should show the heading', () => {
      setup();
      expect(screen.getByRole('heading', { name: 'Shopping Cart' })).toBeInTheDocument();
    });

    it('should show empty inputs and the add button', () => {
      setup();
      expect(nameInput()).toHaveValue('');
      expect(priceInput()).toHaveValue(null);
      expect(addButton()).toBeEnabled();
    });

    it('should show the empty cart message', () => {
      setup();
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not show totals or the clear button', () => {
      setup();
      expect(screen.queryByText(/Subtotal/)).not.toBeInTheDocument();
      expect(clearButton()).not.toBeInTheDocument();
    });
  });

  describe('adding items', () => {
    it('should show the new item with its formatted price', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      const row = screen.getByRole('listitem');
      expect(within(row).getByText('Apple')).toBeInTheDocument();
      expect(within(row).getByText('$10.00')).toBeInTheDocument();
    });

    it('should format a decimal price', async () => {
      const user = setup();
      await addProduct(user, 'Pear', '9.5');
      expect(within(screen.getByRole('listitem')).getByText('$9.50')).toBeInTheDocument();
    });

    it('should start the quantity at 1', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      expect(quantityInput('Apple')).toHaveValue(1);
    });

    it('should clear the inputs after adding', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      expect(nameInput()).toHaveValue('');
      expect(priceInput()).toHaveValue(null);
    });

    it('should trim spaces around the name', async () => {
      const user = setup();
      await addProduct(user, '  Apple  ', '10');
      expect(screen.getByText('Apple').textContent).toBe('Apple');
    });

    it('should replace the empty message with the totals and clear button', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
      expect(screen.getByText(/Subtotal/)).toBeInTheDocument();
      expect(clearButton()).toBeInTheDocument();
    });

    it('should list several items in the order they were added', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await addProduct(user, 'Bread', '5');
      const rows = screen.getAllByRole('listitem');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent('Apple');
      expect(rows[1]).toHaveTextContent('Bread');
    });
  });

  describe('rejected input', () => {
    it('should not add an item with an empty name', async () => {
      const user = setup();
      await user.type(priceInput(), '10');
      await user.click(addButton());
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not add an item with a name of only spaces', async () => {
      const user = setup();
      await addProduct(user, '   ', '10');
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not add an item with an empty price', async () => {
      const user = setup();
      await user.type(nameInput(), 'Apple');
      await user.click(addButton());
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it.each(['0', '-5'])('should not add an item priced at %s', async (price) => {
      const user = setup();
      await addProduct(user, 'Apple', price);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('should keep the typed values when an item is rejected', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '0');
      expect(nameInput()).toHaveValue('Apple');
      expect(priceInput()).toHaveValue(0);
    });
  });

  describe('removing items', () => {
    it('should remove only the chosen item', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await addProduct(user, 'Bread', '5');
      await user.click(removeButtonFor('Apple'));
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    it('should update the totals after removing', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await addProduct(user, 'Bread', '5');
      await user.click(removeButtonFor('Apple'));
      expectSummary('$5.00', '$0.00', '$0.40', '$5.40');
    });

    it('should show the empty message after removing the last item', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await user.click(removeButtonFor('Apple'));
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(clearButton()).not.toBeInTheDocument();
    });
  });

  describe('updating quantity', () => {
    it('should update the quantity and totals', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await replaceQuantity(user, 'Apple', '3');
      expect(quantityInput('Apple')).toHaveValue(3);
      expectSummary('$30.00', '$0.00', '$2.40', '$32.40');
    });

    it('should only change the chosen item', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await addProduct(user, 'Bread', '5');
      await replaceQuantity(user, 'Bread', '4');
      expect(quantityInput('Apple')).toHaveValue(1);
      expect(quantityInput('Bread')).toHaveValue(4);
    });

    it.each(['0', '-2'])('should ignore a quantity of %s', async (value) => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await replaceQuantity(user, 'Apple', value);
      expect(quantityInput('Apple')).toHaveValue(1);
      expectSummary('$10.00', '$0.00', '$0.80', '$10.80');
    });

    it('should cut a decimal quantity down to a whole number', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await replaceQuantity(user, 'Apple', '2.5');
      expectSummary('$20.00', '$0.00', '$1.60', '$21.60');
    });

    it('should show $NaN when the quantity box is cleared', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await user.clear(quantityInput('Apple'));
      expectSummary('$NaN', '$0.00', '$NaN', '$NaN');
      consoleError.mockRestore();
    });
  });

  describe('calculations', () => {
    it('should give no discount under $50', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '40');
      expectSummary('$40.00', '$0.00', '$3.20', '$43.20');
    });

    it('should give no discount just below $50', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '49.99');
      expectSummary('$49.99', '$0.00', '$4.00', '$53.99');
    });

    it('should give 5% off at exactly $50', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '50');
      expectSummary('$50.00', '$2.50', '$3.80', '$51.30');
    });

    it('should give 10% off at exactly $100', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '100');
      expectSummary('$100.00', '$10.00', '$7.20', '$97.20');
    });

    it('should use all items together to pick the discount', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '30');
      await addProduct(user, 'Bread', '30');
      expectSummary('$60.00', '$3.00', '$4.56', '$61.56');
    });

    it('should move into a discount tier when quantity goes up', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '30');
      await replaceQuantity(user, 'Apple', '4');
      expectSummary('$120.00', '$12.00', '$8.64', '$116.64');
    });
  });

  describe('clearing the cart', () => {
    it('should remove every item and show the empty message', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await addProduct(user, 'Bread', '5');
      await user.click(clearButton() as HTMLElement);
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should hide the totals and clear button', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await user.click(clearButton() as HTMLElement);
      expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
      expect(clearButton()).not.toBeInTheDocument();
    });

    it('should allow adding items after clearing', async () => {
      const user = setup();
      await addProduct(user, 'Apple', '10');
      await user.click(clearButton() as HTMLElement);
      await addProduct(user, 'Bread', '5');
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expectSummary('$5.00', '$0.00', '$0.40', '$5.40');
    });
  });
});
