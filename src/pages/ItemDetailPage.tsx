import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Fab } from '../components/common/Fab';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleFavorite, updateStock } from '../store/slices/itemsSlice';
import { showSnackbar } from '../store/slices/uiSlice';

export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const item = useAppSelector((state) =>
    state.items.items.find((i) => i.id === id),
  );
  const favorites = useAppSelector((state) => state.items.favorites);
  const isFav = id ? favorites.includes(id) : false;

  const [quantity, setQuantity] = useState(10);

  if (!item) {
    return (
      <div className="space-y-4 p-6 text-center">
        <h2 className="text-base font-bold text-m3-on-surface">
          Item Not Found
        </h2>
        <p className="text-xs text-m3-on-surface-variant">
          The requested hay lot or product could not be located.
        </p>
        <Button variant="tonal" onClick={() => navigate('/explore')}>
          Back to Catalog
        </Button>
      </div>
    );
  }

  const handleOrder = () => {
    dispatch(updateStock({ id: item.id, amount: -quantity }));
    dispatch(
      showSnackbar({
        message: `Ordered ${quantity} ${item.unit} of ${item.title}! Total: $${(
          item.price * quantity
        ).toFixed(2)}`,
        actionLabel: 'View Order',
      }),
    );
  };

  const totalPrice = (item.price * quantity).toFixed(2);

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      {/* Product Hero Image */}
      <div className="relative h-64 w-full bg-m3-surface-container-highest">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top Floating Actions */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            onClick={() => {
              dispatch(toggleFavorite(item.id));
              dispatch(
                showSnackbar({
                  message: isFav ? 'Removed from saved' : 'Added to saved',
                }),
              );
            }}
            className="rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            <Heart
              className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: item.title,
                  text: item.description,
                  url: window.location.href,
                });
              } else {
                dispatch(
                  showSnackbar({
                    message: 'Product link copied to clipboard!',
                  }),
                );
              }
            }}
            className="rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Floating Category & Rating */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
          <div>
            <span className="shadow-xs rounded-full bg-m3-primary px-2 py-0.5 text-[10px] font-bold text-m3-on-primary">
              {item.category} Grade
            </span>
            <h2 className="mt-1 text-lg font-bold text-white drop-shadow-sm">
              {item.title}
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-bold backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{item.rating}</span>
            <span className="font-normal text-white/70">
              ({item.reviewsCount})
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4">
        {/* Pricing Card */}
        <Card
          variant="filled"
          className="flex items-center justify-between bg-m3-surface-container p-4"
        >
          <div>
            <span className="text-xs font-medium text-m3-on-surface-variant">
              Unit Price
            </span>
            <div className="text-xl font-bold text-m3-primary">
              ${item.price.toFixed(2)}{' '}
              <span className="text-xs font-normal text-m3-on-surface-variant">
                / {item.unit}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-m3-on-surface-variant">
              Availability
            </span>
            <div className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {item.stock} in barn
            </div>
          </div>
        </Card>

        {/* Description */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
            Description
          </h3>
          <p className="text-xs leading-relaxed text-m3-on-surface">
            {item.description}
          </p>
        </div>

        {/* Forage Lab Specifications Grid */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
            <ShieldCheck className="h-4 w-4 text-m3-primary" />
            <span>Certified Feed Specifications</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {item.specifications.map((spec, idx) => (
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

        {/* Quantity Selector */}
        <Card variant="outlined" className="space-y-3 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-m3-on-surface">
              Order Quantity
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 5))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-m3-surface-container-highest text-m3-on-surface transition-colors hover:bg-m3-surface-container-high"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-m3-on-surface">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(item.stock, q + 5))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-m3-surface-container-highest text-m3-on-surface transition-colors hover:bg-m3-surface-container-high"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-m3-outline-variant/30 pt-2 text-xs">
            <span className="text-m3-on-surface-variant">Calculated Total</span>
            <span className="text-base font-bold text-m3-primary">
              ${totalPrice}
            </span>
          </div>
        </Card>
      </div>

      {/* Floating Order FAB */}
      <div className="fixed bottom-20 left-4 right-4 z-30 mx-auto flex max-w-sm justify-center">
        <Fab
          icon={<ShoppingBag className="h-5 w-5" />}
          label={`Order ${quantity} Bales • $${totalPrice}`}
          variant="primary"
          size="md"
          className="w-full shadow-m3-3"
          onClick={handleOrder}
        />
      </div>
    </div>
  );
};
