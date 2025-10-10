import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SupportPanel } from './SupportPanel';
import * as AssistantEngine from '../../assistant/engine';

// Mock the assistant engine
const mockProcessQuery = vi.spyOn(AssistantEngine, 'processQuery');

describe('SupportPanel', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<SupportPanel isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the panel when isOpen is true', () => {
    render(<SupportPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Ask Support')).toBeInTheDocument();
  });

  it('calls processQuery on form submission', async () => {
    mockProcessQuery.mockResolvedValue('This is a mock response.');
    render(<SupportPanel isOpen={true} onClose={() => {}} />);
    
    const input = screen.getByPlaceholderText('Type your question here...');
    const submitButton = screen.getByText('Submit Question');

    fireEvent.change(input, { target: { value: 'What is the return policy?' } });
    fireEvent.click(submitButton);

    expect(mockProcessQuery).toHaveBeenCalledWith('What is the return policy?');
  });
});