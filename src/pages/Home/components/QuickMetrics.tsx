import React from 'react';
import { Package, Truck, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/common/Card';

export const QuickMetrics: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <Card
        variant="filled"
        className="space-y-1 bg-m3-surface-container-high p-3 text-center"
      >
        <div className="flex justify-center text-m3-primary">
          <Package className="h-5 w-5" />
        </div>
        <div className="text-base font-bold text-m3-on-surface">1,590</div>
        <div className="text-[10px] font-medium text-m3-on-surface-variant">
          Bales Ready
        </div>
      </Card>

      <Card
        variant="filled"
        className="space-y-1 bg-m3-surface-container-high p-3 text-center"
      >
        <div className="flex justify-center text-m3-primary">
          <Truck className="h-5 w-5" />
        </div>
        <div className="text-base font-bold text-m3-on-surface">3 Loads</div>
        <div className="text-[10px] font-medium text-m3-on-surface-variant">
          En Route
        </div>
      </Card>

      <Card
        variant="filled"
        className="space-y-1 bg-m3-surface-container-high p-3 text-center"
      >
        <div className="flex justify-center text-m3-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="text-base font-bold text-m3-on-surface">99.4%</div>
        <div className="text-[10px] font-medium text-m3-on-surface-variant">
          Purity Rating
        </div>
      </Card>
    </div>
  );
};
