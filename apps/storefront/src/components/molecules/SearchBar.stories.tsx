import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from './SearchBar';
import { useState } from 'react';

const meta: Meta<typeof SearchBar> = {
  title: 'Molecules/SearchBar',
  component: SearchBar,
  decorators: [
    // This decorator provides state management to the story
    (Story) => {
      const [value, setValue] = useState('');
      return <Story args={{ value, onChange: setValue }} />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  args: {
    placeholder: 'Search for products...',
  },
};