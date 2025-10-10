import type { Meta, StoryObj } from '@storybook/react';
import { SupportPanel } from './SupportPanel';

const meta: Meta<typeof SupportPanel> = {
  title: 'Organisms/SupportPanel',
  component: SupportPanel,
};

export default meta;
type Story = StoryObj<typeof SupportPanel>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => alert('Closed!'),
  },
};