import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductGrid } from './ProductGrid';
import { Product } from '../../lib/api';

// We mock the ProductCard to isolate the test to the grid itself.
vi.mock('../molecules/ProductCard', () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid="product-card">{product.title}</div>
  ),
}));

const mockProducts: Product[] = [
  { id: 'p1', title: 'Laptop', price: 1200, image: '', tags: [], stockQty: 10, description: '' },
  { id: 'p2', title: 'Mouse', price: 50, image: '', tags: [], stockQty: 100, description: '' },
];

describe('ProductGrid', () => {
  it('renders a list of products', () => {
    render(<ProductGrid products={mockProducts} />);
    const cards = screen.getAllByTestId('product-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Laptop')).toBeInTheDocument();
  });

  it('renders a "No products found" message when the products array is empty', () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });
});