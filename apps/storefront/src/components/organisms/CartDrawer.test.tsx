import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartDrawer } from './CartDrawer';
import { CartItem as CartItemType } from '../../lib/api';
import { useCartStore } from '../../lib/store';

// --- Mock Dependencies ---

// Mock the router
const mockNavigate = vi.fn();
vi.mock('../../lib/router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

// Mock the CartItem molecule to isolate the test
vi.mock('../molecules/CartItem', () => ({
  CartItem: ({ item }: { item: CartItemType }) => <div data-testid="cart-item">{item.name}</div>,
}));

// Mock the entire store module
vi.mock('../../lib/store');

// --- Test Suite ---

describe('CartDrawer', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    // Cast the mock to the correct type and set its return value
    vi.mocked(useCartStore).mockReturnValue({ items: [], getTotal: () => 0 });

    const { container } = render(<CartDrawer isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true and cart is empty', () => {
    vi.mocked(useCartStore).mockReturnValue({ items: [], getTotal: () => 0 });

    render(<CartDrawer isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders cart items when cart is not empty', () => {
    const mockItems = [{ id: 'p1', title: 'Test Item', price: 10, quantity: 1, image: '', tags: [], stockQty: 10, description: '' }];
    vi.mocked(useCartStore).mockReturnValue({ items: mockItems, getTotal: () => 10 });

    render(<CartDrawer isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('cart-item')).toBeInTheDocument();
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });
  
  it('calls navigate when "Proceed to Checkout" is clicked', () => {
    const mockItems = [{ id: 'p1', title: 'Test Item', price: 10, quantity: 1, image: '', tags: [], stockQty: 10, description: '' }];
    vi.mocked(useCartStore).mockReturnValue({ items: mockItems, getTotal: () => 10 });

    render(<CartDrawer isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Proceed to Checkout'));
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
  });
});