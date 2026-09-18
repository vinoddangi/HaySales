import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActivityCategoryTabs } from './ActivityCategoryTabs';

describe('ActivityCategoryTabs component', () => {
  it('renders Sales, Payment, and Purchase category tabs with counts', () => {
    const handleSelect = vi.fn();
    render(
      <ActivityCategoryTabs
        activeCategory="SALES"
        salesCount={12}
        paymentsCount={5}
        purchasesExpensesCount={8}
        onSelectCategory={handleSelect}
      />,
    );

    expect(
      screen.getByRole('button', { name: /sales\s*12/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /payment\s*5/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /purchase\s*8/i }),
    ).toBeInTheDocument();
  });

  it('triggers onSelectCategory on tab click', () => {
    const handleSelect = vi.fn();
    render(
      <ActivityCategoryTabs
        activeCategory="SALES"
        salesCount={12}
        paymentsCount={5}
        purchasesExpensesCount={8}
        onSelectCategory={handleSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /payment\s*5/i }));
    expect(handleSelect).toHaveBeenCalledWith('PAYMENTS');

    fireEvent.click(screen.getByRole('button', { name: /purchase\s*8/i }));
    expect(handleSelect).toHaveBeenCalledWith('PURCHASES_EXPENSES');
  });
});
