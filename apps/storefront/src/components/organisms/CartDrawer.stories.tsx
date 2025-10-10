import type { Meta, StoryObj } from '@storybook/react';
import { CartDrawer } from './CartDrawer';
import { useCartStore } from '../../lib/store';

const meta: Meta<typeof CartDrawer> = {
  title: 'Organisms/CartDrawer',
  component: CartDrawer,
};

export default meta;
type Story = StoryObj<typeof CartDrawer>;

export const Empty: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Closed!'),
  },
  decorators: [
    (Story) => {
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
      useCartStore.setState({
        items: [
          { id: 'p1', title: '13-inch Laptop with M3 Chip', price: 1200, quantity: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80', tags: [], stockQty: 10, description: '' },
          { id: 'p2', title: 'Noise-Cancelling Headphones', price: 350, quantity: 2, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80', tags: [], stockQty: 10, description: '' },
        ],
        getTotal: () => 1900,
      });
      return <Story />;
    },
  ],
};