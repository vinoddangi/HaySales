import React from 'react';
import { FlexLayout, ToggleButton, ToggleButtonGroup } from '@salt-ds/core';
import { DollarSign, Wrench } from 'lucide-react';
import './SalesTypeSelector.css';

export interface SalesTypeSelectorProps {
  activeType: 'SALE' | 'SERVICE';
  onChange: (_type: 'SALE' | 'SERVICE') => void;
}

export const SalesTypeSelector: React.FC<SalesTypeSelectorProps> = ({
  activeType,
  onChange,
}) => {
  return (
    <div className="hs-sales-type-selector">
      <ToggleButtonGroup
        value={activeType}
        onChange={(event) => {
          const val = (event.currentTarget as HTMLButtonElement).value;
          if (val === 'SALE' || val === 'SERVICE') {
            onChange(val);
          }
        }}
        style={{ width: '100%' }}
      >
        <ToggleButton value="SALE" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={1}>
            <DollarSign size={16} />
            <span>Crop Sales</span>
          </FlexLayout>
        </ToggleButton>
        <ToggleButton value="SERVICE" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={1}>
            <Wrench size={16} />
            <span>Service Income</span>
          </FlexLayout>
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default SalesTypeSelector;
