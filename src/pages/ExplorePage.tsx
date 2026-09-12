import { Heart, LayoutGrid, List, SlidersHorizontal, Star } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Chip } from '../components/common/Chip';
import { TextField } from '../components/common/TextField';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setSelectedCategory,
  toggleFavorite,
} from '../store/slices/itemsSlice';
import { openBottomSheet, showSnackbar } from '../store/slices/uiSlice';

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

  return (
    <div className="animate-fade-in space-y-4 p-4">
      {/* Search & Filter Header */}
      <div className="space-y-3">
        <TextField
          placeholder="Filter by species, cut, or protein..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          variant="outlined"
          trailingIcon={<SlidersHorizontal className="h-4 w-4" />}
          onTrailingIconClick={() =>
            dispatch(
              openBottomSheet({
                title: 'Filter & Sort Options',
                description:
                  'Select RFV grade, moisture threshold, and freight delivery options.',
              }),
            )
          }
        />

        {/* Category Chips Bar */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Chip
              key={cat}
              selected={selectedCategory === cat}
              onClick={() => dispatch(setSelectedCategory(cat))}
            >
              {cat}
            </Chip>
          ))}
        </div>
      </div>

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
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            return (
              <Card
                key={item.id}
                variant="outlined"
                clickable
                onClick={() => navigate(`/item/${item.id}`)}
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
                      dispatch(toggleFavorite(item.id));
                      dispatch(
                        showSnackbar({
                          message: isFav
                            ? 'Removed from favorites'
                            : 'Saved to favorites',
                        }),
                      );
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
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            return (
              <Card
                key={item.id}
                variant="outlined"
                clickable
                onClick={() => navigate(`/item/${item.id}`)}
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
                        dispatch(toggleFavorite(item.id));
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
      )}
    </div>
  );
};
