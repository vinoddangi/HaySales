import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Transaction } from '../../../types';
import { ActivityListItem } from './ActivityListItem';

describe('ActivityListItem component', () => {
  it('renders sale transaction item properly', () => {
    const tx: Transaction = {
      id: 'tx1',
      type: 'SALE',
      item: 'Chana',
      amount: 4000,
      weightKg: 100,
      cashPaid: 4000,
      customerName: 'Ramesh Patel',
      date: '2026-09-18T10:00:00.000Z',
    };
    const handleEdit = vi.fn();

    render(<ActivityListItem transaction={tx} onEdit={handleEdit} />);

    expect(screen.getByText('Ramesh Patel')).toBeInTheDocument();
    expect(screen.getByText(/chana/i)).toBeInTheDocument();
    expect(screen.getByText(/cash/i)).toBeInTheDocument();

    const editBtn = screen.getByTitle(/edit record/i);
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(tx);
  });

  it('renders service transaction item properly', () => {
    const tx: Transaction = {
      id: 'tx2',
      type: 'SERVICE',
      item: 'Pickup',
      amount: 1200,
      cashPaid: 0,
      remainingDue: 1200,
      customerName: 'Suresh Kumar',
      date: '2026-09-18T10:00:00.000Z',
    };
    const handleEdit = vi.fn();

    render(<ActivityListItem transaction={tx} onEdit={handleEdit} />);

    expect(screen.getByText('Suresh Kumar')).toBeInTheDocument();
    expect(screen.getAllByText(/service/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/credit/i).length).toBeGreaterThan(0);
  });
});
