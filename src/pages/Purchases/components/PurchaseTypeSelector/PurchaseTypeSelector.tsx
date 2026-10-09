import React from 'react';
import { IconArrowDownLeft, IconDollarSign } from '../../../../components/Icon';
import { Text } from '../../../../components/Text';
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
        <IconDollarSign size="md" />
        <Text variant="label-md" weight="bold" as="span">
          Stock Purchase
        </Text>
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
        <IconArrowDownLeft size="md" />
        <Text variant="label-md" weight="bold" as="span">
          Farm Expense
        </Text>
      </button>
    </div>
  );
};

export default PurchaseTypeSelector;
