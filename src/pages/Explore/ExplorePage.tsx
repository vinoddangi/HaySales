import React, { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setSelectedCategory,
  toggleFavorite,
} from '../../store/slices/itemsSlice';
import { openBottomSheet, showSnackbar } from '../../store/slices/uiSlice';
import { ExploreHeader } from './components/ExploreHeader';
import { ProductGrid } from './components/ProductGrid';
import { ProductList } from './components/ProductList';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, selectedCategory, favorites } = useAppSelector(
    (state) => state.items,
  );
  const searchQuery = useAppSelector((state) => state.ui.searchQuery);

  const [localSearch, setLocalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Premium', 'Standard', 'Organic', 'Bulk'];

  // Combined filter: category + global/local search query
  const query = (searchQuery || localSearch).toLowerCase().trim();
  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.subtitle.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  const handleToggleFavorite = (id: string, isFav: boolean) => {
    dispatch(toggleFavorite(id));
    dispatch(
      showSnackbar({
        message: isFav ? 'Removed from favorites' : 'Saved to favorites',
      }),
    );
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* Search & Filter Header */}
      <ExploreHeader
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => dispatch(setSelectedCategory(cat))}
        onOpenFilters={() =>
          dispatch(
            openBottomSheet({
              title: 'Filter & Sort Options',
              description:
                'Select RFV grade, moisture threshold, and freight delivery options.',
            }),
          )
        }
      />

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-m3-on-surface-variant">
          Showing {filteredItems.length} Products
        </span>
        <div className="flex items-center gap-1 rounded-m3-sm bg-m3-surface-container p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'shadow-xs bg-m3-secondary-container text-m3-on-secondary-container'
                : 'text-m3-on-surface-variant'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'shadow-xs bg-m3-secondary-container text-m3-on-secondary-container'
                : 'text-m3-on-surface-variant'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Items Display (Grid vs List) */}
      {filteredItems.length === 0 ? (
        <div className="space-y-2 py-12 text-center">
          <p className="text-sm font-semibold text-m3-on-surface">
            No matching hay or forage found
          </p>
          <p className="text-xs text-m3-on-surface-variant">
            Try adjusting your search terms or category filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <ProductGrid
          items={filteredItems}
          favorites={favorites}
          onNavigateToItem={(id) => navigate(`/item/${id}`)}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        <ProductList
          items={filteredItems}
          favorites={favorites}
          onNavigateToItem={(id) => navigate(`/item/${id}`)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </PageContainer>
  );
};
