import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/common/Card';

interface Specification {
  label: string;
  value: string;
}

interface ProductSpecsGridProps {
  specifications: Specification[];
}

export const ProductSpecsGrid: React.FC<ProductSpecsGridProps> = ({
  specifications,
}) => {
  return (
    <div className="space-y-2 px-4">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
        <ShieldCheck className="h-4 w-4 text-m3-primary" />
        <span>Certified Feed Specifications</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {specifications.map((spec, idx) => (
          <Card
            key={idx}
            variant="outlined"
            className="bg-m3-surface-container-low p-2.5"
          >
            <span className="block text-[10px] font-medium text-m3-on-surface-variant">
              {spec.label}
            </span>
            <span className="mt-0.5 block text-xs font-bold text-m3-on-surface">
              {spec.value}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};
