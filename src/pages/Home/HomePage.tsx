import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Fab } from '../../components/common/Fab';
import { PageContainer } from '../../components/common/PageContainer';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleFavorite } from '../../store/slices/itemsSlice';
import { openBottomSheet, showSnackbar } from '../../store/slices/uiSlice';
import { HeroBanner } from './components/HeroBanner';
import { QuickMetrics } from './components/QuickMetrics';
import { QuickActions } from './components/QuickActions';
import { FeaturedProductsList } from './components/FeaturedProductsList';

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

  const handleToggleFavorite = (id: string, isFav: boolean) => {
    dispatch(toggleFavorite(id));
    dispatch(
      showSnackbar({
        message: isFav ? 'Removed from favorites' : 'Added to favorites',
      }),
    );
  };

  return (
    <PageContainer spacing="lg" bottomPadding="lg">
      {/* Hero Banner Card */}
      <HeroBanner
        onBrowseCatalog={() => navigate('/explore')}
        onGetQuote={handleQuickQuote}
      />

      {/* Quick Metrics Bar */}
      <QuickMetrics />

      {/* Quick Action Chips */}
      <QuickActions
        favoritesCount={favorites.length}
        onLabReportsClick={() =>
          dispatch(
            showSnackbar({
              message: 'Lab analysis certificates updated for all lots.',
            }),
          )
        }
        onTrackFreightClick={() => navigate('/activity')}
        onSavedItemsClick={() => navigate('/explore')}
      />

      {/* Featured Items Section */}
      <FeaturedProductsList
        featuredItems={featuredItems}
        favorites={favorites}
        onNavigateToItem={(id) => navigate(`/item/${id}`)}
        onToggleFavorite={handleToggleFavorite}
        onViewAll={() => navigate('/explore')}
      />

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
    </PageContainer>
  );
};
