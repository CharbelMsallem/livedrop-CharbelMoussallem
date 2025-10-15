import type { Meta, StoryObj } from '@storybook/react';
import { ProductGrid } from './ProductGrid';
import { Product } from '../../lib/api';

const mockProducts: Product[] = [
  { _id: 'p001', name: '4K Ultra HD Smart TV', price: 700, imageUrl: 'https://images.unsplash.com/photo-1593784944564-e4686a02b3a3?auto=format&fit=crop&w=300&q=80', tags: ['TV', 'Smart Home'], stock: 50, description: '', category: 'Electronics' },
  { _id: 'p003', name: '13-inch Laptop with M3 Chip', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80', tags: ['Computer', 'Laptop'], stock: 30, description: '', category: 'Electronics' },
  // ... add more mock products with the correct structure
];


const meta: Meta<typeof ProductGrid> = {
  title: 'Organisms/ProductGrid',
  component: ProductGrid,
};

export default meta;
type Story = StoryObj<typeof ProductGrid>;

export const Default: Story = {
  args: {
    products: mockProducts,
  },
};

export const Empty: Story = {
  args: {
    products: [],
  },
};