import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';
import { Product } from '../../lib/api';

const mockProduct: Product = {
  id: 'p1',
  title: 'Test Product',
  price: 99.99,
  image: 'https://via.placeholder.com/150',
  tags: ['Test', 'Mock'],
  stockQty: 15,
  description: 'A test product description.',
};

// Mock dependencies
const mockAddItem = vi.fn();
vi.mock('../../lib/store', () => ({
  useCartStore: () => mockAddItem,
}));

vi.mock('../../lib/router', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode, className: string }) => <a href={to} className={className}>{children}</a>,
}));

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('calls addItem when "Quick Add" button is clicked', () => {
    render(<ProductCard product={mockProduct} />);
    // Note: The button is only visible on hover in the UI, but it's always in the DOM for tests.
    const addButton = screen.getByText('Quick Add');
    fireEvent.click(addButton);
    expect(mockAddItem).toHaveBeenCalledWith(mockProduct);
  });
});