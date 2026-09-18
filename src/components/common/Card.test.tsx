import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card';

describe('Card component', () => {
  it('renders children properly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByText('Elevated')).toHaveClass(
      'bg-m3-surface-container-low',
    );

    rerender(<Card variant="outlined">Outlined</Card>);
    expect(screen.getByText('Outlined')).toHaveClass(
      'border-m3-outline-variant',
    );

    rerender(<Card variant="filled">Filled</Card>);
    expect(screen.getByText('Filled')).toHaveClass(
      'bg-m3-surface-container-highest',
    );
  });

  it('handles click events when clickable is true', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Card clickable onClick={handleClick}>
        Clickable Card
      </Card>,
    );

    const card = screen.getByText('Clickable Card');
    expect(card).toHaveClass('cursor-pointer');
    await user.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
