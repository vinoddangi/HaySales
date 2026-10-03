import { useMemo, useState } from 'react';
import { CustomerLedgerDetail } from '../../../../business/ledgerBusiness';
import {
  CustomerTransactionData,
  isSaleTransaction,
  isServiceTransaction,
} from '../../../../models';

export interface UseCustomerLedgerDrawerProps {
  detail: CustomerLedgerDetail | null;
  transactions: CustomerTransactionData[];
}

export function useCustomerLedgerDrawer({
  detail,
  transactions,
}: UseCustomerLedgerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'statement' | 'payment'>('statement');

  const { totalBilled, totalPaid, totalWeight, avgRate, currentOutstanding } = useMemo(() => {
    let sales = 0;
    let services = 0;
    let payments = 0;
    let weight = 0;
    let openingDue = 0;
    let discounts = 0;

    const hasExplicitOpeningTx = transactions.some((t) => t.type === 'OPENING_DUE');
    if (!hasExplicitOpeningTx && detail?.openingDue) {
      openingDue = Number(detail.openingDue) || 0;
    }

    transactions.forEach((t) => {
      if (isSaleTransaction(t)) {
        sales += Number(t.amount) || 0;
        weight += Number(t.weight) || 0;
        payments += Number(t.cashPaid) || 0;
        discounts += Number(t.discount) || 0;
      } else if (isServiceTransaction(t)) {
        services += Number(t.amount) || 0;
        payments += Number(t.cashPaid) || 0;
        discounts += Number(t.discount) || 0;
      } else if (t.type === 'PAYMENT') {
        payments += Number(t.amount) || 0;
        discounts += Number(t.discount) || 0;
      } else if (t.type === 'OPENING_DUE') {
        openingDue += Number(t.amount) || 0;
      }
    });

    const billed = Math.round(openingDue + sales + services);
    const paid = Math.round(payments);
    const avg = weight > 0 ? sales / weight : 0;
    const due = Math.round(billed - paid - discounts);

    return {
      totalBilled: billed,
      totalPaid: paid,
      totalWeight: weight,
      avgRate: avg,
      currentOutstanding: due,
    };
  }, [detail, transactions]);

  return {
    activeTab,
    setActiveTab,
    totalBilled,
    totalPaid,
    totalWeight,
    avgRate,
    currentOutstanding,
  };
}
