import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item } from '../../types';

interface ItemsState {
  items: Item[];
  selectedCategory: string;
  favorites: string[];
  loading: boolean;
}

const mockItems: Item[] = [
  {
    id: 'hay-1',
    title: 'Premium Alfalfa Supreme',
    subtitle: '1st Cut • High Protein (18-20%)',
    description:
      'Top-grade sun-cured supreme alfalfa hay with high relative feed value (RFV > 170). Rich in leafy green foliage and essential minerals for high-producing livestock and dairy herds.',
    price: 14.5,
    unit: 'bale (50 lbs)',
    stock: 420,
    category: 'Premium',
    rating: 4.9,
    reviewsCount: 128,
    imageUrl:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    isFavorite: true,
    badge: 'Best Seller',
    specifications: [
      { label: 'Crude Protein', value: '19.5%' },
      { label: 'Moisture Content', value: '< 12%' },
      { label: 'Bale Weight', value: '50 lbs (2-String)' },
      { label: 'Harvest Region', value: 'Pacific Northwest' },
    ],
  },
  {
    id: 'hay-2',
    title: 'Timothy Grass First Cut',
    subtitle: 'High Fiber • Clean & Dust-Free',
    description:
      'Clean, green, fragrant Timothy Grass hay. Perfect calcium-to-phosphorus ratio and optimal coarse fiber for equine digestion and small herbivores.',
    price: 16.0,
    unit: 'bale (45 lbs)',
    stock: 280,
    category: 'Premium',
    rating: 4.8,
    reviewsCount: 94,
    imageUrl:
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    badge: 'Equine Choice',
    specifications: [
      { label: 'Crude Protein', value: '8.5%' },
      { label: 'Crude Fiber', value: '32.0%' },
      { label: 'Moisture Content', value: '10%' },
      { label: 'Bale Weight', value: '45 lbs' },
    ],
  },
  {
    id: 'hay-3',
    title: 'Orchard Grass & Clover Blend',
    subtitle: 'Soft Texture • Palatable Sweet Scent',
    description:
      'Nutritious companion mix of Orchard Grass with tender Red Clover. Soft leafy texture offering exceptional palatability for cattle, sheep, and goats.',
    price: 13.25,
    unit: 'bale (48 lbs)',
    stock: 195,
    category: 'Organic',
    rating: 4.7,
    reviewsCount: 62,
    imageUrl:
      'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=800&q=80',
    isFavorite: true,
    badge: '100% Organic',
    specifications: [
      { label: 'Crude Protein', value: '14.0%' },
      { label: 'NDF Digestibility', value: '58%' },
      { label: 'Moisture', value: '11.5%' },
      { label: 'Certifications', value: 'USDA Organic' },
    ],
  },
  {
    id: 'hay-4',
    title: 'Coastal Bermuda Grass',
    subtitle: 'Standard Feed • Low Starch / Sugar',
    description:
      'Reliable, economical roughage with consistent fiber profile. Ideal for mature horses, resting livestock, and everyday pasture supplement.',
    price: 9.8,
    unit: 'bale (40 lbs)',
    stock: 650,
    category: 'Standard',
    rating: 4.5,
    reviewsCount: 45,
    imageUrl:
      'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    specifications: [
      { label: 'Crude Protein', value: '9.0%' },
      { label: 'Sugar/ESC', value: '< 7%' },
      { label: 'Bale Weight', value: '40 lbs' },
      { label: 'Storage', value: 'Barn Stored' },
    ],
  },
  {
    id: 'hay-5',
    title: 'Commercial Big Square Bale (3x3x8)',
    subtitle: 'High Density • Commercial Freight',
    description:
      'Bulk packed large square alfalfa-grass mixture designed for automated feeding and heavy livestock operations. Maximum payload efficiency.',
    price: 185.0,
    unit: 'big bale (850 lbs)',
    stock: 45,
    category: 'Bulk',
    rating: 4.9,
    reviewsCount: 31,
    imageUrl:
      'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    badge: 'Bulk Discount',
    specifications: [
      { label: 'Dimensions', value: '3x3x8 ft' },
      { label: 'Weight', value: '850 lbs avg' },
      { label: 'Relative Feed Value', value: '155' },
      { label: 'Handling', value: 'Forklift / Spear' },
    ],
  },
];

const initialState: ItemsState = {
  items: mockItems,
  selectedCategory: 'All',
  favorites: ['hay-1', 'hay-3'],
  loading: false,
};

export const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.favorites.indexOf(id);
      if (index >= 0) {
        state.favorites.splice(index, 1);
      } else {
        state.favorites.push(id);
      }

      const item = state.items.find((i) => i.id === id);
      if (item) {
        item.isFavorite = !item.isFavorite;
      }
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    updateStock: (
      state,
      action: PayloadAction<{ id: string; amount: number }>,
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.stock = Math.max(0, item.stock + action.payload.amount);
      }
    },
  },
});

export const { toggleFavorite, setSelectedCategory, updateStock } =
  itemsSlice.actions;
export default itemsSlice.reducer;
