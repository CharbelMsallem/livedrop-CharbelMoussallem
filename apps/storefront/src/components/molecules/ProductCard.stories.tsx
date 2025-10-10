import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';

const meta: Meta<typeof ProductCard> = {
  title: 'Molecules/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {
  args: {
    product: {
      id: 'p1',
      title: 'High-Fidelity Noise-Cancelling Headphones',
      price: 350,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
      tags: ['Audio', 'Headphones'],
      stockQty: 80,
      description: 'A test product.',
    },
  },
};