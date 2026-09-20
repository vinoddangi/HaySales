import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeriodFilterBar } from './PeriodFilterBar';

describe('PeriodFilterBar component', () => {
  it('renders month selector in MMM format and YTD button', () => {
    const handleFilterModeChange = vi.fn();
    const handleMonthChange = vi.fn();

    render(
      <PeriodFilterBar
        filterMode="month"
        selectedMonth={8} // September -> Sep
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />,
    );

    expect(screen.getByText('Sep')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ytd/i })).toBeInTheDocument();
  });

  it('triggers onFilterModeChange when clicking YTD', () => {
    const handleFilterModeChange = vi.fn();
    const handleMonthChange = vi.fn();

    render(
      <PeriodFilterBar
        filterMode="month"
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
        filterMode="month"
        selectedMonth={8}
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />,
    );

    const select = screen.getByRole('combobox', {
      name: /select month dropdown/i,
    });
    fireEvent.change(select, { target: { value: '4' } }); // May
    expect(handleMonthChange).toHaveBeenCalledWith(4);
    expect(handleFilterModeChange).toHaveBeenCalledWith('month');
  });

  it('triggers onFilterModeChange to month when clicking on month button from YTD mode without opening dropdown', () => {
    const handleFilterModeChange = vi.fn();
    const handleMonthChange = vi.fn();

    render(
      <PeriodFilterBar
        filterMode="ytd"
        selectedMonth={8} // Sep
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />,
    );

    // When in YTD mode, no combobox dropdown is rendered on top
    expect(
      screen.queryByRole('combobox', { name: /select month dropdown/i }),
    ).not.toBeInTheDocument();

    const monthButton = screen.getByRole('button', { name: /select month/i });
    fireEvent.click(monthButton);
    expect(handleFilterModeChange).toHaveBeenCalledWith('month');
  });
});
