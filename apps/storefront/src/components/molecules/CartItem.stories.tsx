import type { Meta, StoryObj } from '@storybook/react';
import { CartItem } from './CartItem';

const meta: Meta<typeof CartItem> = {
  title: 'Molecules/CartItem',
  component: CartItem,
};

export default meta;
type Story = StoryObj<typeof CartItem>;

export const Default: Story = {
  args: {
    item: {
      _id: 'p1',
      name: '13-inch Laptop with M3 Chip',
      price: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80',
      quantity: 1,
      tags: [],
      stock: 10,
      description: '',
      category: 'Electronics',
    },
  },
};