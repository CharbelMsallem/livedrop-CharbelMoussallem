import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';
import { useCartStore } from '../../lib/store';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    onCartOpen: () => alert('Cart opened!'),
    onSupportOpen: () => alert('Support opened!'),
  },
  decorators: [
    (Story) => {
      useCartStore.setState({
        items: [],
        getItemCount: () => 0,
      });
      return <Story />;
    },
  ],
};

export const WithItemsInCart: Story = {
  args: {
    onCartOpen: () => alert('Cart opened!'),
    onSupportOpen: () => alert('Support opened!'),
  },
  decorators: [
    (Story) => {
      useCartStore.setState({
        items: [{ id: 'p1', title: 'Test', price: 10, quantity: 3, image: '', tags: [], stockQty: 10, description: '' }],
        getItemCount: () => 3,
      });
      return <Story />;
    },
  ],
};