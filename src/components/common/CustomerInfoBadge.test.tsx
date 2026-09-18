import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomerInfoBadge } from './CustomerInfoBadge';

describe('CustomerInfoBadge component', () => {
  const mockCustomer = {
    id: 'cust-1',
    name: 'Rajesh Patel',
    phone: '9876543210',
    address: 'Farm House #4',
    creditLimit: 50000,
    currentBalance: 12000,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders customer name and due balance', () => {
    render(
      <CustomerInfoBadge customer={mockCustomer} outstandingDue={15000} />,
    );

    expect(screen.getByText('Rajesh Patel')).toBeInTheDocument();
    expect(screen.getByText('₹15,000.00')).toBeInTheDocument();
  });

  it('shows Credit OK when due is below credit limit', () => {
    render(
      <CustomerInfoBadge customer={mockCustomer} outstandingDue={10000} />,
    );

    expect(screen.getByText(/Credit OK/)).toBeInTheDocument();
  });

  it('shows Above Limit warning when due exceeds credit limit', () => {
    render(
      <CustomerInfoBadge customer={mockCustomer} outstandingDue={60000} />,
    );

    expect(screen.getByText(/Above.*Limit/)).toBeInTheDocument();
  });
});
