import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './TextField';

describe('TextField component', () => {
  it('renders label and handles typing', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TextField
        label="Customer Name"
        placeholder="Enter name"
        onChange={handleChange}
      />,
    );

    expect(screen.getByLabelText('Customer Name')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Enter name');
    await user.type(input, 'John');
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('John');
  });

  it('renders error and supporting text', () => {
    const { rerender } = render(
      <TextField label="Phone" supportingText="Format: 10 digits" />,
    );
    expect(screen.getByText('Format: 10 digits')).toBeInTheDocument();

    rerender(<TextField label="Phone" error="Invalid phone number" />);
    expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
  });

  it('handles trailing icon click', async () => {
    const handleIconClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TextField
        label="Search"
        trailingIcon={<span data-testid="trailing-icon">X</span>}
        onTrailingIconClick={handleIconClick}
      />,
    );

    const iconButton = screen.getByRole('button');
    await user.click(iconButton);
    expect(handleIconClick).toHaveBeenCalledTimes(1);
  });
});
