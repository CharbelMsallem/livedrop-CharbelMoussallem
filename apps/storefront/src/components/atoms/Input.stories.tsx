import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'John Doe',
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    value: '123',
    error: 'Password must be at least 8 characters.',
  },
};