import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when the disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click Me</Button>);
    
    // Corrected: Get the button by its role to ensure we select the <button> tag
    const button = screen.getByRole('button', { name: /click me/i });
    
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant and size classes', () => {
    render(<Button variant="danger" size="lg">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button.className).toContain('bg-red-600'); // danger variant
    expect(button.className).toContain('px-7'); // lg size
  });
});