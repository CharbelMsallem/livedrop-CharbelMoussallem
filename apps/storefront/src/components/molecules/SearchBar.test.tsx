import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders with a placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Find products..." />);
    expect(screen.getByPlaceholderText('Find products...')).toBeInTheDocument();
  });

  it('calls onChange when the user types', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'tv' } });
    expect(handleChange).toHaveBeenCalledWith('tv');
  });

  it('displays a clear button when there is a value', () => {
    render(<SearchBar value="headphones" onChange={() => {}} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('calls onChange with an empty string when clear button is clicked', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="laptop" onChange={handleChange} />);
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);
    expect(handleChange).toHaveBeenCalledWith('');
  });
});