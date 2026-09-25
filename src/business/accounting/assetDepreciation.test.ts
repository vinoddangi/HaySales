import { describe, expect, it } from 'vitest';
import { FixedAssetData, Transaction } from '../../types';
import { applyAssetDepreciation } from './assetDepreciation';

describe('assetDepreciation', () => {
  it('subtracts depreciation expense directly from targeted asset book value', () => {
    const priorAssets: FixedAssetData[] = [
      {
        id: 'asset_tractor',
        name: 'Daalu / Tractor Machinery',
        category: 'Machinery',
        purchaseCost: 960000,
        accumulatedDepreciation: 60000,
        currentBookValue: 900000,
      },
      {
        id: 'asset_fence',
        name: 'Boundary Fence',
        category: 'Infrastructure',
        purchaseCost: 64800,
        accumulatedDepreciation: 0,
        currentBookValue: 64800,
      },
    ];

    const transactions: Transaction[] = [
      {
        type: 'EXPENSE',
        category: 'Depreciation',
        amount: 25000,
        targetAssetId: 'asset_tractor',
        note: 'Tractor monthly depreciation',
      },
      {
        type: 'EXPENSE',
        category: 'Depreciation',
        amount: 4800,
        targetAssetId: 'asset_fence',
        note: 'Fence wear and tear depreciation',
      },
    ];

    const result = applyAssetDepreciation(transactions, priorAssets, '2026_01');

    expect(result.totalDepreciationCM).toBe(29800);

    const tractor = result.updatedAssets.find((a) => a.id === 'asset_tractor')!;
    expect(tractor.accumulatedDepreciation).toBe(85000); // 60000 + 25000
    expect(tractor.currentBookValue).toBe(875000); // 900000 - 25000
    expect(tractor.lastDepreciatedPeriod).toBe('2026_01');

    const fence = result.updatedAssets.find((a) => a.id === 'asset_fence')!;
    expect(fence.accumulatedDepreciation).toBe(4800);
    expect(fence.currentBookValue).toBe(60000); // 64800 - 4800

    expect(result.totalFixedAssetsValue).toBe(875000 + 60000);
  });
});
