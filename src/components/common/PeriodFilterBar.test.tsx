import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeriodFilterBar } from './PeriodFilterBar';

describe('PeriodFilterBar component', () => {
  it('renders period filter mode buttons', () => {
    const handleFilterModeChange = vi.fn();
    const handleMonthChange = vi.fn();

    render(
      <PeriodFilterBar
        filterMode="currentMonth"
        selectedMonth={8}
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />,
    );

    expect(
      screen.getByRole('button', { name: /current month/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ytd/i })).toBeInTheDocument();
  });

  it('triggers onFilterModeChange when clicking YTD', () => {
    const handleFilterModeChange = vi.fn();
    const handleMonthChange = vi.fn();

    render(
      <PeriodFilterBar
        filterMode="currentMonth"
        selectedMonth={8}
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /ytd/i }));
    expect(handleFilterModeChange).toHaveBeenCalledWith('ytd');
  });

  it('triggers onMonthChange when selecting month from dropdown', () => {
    const handleFilterModeChange = vi.fn();
    const handleMonthChange = vi.fn();

    render(
      <PeriodFilterBar
        filterMode="currentMonth"
        selectedMonth={8}
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '4' } });
    expect(handleMonthChange).toHaveBeenCalledWith(4);
    expect(handleFilterModeChange).toHaveBeenCalledWith('customMonth');
  });
});
