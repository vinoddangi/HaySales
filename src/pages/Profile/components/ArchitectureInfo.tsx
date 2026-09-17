import { ChevronRight, Code2 } from 'lucide-react';
import React from 'react';
import { Card } from '../../../components/common/Card';

export interface ArchitectureInfoProps {
  onOpenOverview: () => void;
}

export const ArchitectureInfo: React.FC<ArchitectureInfoProps> = ({
  onOpenOverview,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
        <Code2 className="h-3.5 w-3.5 text-m3-primary" />
        <span>Skeleton Architecture</span>
      </h3>

      <Card
        variant="filled"
        clickable
        onClick={onOpenOverview}
        className="flex items-center justify-between bg-m3-surface-container-high p-3.5"
      >
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-m3-on-surface">
            React 19 + Vite 6 + Tailwind + M3 + RTK
          </div>
          <div className="text-[10px] text-m3-on-surface-variant">
            Version 1.0.0 • Mobile-first PWA ready
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
      </Card>
    </div>
  );
};
