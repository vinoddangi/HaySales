import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { TextField } from '../../../components/common/TextField';
import { Chip } from '../../../components/common/Chip';

interface ExploreHeaderProps {
  localSearch: string;
  setLocalSearch: (val: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenFilters: () => void;
}

export const ExploreHeader: React.FC<ExploreHeaderProps> = ({
  localSearch,
  setLocalSearch,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenFilters,
}) => {
  return (
    <div className="space-y-3">
      <TextField
        placeholder="Filter by species, cut, or protein..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        variant="outlined"
        trailingIcon={<SlidersHorizontal className="h-4 w-4" />}
        onTrailingIconClick={onOpenFilters}
      />

      {/* Category Chips Bar */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </Chip>
        ))}
      </div>
    </div>
  );
};
