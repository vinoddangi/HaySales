import React from 'react';
import { FlexLayout, ToggleButton, ToggleButtonGroup } from '@salt-ds/core';
import { ArrowDownLeft, DollarSign } from 'lucide-react';
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
      <ToggleButtonGroup
        value={activeType}
        onChange={(event) => {
          const val = (event.currentTarget as HTMLButtonElement).value;
          if (val === 'PURCHASE' || val === 'EXPENSE') {
            onChange(val);
          }
        }}
        style={{ width: '100%' }}
      >
        <ToggleButton value="PURCHASE" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={1}>
            <DollarSign size={16} />
            <span>Stock Purchase</span>
          </FlexLayout>
        </ToggleButton>
        <ToggleButton value="EXPENSE" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={1}>
            <ArrowDownLeft size={16} />
            <span>Farm Expense</span>
          </FlexLayout>
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default PurchaseTypeSelector;
