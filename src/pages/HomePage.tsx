import {
  ArrowRight,
  Heart,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Chip } from '../components/common/Chip';
import { Fab } from '../components/common/Fab';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleFavorite } from '../store/slices/itemsSlice';
import { openBottomSheet, showSnackbar } from '../store/slices/uiSlice';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.items.items);
  const favorites = useAppSelector((state) => state.items.favorites);

  const featuredItems = items.slice(0, 3);

  const handleQuickQuote = () => {
    dispatch(
      openBottomSheet({
        title: 'Quick Order Request',
        description:
          'Specify forage type and truckload requirements for instant logistics quote.',
      }),
    );
  };

  return (
    <div className="animate-fade-in space-y-5 p-4">
      {/* Hero Banner Card */}
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
            High protein alfalfa, certified dust-free timothy, and bulk
            commercial freight bales.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="filled"
              onClick={() => navigate('/explore')}
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              iconPosition="right"
            >
              Browse Catalog
            </Button>
            <Button size="sm" variant="tonal" onClick={handleQuickQuote}>
              Get Quote
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Metrics Bar */}
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

      {/* Quick Action Chips */}
      <div className="space-y-2">
        <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
          Quick Actions
        </h3>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <Chip
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            onClick={() =>
              dispatch(
                showSnackbar({
                  message: 'Lab analysis certificates updated for all lots.',
                }),
              )
            }
          >
            Lab Reports
          </Chip>
          <Chip
            icon={<Truck className="h-3.5 w-3.5" />}
            onClick={() => navigate('/activity')}
          >
            Track Freight
          </Chip>
          <Chip
            icon={<Heart className="h-3.5 w-3.5" />}
            onClick={() => navigate('/explore')}
          >
            Saved Items ({favorites.length})
          </Chip>
        </div>
      </div>

      {/* Featured Items Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-m3-on-surface">
            Featured Products
          </h3>
          <button
            onClick={() => navigate('/explore')}
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
                onClick={() => navigate(`/item/${item.id}`)}
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
                    dispatch(toggleFavorite(item.id));
                    dispatch(
                      showSnackbar({
                        message: isFav
                          ? 'Removed from favorites'
                          : 'Added to favorites',
                      }),
                    );
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

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-30">
        <Fab
          icon={<Plus className="h-6 w-6" />}
          label="New Order"
          variant="primary"
          size="md"
          onClick={handleQuickQuote}
        />
      </div>
    </div>
  );
};
