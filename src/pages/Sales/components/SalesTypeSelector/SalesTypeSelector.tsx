import { DollarSign, Wrench } from 'lucide-react';
import React from 'react';
import { cn } from '../../../../utils/cn';
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
      <button
        type="button"
        onClick={() => onChange('SALE')}
        className={cn(
          'hs-sales-type-selector__button',
          activeType === 'SALE' &&
            'hs-sales-type-selector__button--active-sale',
        )}
      >
        <DollarSign className="h-4 w-4" />
        <span>Crop Sales</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('SERVICE')}
        className={cn(
          'hs-sales-type-selector__button',
          activeType === 'SERVICE' &&
            'hs-sales-type-selector__button--active-service',
        )}
      >
        <Wrench className="h-4 w-4" />
        <span>Service Income</span>
      </button>
    </div>
  );
};
