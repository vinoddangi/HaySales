import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Transaction } from '../../../types';
import { TransactionHistoryItem } from './TransactionHistoryItem';

describe('TransactionHistoryItem component', () => {
  it('renders payment transaction correctly', () => {
    const tx: Transaction = {
      id: 'tx-pay-1',
      type: 'PAYMENT',
      paymentAmount: 5000,
      customerName: 'Ramesh Patel',
      date: '2026-09-18T10:00:00.000Z',
    };

    render(<TransactionHistoryItem transaction={tx} isCleared={false} />);

    expect(screen.getByText('Payment Received')).toBeInTheDocument();
    expect(screen.getByText('Cash In')).toBeInTheDocument();
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
  });

  it('renders 100% cash sale transaction correctly', () => {
    const tx: Transaction = {
      id: 'tx-cash-1',
      type: 'SALE',
      item: 'Wheat Straw',
      amount: 4500,
      cashPaid: 4500,
      remainingDue: 0,
      weightKg: 1000,
      date: '2026-09-18T10:00:00.000Z',
    };

    render(<TransactionHistoryItem transaction={tx} isCleared={false} />);

    expect(screen.getByText('Cash Sale: Wheat Straw')).toBeInTheDocument();
    expect(screen.getByText('💵 100% Cash')).toBeInTheDocument();
    expect(screen.getByText('Paid in Full (₹0 Due)')).toBeInTheDocument();
    expect(screen.getByText(/₹4,500/)).toBeInTheDocument();
  });

  it('renders credit sale and highlights cleared status', () => {
    const tx: Transaction = {
      id: 'tx-credit-1',
      type: 'SALE',
      item: 'Bhoosa',
      amount: 10000,
      cashPaid: 2000,
      remainingDue: 8000,
      weightKg: 2000,
      date: '2026-09-18T10:00:00.000Z',
    };

    render(<TransactionHistoryItem transaction={tx} isCleared={true} />);

    expect(screen.getByText('Sale: Bhoosa')).toBeInTheDocument();
    expect(screen.getByText('Part-Cash')).toBeInTheDocument();
    expect(screen.getByText('0 DUE • ALL CLEAR')).toBeInTheDocument();
    expect(screen.getByText(/Total:\s*₹10,000/)).toBeInTheDocument();
    expect(screen.getByText(/Cash:\s*₹2,000/)).toBeInTheDocument();
    expect(screen.getByText(/Due:\s*₹8,000/)).toBeInTheDocument();
  });
});
