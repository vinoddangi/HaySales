import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ServiceForm } from './ServiceForm';

describe('ServiceForm component', () => {
  it('renders service type dropdown, amount, and note fields', () => {
    const handleSubmit = vi.fn();
    render(
      <ServiceForm
        outstandingDue={1000}
        isCreditAllowed={true}
        isSaving={false}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByText(/service item/i)).toBeInTheDocument();
    expect(screen.getByText(/amount \(₹\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /record service/i }),
    ).toBeDisabled();
  });

  it('submits service transaction when valid data is provided', () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ServiceForm
        outstandingDue={0}
        isCreditAllowed={true}
        isSaving={false}
        onSubmit={handleSubmit}
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Tractor' } });

    const [amountInput] = screen.getAllByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const submitBtn = screen.getByRole('button', { name: /record service/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        item: 'Tractor',
        amount: 1500,
        cashPaid: 0,
      }),
    );
  });
});
