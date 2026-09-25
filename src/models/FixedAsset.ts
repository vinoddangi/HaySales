export type AssetCategory =
  'Machinery' | 'Infrastructure' | 'Equipment' | 'Vehicle' | 'Other';

export type FixedAssetData = {
  id: string; // e.g. "asset_pickup", "asset_tractor", "asset_fence", "asset_talpatri"
  name: string; // e.g. "Pickup Vehicle", "Tractor Machinery", "Boundary Fence"
  category: AssetCategory;
  purchaseCost: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  lastDepreciatedPeriod?: string;
};

/**
 * Domain Model Class for Fixed Asset with embedded depreciation calculation utilities
 */
export class FixedAsset {
  id: string;
  name: string;
  category: AssetCategory;
  purchaseCost: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  lastDepreciatedPeriod?: string;

  constructor(data: FixedAssetData) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.purchaseCost = Number(data.purchaseCost) || 0;
    this.accumulatedDepreciation = Number(data.accumulatedDepreciation) || 0;
    this.currentBookValue =
      data.currentBookValue !== undefined
        ? Number(data.currentBookValue)
        : Math.max(0, this.purchaseCost - this.accumulatedDepreciation);
    this.lastDepreciatedPeriod = data.lastDepreciatedPeriod;
  }

  static from(data: FixedAssetData): FixedAsset {
    return data instanceof FixedAsset ? data : new FixedAsset(data);
  }

  /**
   * Calculates total book value across an array of fixed assets
   */
  static getTotalBookValue(assets: (FixedAssetData | FixedAsset)[]): number {
    return Number(
      assets
        .reduce((sum, a) => sum + (Number(a.currentBookValue) || 0), 0)
        .toFixed(2),
    );
  }

  /**
   * Applies depreciation to this asset, reducing its book value
   */
  applyDepreciation(amount: number, period?: string): number {
    const writtenDown = Math.min(this.currentBookValue, Math.max(0, amount));
    this.accumulatedDepreciation = Number(
      (this.accumulatedDepreciation + writtenDown).toFixed(2),
    );
    this.currentBookValue = Number(
      (this.currentBookValue - writtenDown).toFixed(2),
    );
    if (period) {
      this.lastDepreciatedPeriod = period;
    }
    return writtenDown;
  }

  isFullyDepreciated(): boolean {
    return this.currentBookValue <= 0;
  }

  getDepreciationPercentage(): number {
    return this.purchaseCost > 0
      ? Number(
          ((this.accumulatedDepreciation / this.purchaseCost) * 100).toFixed(2),
        )
      : 0;
  }
}
