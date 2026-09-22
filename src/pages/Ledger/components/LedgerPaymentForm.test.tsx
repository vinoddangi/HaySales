import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LedgerPaymentForm } from './LedgerPaymentForm';

describe('LedgerPaymentForm component', () => {
  it('renders payment fields and disables submit if payment is 0', () => {
    const handlePay = vi.fn().mockResolvedValue(undefined);
    render(
      <LedgerPaymentForm
        outstandingDue={5000}
        isPaying={false}
        onPay={handlePay}
      />,
    );

    expect(screen.getByText('Record Payment')).toBeInTheDocument();
    const submitButton = screen.getByRole('button', {
      name: 'Process Payment',
    });
    expect(submitButton).toBeDisabled();
  });

  it('submits valid payment amount', async () => {
    const handlePay = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <LedgerPaymentForm
        outstandingDue={5000}
        isPaying={false}
        onPay={handlePay}
      />,
    );

    const input = screen.getByPlaceholderText('0');
    await user.type(input, '2500');

    const submitButton = screen.getByRole('button', {
      name: 'Process Payment',
    });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(handlePay).toHaveBeenCalledWith(2500, expect.any(String), 0);
  });

  it('allows settling full balance via checkbox', async () => {
    const handlePay = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <LedgerPaymentForm
        outstandingDue={5000}
        isPaying={false}
        onPay={handlePay}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    const submitButton = screen.getByRole('button', {
      name: 'Process Payment',
    });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(handlePay).toHaveBeenCalledWith(5000, expect.any(String), 0);
  });

  it('submits payment with discount when partial amount entered and settle full balance checked', async () => {
    const handlePay = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <LedgerPaymentForm
        outstandingDue={5000}
        isPaying={false}
        onPay={handlePay}
      />,
    );

    const input = screen.getByPlaceholderText('0');
    await user.type(input, '4500');

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    const submitButton = screen.getByRole('button', {
      name: 'Process Payment',
    });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    // 4500 cash paid, 500 discount given
    expect(handlePay).toHaveBeenCalledWith(4500, expect.any(String), 500);
  });
});
