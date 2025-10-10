import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders with a label', () => {
    render(<Input label="Username" name="username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input label="Email" name="email" onChange={handleChange} />);
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('displays an error message', () => {
    render(<Input label="Password" name="password" error="Password is too short" />);
    expect(screen.getByText('Password is too short')).toBeInTheDocument();
  });
});