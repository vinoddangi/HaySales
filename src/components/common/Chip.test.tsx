import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip component', () => {
  it('renders label and handles click', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Chip onClick={handleClick}>Organic</Chip>);
    const chip = screen.getByRole('button', { name: 'Organic' });
    expect(chip).toBeInTheDocument();
    await user.click(chip);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders checkmark when selected', () => {
    const { container } = render(<Chip selected>Selected Filter</Chip>);
    expect(container.querySelector('svg')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Selected Filter' });
    expect(button).toHaveClass('bg-m3-secondary-container');
  });

  it('renders custom icon when not selected', () => {
    render(
      <Chip icon={<span data-testid="custom-icon">*</span>}>With Icon</Chip>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
