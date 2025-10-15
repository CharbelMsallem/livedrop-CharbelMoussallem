import type { Meta, StoryObj } from '@storybook/react';
import { CartDrawer } from './CartDrawer';
import { useCartStore } from '../../lib/store';
import { CartItem } from '../../lib/api';

const meta: Meta<typeof CartDrawer> = {
  title: 'Organisms/CartDrawer',
  component: CartDrawer,
};

export default meta;
type Story = StoryObj<typeof CartDrawer>;

// Correctly typed mock data for the cart
const mockCartItems: CartItem[] = [
  {
    _id: 'p1',
    name: '13-inch Laptop with M3 Chip',
    price: 1200,
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80',
    tags: ['Electronics', 'Laptop'],
    stock: 10,
    description: 'A powerful and portable laptop.',
    category: 'Electronics'
  },
  {
    _id: 'p2',
    name: 'Noise-Cancelling Headphones',
    price: 350,
    quantity: 2,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
    tags: ['Audio', 'Headphones'],
    stock: 25,
    description: 'Immersive sound quality.',
    category: 'Audio'
  },
];

export const Empty: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Closed!'),
  },
  decorators: [
    (Story) => {
      // Set the store state for an empty cart
      useCartStore.setState({
        items: [],
        getTotal: () => 0,
      });
      return <Story />;
    },
  ],
};

export const WithItems: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Closed!'),
  },
  decorators: [
    (Story) => {
      // Set the store state with our corrected mock items
      useCartStore.setState({
        items: mockCartItems,
        getTotal: () => 1900, // (1200 * 1) + (350 * 2)
      });
      return <Story />;
    },
  ],
};