import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'info'],
    },
    children: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Badge',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};