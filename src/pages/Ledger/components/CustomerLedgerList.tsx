import { ChevronRight } from 'lucide-react';
import React from 'react';
import { Card } from '../../../components/common/Card';
import { Customer } from '../../../types';
import { formatRupee } from '../../../utils/formatters';

export interface CustomerLedgerListProps {
  customers: Customer[];
  onSelectCustomer: (_customerId: string) => void;
}

export const CustomerLedgerList: React.FC<CustomerLedgerListProps> = ({
  customers,
  onSelectCustomer,
}) => {
  return (
    <Card variant="filled" className="space-y-2 bg-m3-surface-container p-4">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-bold text-m3-on-surface">
          Customer Accounts
        </h3>
        <span className="text-[11px] font-semibold text-m3-on-surface-variant">
          {customers.length} Customers
        </span>
      </div>

      <div className="max-h-[65vh] divide-y divide-m3-outline-variant/40 overflow-y-auto">
        {customers.length === 0 ? (
          <p className="py-6 text-center text-xs text-m3-on-surface-variant">
            No customer accounts found.
          </p>
        ) : (
          customers.map((c) => {
            const due = c.outstandingAmount || 0;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-3.5 transition-colors hover:bg-m3-primary-container"
              >
                <div className="min-w-0 flex-1 space-y-0.5 pr-2">
                  <span className="block truncate text-xs font-semibold text-m3-on-surface">
                    {c.name}
                  </span>
                  {c.mobile ? (
                    <p className="text-[10px] text-m3-on-surface-variant">
                      {c.mobile}
                    </p>
                  ) : (
                    <p className="text-[10px] text-m3-on-surface-variant">
                      Limit: {formatRupee(c.creditLimit || 35000)}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <span
                      className={`block text-xs font-bold ${
                        due > 0 ? 'text-m3-error' : 'text-emerald-600'
                      }`}
                    >
                      {due > 0 ? formatRupee(due) : 'All Clear'}
                    </span>
                    <span className="text-[9px] text-m3-on-surface-variant">
                      {due > 0 ? 'Due Balance' : 'Zero Due'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
