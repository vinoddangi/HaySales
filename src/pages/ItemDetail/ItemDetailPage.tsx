import { ShoppingBag } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Fab } from '../../components/common/Fab';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleFavorite, updateStock } from '../../store/slices/itemsSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import { ProductHeader } from './components/ProductHeader';
import { ProductInfo } from './components/ProductSpecs';
import { ProductSpecsGrid } from './components/ProductSpecsGrid';
import { QuantitySelector } from './components/QuantitySelector';

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
        <Button variant="tonal" onClick={() => navigate('/')}>
          Back to Dashboard
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
    <div className="animate-fade-in space-y-4 pb-28">
      {/* Product Hero Image */}
      <ProductHeader
        imageUrl={item.imageUrl}
        title={item.title}
        isFav={isFav}
        onToggleFavorite={() => {
          dispatch(toggleFavorite(item.id));
          dispatch(
            showSnackbar({
              message: isFav ? 'Removed from saved' : 'Added to saved',
            }),
          );
        }}
        onShare={() => {
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
      />

      {/* Product Info & Description */}
      <ProductInfo
        title={item.title}
        subtitle={item.subtitle}
        price={item.price}
        unit={item.unit}
        rating={item.rating}
        reviewsCount={item.reviewsCount}
        stock={item.stock}
        description={item.description}
      />

      {/* Forage Lab Specifications Grid */}
      <ProductSpecsGrid specifications={item.specifications} />

      {/* Quantity Selector */}
      <QuantitySelector
        quantity={quantity}
        maxStock={item.stock}
        totalPrice={totalPrice}
        onIncrement={() => setQuantity((q) => Math.min(item.stock, q + 5))}
        onDecrement={() => setQuantity((q) => Math.max(1, q - 5))}
      />

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
