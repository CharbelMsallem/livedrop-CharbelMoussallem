import type { Meta, StoryObj } from '@storybook/react';
import { ProductGrid } from './ProductGrid';

const mockProducts = [
  { id: 'p001', title: '4K Ultra HD Smart TV', price: 700, image: 'https://images.unsplash.com/photo-1593784944564-e4686a02b3a3?auto=format&fit=crop&w=300&q=80', tags: ['TV', 'Smart Home'], stockQty: 50, description: '' },
  { id: 'p003', title: '13-inch Laptop with M3 Chip', price: 1200, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80', tags: ['Computer', 'Laptop'], stockQty: 30, description: '' },
  { id: 'p005', title: 'Noise-Cancelling Headphones', price: 350, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80', tags: ['Audio', 'Headphones'], stockQty: 80, description: '' },
  { id: 'p004', title: 'Curved Gaming Monitor', price: 400, image: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=300&q=80', tags: ['Gaming', 'Monitor'], stockQty: 60, description: '' },
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