import React from 'react';
import { IconDollarSign, IconWrench } from '../../../../components/Icon';
import { Text } from '../../../../components/Text';
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
        <IconDollarSign size="md" />
        <Text variant="label-md" weight="bold" as="span">
          Crop Sales
        </Text>
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
        <IconWrench size="md" />
        <Text variant="label-md" weight="bold" as="span">
          Service Income
        </Text>
      </button>
    </div>
  );
};

export default SalesTypeSelector;
