import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../components/common/Card';

interface ProductInfoProps {
  title: string;
  subtitle: string;
  price: number;
  unit: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  description: string;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  title,
  subtitle,
  price,
  unit,
  rating,
  reviewsCount,
  stock,
  description,
}) => {
  return (
    <div className="space-y-4 px-4 pt-2">
      <Card variant="filled" className="space-y-3 bg-m3-surface-container p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-m3-on-surface">{title}</h2>
            <p className="text-xs text-m3-on-surface-variant">{subtitle}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-m3-primary">
              ${price.toFixed(2)}
            </span>
            <span className="block text-[10px] text-m3-on-surface-variant">
              per {unit}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-m3-outline-variant/30 pt-3 text-xs">
          <div className="flex items-center gap-1 font-bold text-amber-500">
            <Star className="h-4 w-4 fill-amber-500" />
            <span>{rating}</span>
            <span className="font-normal text-m3-on-surface-variant">
              ({reviewsCount} verified reviews)
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {stock} in barn
          </div>
        </div>
      </Card>

      {/* Description */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
          Description
        </h3>
        <p className="text-xs leading-relaxed text-m3-on-surface">
          {description}
        </p>
      </div>
    </div>
  );
};
