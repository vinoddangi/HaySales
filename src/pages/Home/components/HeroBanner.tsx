import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';

interface HeroBannerProps {
  onBrowseCatalog: () => void;
  onGetQuote: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onBrowseCatalog,
  onGetQuote,
}) => {
  return (
    <Card
      variant="elevated"
      className="relative overflow-hidden border border-m3-outline-variant/30 bg-gradient-to-br from-m3-primary/15 via-m3-primary-container/20 to-m3-surface-container p-5"
    >
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-m3-full bg-m3-primary px-2.5 py-1 text-[11px] font-semibold tracking-wide text-m3-on-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>2026 Harvest In Stock</span>
        </div>
        <h2 className="text-xl font-bold leading-tight text-m3-on-surface">
          Premium Sun-Cured Hay & Forage
        </h2>
        <p className="max-w-[260px] text-xs leading-relaxed text-m3-on-surface-variant">
          High protein alfalfa, certified dust-free timothy, and bulk commercial
          freight bales.
        </p>
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="filled"
            onClick={onBrowseCatalog}
            icon={<ArrowRight className="h-3.5 w-3.5" />}
            iconPosition="right"
          >
            Browse Catalog
          </Button>
          <Button size="sm" variant="tonal" onClick={onGetQuote}>
            Get Quote
          </Button>
        </div>
      </div>
    </Card>
  );
};
