import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';

// Mock dependencies
vi.mock('../../lib/store', () => ({
  useCartStore: (selector: (state: any) => any) => {
    const state = {
      getItemCount: () => 5,
    };
    return selector(state);
  },
}));

vi.mock('../../lib/router', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className: string }) => <a href={to} className={className}>{children}</a>,
}));

describe('Header', () => {
  const mockOnCartOpen = vi.fn();
  const mockOnSupportOpen = vi.fn();

  it('renders the brand name', () => {
    render(<Header onCartOpen={mockOnCartOpen} onSupportOpen={mockOnSupportOpen} />);
    expect(screen.getByText('Shoplite')).toBeInTheDocument();
  });

  it('displays the correct item count in the cart', () => {
    render(<Header onCartOpen={mockOnCartOpen} onSupportOpen={mockOnSupportOpen} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onSupportOpen when the support button is clicked', () => {
    render(<Header onCartOpen={mockOnCartOpen} onSupportOpen={mockOnSupportOpen} />);
    fireEvent.click(screen.getByText('Support'));
    expect(mockOnSupportOpen).toHaveBeenCalledTimes(1);
  });
});