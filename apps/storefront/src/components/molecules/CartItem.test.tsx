import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartItem } from './CartItem';
import { CartItem as CartItemType } from '../../lib/api';

const mockItem: CartItemType = {
  _id: 'p1',
  name: 'Test Cart Item',
  price: 50.00,
  imageUrl: 'https://via.placeholder.com/150',
  tags: [],
  stock: 10,
  description: '',
  quantity: 2,
  category: 'Test'
};


// Mock dependencies
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
vi.mock('../../lib/store', () => ({
  useCartStore: () => ({
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
  }),
}));

describe('CartItem', () => {
  it('renders item information correctly', () => {
    render(<CartItem item={mockItem} />);
    expect(screen.getByText('Test Cart Item')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Price per item
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // Total price
    expect(screen.getByText('2')).toBeInTheDocument(); // Quantity
  });

  it('calls updateQuantity when the "+" button is clicked', () => {
    render(<CartItem item={mockItem} />);
    const increaseButton = screen.getByText('+');
    fireEvent.click(increaseButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('p1', 3);
  });

  it('calls updateQuantity when the "−" button is clicked', () => {
    render(<CartItem item={mockItem} />);
    const decreaseButton = screen.getByText('−');
    fireEvent.click(decreaseButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('p1', 1);
  });

  it('calls removeItem when the "Remove" button is clicked', () => {
    render(<CartItem item={mockItem} />);
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    expect(mockRemoveItem).toHaveBeenCalledWith('p1');
  });
});