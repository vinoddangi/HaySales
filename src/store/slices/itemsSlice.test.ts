import { describe, expect, it } from 'vitest';
import itemsReducer, {
  setSelectedCategory,
  toggleFavorite,
  updateStock,
} from './itemsSlice';

describe('itemsSlice', () => {
  it('should handle initial state', () => {
    const state = itemsReducer(undefined, { type: 'unknown' });
    expect(state.selectedCategory).toEqual('All');
    expect(state.loading).toBe(false);
    expect(state.items.length).toBeGreaterThan(0);
    expect(state.favorites).toContain('hay-1');
  });

  it('should handle setSelectedCategory', () => {
    const initialState = itemsReducer(undefined, { type: 'unknown' });
    const actual = itemsReducer(initialState, setSelectedCategory('Organic'));
    expect(actual.selectedCategory).toEqual('Organic');
  });

  it('should toggle item favorite status and favorites array', () => {
    const initialState = itemsReducer(undefined, { type: 'unknown' });
    // hay-2 is not in initial favorites
    expect(initialState.favorites).not.toContain('hay-2');

    const favorited = itemsReducer(initialState, toggleFavorite('hay-2'));
    expect(favorited.favorites).toContain('hay-2');
    expect(favorited.items.find((i) => i.id === 'hay-2')?.isFavorite).toBe(
      true,
    );

    const unfavorited = itemsReducer(favorited, toggleFavorite('hay-2'));
    expect(unfavorited.favorites).not.toContain('hay-2');
    expect(unfavorited.items.find((i) => i.id === 'hay-2')?.isFavorite).toBe(
      false,
    );
  });

  it('should handle updateStock correctly', () => {
    const initialState = itemsReducer(undefined, { type: 'unknown' });
    const targetItem = initialState.items[0];
    const initialStock = targetItem.stock;

    const increased = itemsReducer(
      initialState,
      updateStock({ id: targetItem.id, amount: 50 }),
    );
    expect(increased.items.find((i) => i.id === targetItem.id)?.stock).toBe(
      initialStock + 50,
    );

    const decreased = itemsReducer(
      increased,
      updateStock({ id: targetItem.id, amount: -(initialStock + 100) }),
    );
    expect(decreased.items.find((i) => i.id === targetItem.id)?.stock).toBe(0);
  });
});
