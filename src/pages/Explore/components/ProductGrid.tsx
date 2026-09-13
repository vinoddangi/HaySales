import React from 'react';
import { Star, Heart } from 'lucide-react';
import { Card } from '../../../components/common/Card';

interface ProductItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  price: number;
  unit: string;
  stock: number;
  rating: number;
  reviewsCount: number;
}

interface ProductGridProps {
  items: ProductItem[];
  favorites: string[];
  onNavigateToItem: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  items,
  favorites,
  onNavigateToItem,
  onToggleFavorite,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const isFav = favorites.includes(item.id);
        return (
          <Card
            key={item.id}
            variant="outlined"
            clickable
            onClick={() => onNavigateToItem(item.id)}
            className="group flex flex-col overflow-hidden hover:border-m3-primary/40"
          >
            {/* Image & Badges */}
            <div className="relative h-32 w-full overflow-hidden bg-m3-surface-container-high">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {item.badge && (
                <span className="shadow-xs absolute left-2 top-2 rounded-full bg-m3-primary px-2 py-0.5 text-[10px] font-bold text-m3-on-primary">
                  {item.badge}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id, isFav);
                }}
                className="backdrop-blur-xs absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    isFav ? 'fill-red-500 text-red-500' : 'text-white'
                  }`}
                />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between space-y-2 p-3">
              <div>
                <div className="mb-0.5 flex items-center gap-1 text-[11px] font-bold text-amber-500">
                  <Star className="h-3 w-3 fill-amber-500" />
                  <span>{item.rating}</span>
                  <span className="font-normal text-m3-on-surface-variant">
                    ({item.reviewsCount})
                  </span>
                </div>
                <h4 className="line-clamp-1 text-xs font-bold text-m3-on-surface">
                  {item.title}
                </h4>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-m3-on-surface-variant">
                  {item.subtitle}
                </p>
              </div>

              <div className="flex items-baseline justify-between border-t border-m3-outline-variant/20 pt-1">
                <div>
                  <span className="text-sm font-bold text-m3-primary">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-m3-on-surface-variant">
                    /{item.unit.split(' ')[0]}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {item.stock} left
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
