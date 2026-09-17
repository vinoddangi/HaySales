import { AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';
import { Customer } from '../../store/slices/customersApi';
import { formatRupee } from '../../utils/formatters';

export interface CustomerInfoBadgeProps {
  customer: Customer;
  outstandingDue?: number;
  creditLimit?: number;
}

export const CustomerInfoBadge: React.FC<CustomerInfoBadgeProps> = ({
  customer,
  outstandingDue = 0,
  creditLimit = 35000,
}) => {
  const effectiveCreditLimit = customer.creditLimit || creditLimit;
  const isCreditAllowed = outstandingDue < effectiveCreditLimit;

  return (
    <div className="flex items-center justify-between rounded-lg border border-m3-outline bg-m3-surface-container-low p-3">
      <div>
        <p className="text-sm font-bold text-m3-on-surface">{customer.name}</p>
        <p className="text-xs text-m3-on-surface-variant">
          Outstanding Due:{' '}
          <span className="font-semibold text-m3-error">
            {formatRupee(outstandingDue)}
          </span>
        </p>
      </div>
      {isCreditAllowed ? (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
          <CheckCircle className="h-4 w-4" /> Credit OK (Limit{' '}
          {formatRupee(effectiveCreditLimit)})
        </span>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" /> Above{' '}
          {formatRupee(effectiveCreditLimit)} Limit
        </span>
      )}
    </div>
  );
};
