import { ArrowDownLeft, DollarSign } from 'lucide-react';
import React from 'react';
import { cn } from '../../../../utils/cn';
import './PurchaseTypeSelector.css';

export interface PurchaseTypeSelectorProps {
  activeType: 'PURCHASE' | 'EXPENSE';
  onChange: (_type: 'PURCHASE' | 'EXPENSE') => void;
}

export const PurchaseTypeSelector: React.FC<PurchaseTypeSelectorProps> = ({
  activeType,
  onChange,
}) => {
  return (
    <div className="hs-purchase-type-selector">
      <button
        type="button"
        onClick={() => onChange('PURCHASE')}
        className={cn(
          'hs-purchase-type-selector__button',
          activeType === 'PURCHASE' &&
            'hs-purchase-type-selector__button--active-purchase',
        )}
      >
        <DollarSign className="h-4 w-4" />
        <span>Stock Purchase</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('EXPENSE')}
        className={cn(
          'hs-purchase-type-selector__button',
          activeType === 'EXPENSE' &&
            'hs-purchase-type-selector__button--active-expense',
        )}
      >
        <ArrowDownLeft className="h-4 w-4" />
        <span>Farm Expense</span>
      </button>
    </div>
  );
};
