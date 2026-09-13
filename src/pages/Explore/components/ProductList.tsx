import React from 'react';
import { Heart } from 'lucide-react';
import { Card } from '../../../components/common/Card';

interface ProductItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  price: number;
  unit: string;
  stock: number;
}

interface ProductListProps {
  items: ProductItem[];
  favorites: string[];
  onNavigateToItem: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  items,
  favorites,
  onNavigateToItem,
  onToggleFavorite,
}) => {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const isFav = favorites.includes(item.id);
        return (
          <Card
            key={item.id}
            variant="outlined"
            clickable
            onClick={() => onNavigateToItem(item.id)}
            className="flex items-center gap-3 p-3 hover:border-m3-primary/40"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-16 w-16 shrink-0 rounded-m3-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="truncate text-xs font-bold text-m3-on-surface">
                  {item.title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id, isFav);
                  }}
                  className="p-1 text-m3-on-surface-variant"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isFav
                        ? 'fill-m3-primary text-m3-primary'
                        : 'text-m3-outline'
                    }`}
                  />
                </button>
              </div>
              <p className="truncate text-[11px] text-m3-on-surface-variant">
                {item.subtitle}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="font-bold text-m3-primary">
                  ${item.price.toFixed(2)}{' '}
                  <span className="text-[10px] font-normal text-m3-on-surface-variant">
                    / {item.unit}
                  </span>
                </span>
                <span className="text-[10px] text-m3-on-surface-variant">
                  Stock: {item.stock}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
