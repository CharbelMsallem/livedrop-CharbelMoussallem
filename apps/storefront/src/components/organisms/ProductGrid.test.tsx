import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductGrid } from './ProductGrid';
import { Product } from '../../lib/api';

vi.mock('../molecules/ProductCard', () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid="product-card">{product.name}</div> // Changed to name
  ),
}));

const mockProducts: Product[] = [
  { _id: 'p1', name: 'Laptop', price: 1200, imageUrl: '', tags: [], stock: 10, description: '', category: 'Test' },
  { _id: 'p2', name: 'Mouse', price: 50, imageUrl: '', tags: [], stock: 100, description: '', category: 'Test' },
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