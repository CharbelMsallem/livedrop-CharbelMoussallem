import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "outline", "danger"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    children: {
      control: { type: "text" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};
