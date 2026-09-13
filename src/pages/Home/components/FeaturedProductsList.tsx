import React from 'react';
import { Heart } from 'lucide-react';
import { Card } from '../../../components/common/Card';

interface FeaturedItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  price: number;
  unit: string;
  stock: number;
}

interface FeaturedProductsListProps {
  featuredItems: FeaturedItem[];
  favorites: string[];
  onNavigateToItem: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onViewAll: () => void;
}

export const FeaturedProductsList: React.FC<FeaturedProductsListProps> = ({
  featuredItems,
  favorites,
  onNavigateToItem,
  onToggleFavorite,
  onViewAll,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-m3-on-surface">
          Featured Products
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-m3-primary hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {featuredItems.map((item) => {
          const isFav = favorites.includes(item.id);
          return (
            <Card
              key={item.id}
              variant="outlined"
              clickable
              onClick={() => onNavigateToItem(item.id)}
              className="group relative flex items-center gap-3 p-3 hover:border-m3-primary/40"
            >
              {/* Product Thumbnail */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-m3-md bg-m3-surface-container-high">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {item.badge && (
                  <span className="backdrop-blur-xs absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-m3-on-surface">
                  {item.title}
                </h4>
                <p className="mt-0.5 truncate text-xs text-m3-on-surface-variant">
                  {item.subtitle}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-sm font-bold text-m3-primary">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-m3-on-surface-variant">
                      {' '}
                      / {item.unit}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    {item.stock} in stock
                  </span>
                </div>
              </div>

              {/* Favorite Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id, isFav);
                }}
                className="self-start rounded-full p-2 text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-highest"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFav
                      ? 'fill-m3-primary text-m3-primary'
                      : 'text-m3-outline'
                  }`}
                />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
