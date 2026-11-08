import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('renders a label associated with the input', () => {
    render(<TextInput label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('generates an id from the label when id is omitted', () => {
    render(<TextInput label="Full Name" />);
    expect(screen.getByLabelText('Full Name')).toHaveAttribute('id', 'input-full-name');
  });

  it('uses a custom id when provided', () => {
    render(<TextInput label="Work Email" id="custom-email" />);
    expect(screen.getByLabelText('Work Email')).toHaveAttribute('id', 'custom-email');
  });

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextInput label="Text" onChange={onChange} />);

    await user.type(screen.getByLabelText('Text'), 'hi');

    expect(onChange).toHaveBeenCalled();
  });
});
