import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SaleForm } from './SaleForm';

describe('SaleForm component', () => {
  it('renders inputs for date, item type, weight, and amount', () => {
    const handleSubmit = vi.fn();
    render(
      <SaleForm
        outstandingDue={5000}
        isCreditAllowed={true}
        isSaving={false}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByText(/item type/i)).toBeInTheDocument();
    expect(screen.getByText(/weight \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByText(/amount \(₹\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /process sale/i }),
    ).toBeDisabled();
  });

  it('submits sale data when valid values are entered', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <SaleForm
        outstandingDue={0}
        isCreditAllowed={true}
        isSaving={false}
        onSubmit={handleSubmit}
      />,
    );

    // Select crop type
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Chana' } });

    // Enter weight and amount
    const inputs = screen.getAllByRole('spinbutton');
    // inputs[0] is weight, inputs[1] is amount
    fireEvent.change(inputs[0], { target: { value: '100' } });
    fireEvent.change(inputs[1], { target: { value: '3000' } });

    const submitBtn = screen.getByRole('button', { name: /process sale/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        item: 'Chana',
        weightKg: 100,
        amount: 3000,
        cashPaid: 0,
      }),
    );
  });

  it('shows backup banner and blocks submission when CY date is selected with pending backup', () => {
    const handleSubmit = vi.fn();
    render(
      <SaleForm
        outstandingDue={0}
        isCreditAllowed={true}
        isSaving={false}
        hasPendingBackup={true}
        currentYear={2026}
        onSubmit={handleSubmit}
      />,
    );

    expect(
      screen.getByText(/Annual Backup Required for 2026/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /backup required for 2026/i }),
    ).toBeDisabled();
  });

  it('allows submission when backdated PY date is selected even if pending backup is true', () => {
    const handleSubmit = vi.fn();
    const { container } = render(
      <SaleForm
        outstandingDue={0}
        isCreditAllowed={true}
        isSaving={false}
        hasPendingBackup={true}
        currentYear={2026}
        onSubmit={handleSubmit}
      />,
    );

    const dateInput = container.querySelector('input[type="date"]')!;
    fireEvent.change(dateInput, { target: { value: '2025-11-15' } });

    expect(
      screen.queryByText(/Annual Backup Required for 2026/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /process sale/i }),
    ).toBeInTheDocument();
  });
});
