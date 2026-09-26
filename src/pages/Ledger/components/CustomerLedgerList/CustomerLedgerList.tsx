import { ChevronRight } from 'lucide-react';
import React from 'react';
import { CustomerLedgerSummary } from '../../../../business/ledgerBusiness';
import { Progress } from '../../../../components/Progress';
import { formatRupee } from '../../../../utils/formatters';
import './CustomerLedgerList.css';

export interface CustomerLedgerListProps {
  customers: CustomerLedgerSummary[];
  onSelectCustomer: (_customerId: string) => void;
  isLoading?: boolean;
}

export const CustomerLedgerList: React.FC<CustomerLedgerListProps> = ({
  customers,
  onSelectCustomer,
  isLoading,
}) => {
  return (
    <div className="hs-customer-ledger-list">
      <div className="hs-customer-ledger-list__header">
        <span className="hs-customer-ledger-list__title">
          Customer Accounts
        </span>
        <span className="hs-customer-ledger-list__count">
          {customers.length} Accounts
        </span>
      </div>

      {isLoading ? (
        <div className="hs-customer-ledger-list__empty">
          <Progress type="circular" indeterminate fourColor />
        </div>
      ) : customers.length === 0 ? (
        <div className="hs-customer-ledger-list__empty">
          No customer accounts found.
        </div>
      ) : (
        <div className="hs-customer-ledger-list__items">
          {customers.map((c) => {
            const hasDue = c.currentOutstanding > 0;
            return (
              <div
                key={c.customerId}
                onClick={() => onSelectCustomer(c.customerId)}
                className="hs-customer-ledger-list__item"
                role="button"
                tabIndex={0}
              >
                <div className="hs-customer-ledger-list__item-info">
                  <span className="hs-customer-ledger-list__item-name">
                    {c.customerName}
                  </span>
                  <span className="hs-customer-ledger-list__item-meta">
                    {c.transactionCount} entries • Total Billed:{' '}
                    {formatRupee(c.totalBilled)}
                  </span>
                </div>

                <div className="hs-customer-ledger-list__item-right">
                  <div className="hs-customer-ledger-list__item-due">
                    <span
                      className={`hs-customer-ledger-list__item-amount ${
                        hasDue
                          ? 'hs-customer-ledger-list__item-amount--due'
                          : 'hs-customer-ledger-list__item-amount--clear'
                      }`}
                    >
                      {hasDue ? formatRupee(c.currentOutstanding) : 'All Clear'}
                    </span>
                    <span className="hs-customer-ledger-list__item-label">
                      {hasDue ? 'Due Balance' : 'Zero Due'}
                    </span>
                  </div>
                  <ChevronRight className="text-m3-on-surface-variant h-4 w-4 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
