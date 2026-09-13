import React from 'react';
import { ShieldCheck, Truck, Heart } from 'lucide-react';
import { Chip } from '../../../components/common/Chip';

interface QuickActionsProps {
  favoritesCount: number;
  onLabReportsClick: () => void;
  onTrackFreightClick: () => void;
  onSavedItemsClick: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  favoritesCount,
  onLabReportsClick,
  onTrackFreightClick,
  onSavedItemsClick,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
        Quick Actions
      </h3>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        <Chip
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          onClick={onLabReportsClick}
        >
          Lab Reports
        </Chip>
        <Chip
          icon={<Truck className="h-3.5 w-3.5" />}
          onClick={onTrackFreightClick}
        >
          Track Freight
        </Chip>
        <Chip
          icon={<Heart className="h-3.5 w-3.5" />}
          onClick={onSavedItemsClick}
        >
          Saved Items ({favoritesCount})
        </Chip>
      </div>
    </div>
  );
};
