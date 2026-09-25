import {
  FixedAsset,
  FixedAssetData,
  Transaction,
  TransactionModel,
} from '../../models';

export interface AssetDepreciationResult {
  updatedAssets: FixedAsset[];
  totalDepreciationCM: number;
  totalFixedAssetsValue: number;
}

/**
 * Calculates depreciation expense for the month and subtracts it directly
 * from the target fixed asset's book value based on normalized transaction data.
 *
 * Current Book Value = Previous Book Value - Monthly Depreciation
 */
export function applyAssetDepreciation(
  monthTransactions: Transaction[],
  priorAssets: (FixedAssetData | FixedAsset)[] = [],
  period?: string,
): AssetDepreciationResult {
  // Wrap into FixedAsset domain instances
  const assetsMap = new Map<string, FixedAsset>();
  for (const asset of priorAssets) {
    assetsMap.set(asset.id, FixedAsset.from(asset));
  }

  let totalDepreciationCM = 0;

  for (const tx of monthTransactions) {
    if (TransactionModel.isDepreciation(tx)) {
      const amount = Number(tx.amount) || 0;
      totalDepreciationCM += amount;

      // Find target asset by targetAssetId
      const targetAsset = tx.targetAssetId
        ? assetsMap.get(tx.targetAssetId)
        : assetsMap.values().next().value;

      if (targetAsset) {
        targetAsset.applyDepreciation(amount, period);
      }
    }
  }

  const updatedAssets = Array.from(assetsMap.values());
  const totalFixedAssetsValue = FixedAsset.getTotalBookValue(updatedAssets);

  return {
    updatedAssets,
    totalDepreciationCM: Number(totalDepreciationCM.toFixed(2)),
    totalFixedAssetsValue,
  };
}
