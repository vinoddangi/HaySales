import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Card } from '../../../components/common/Card';

interface QuantitySelectorProps {
  quantity: number;
  maxStock: number;
  totalPrice: string;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  totalPrice,
  onIncrement,
  onDecrement,
}) => {
  return (
    <div className="px-4">
      <Card variant="outlined" className="space-y-3 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-m3-on-surface">
            Order Quantity
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onDecrement}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-m3-surface-container-highest text-m3-on-surface transition-colors hover:bg-m3-surface-container-high"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-m3-on-surface">
              {quantity}
            </span>
            <button
              onClick={onIncrement}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-m3-surface-container-highest text-m3-on-surface transition-colors hover:bg-m3-surface-container-high"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-m3-outline-variant/30 pt-2 text-xs">
          <span className="text-m3-on-surface-variant">Calculated Total</span>
          <span className="text-base font-bold text-m3-primary">
            ${totalPrice}
          </span>
        </div>
      </Card>
    </div>
  );
};
