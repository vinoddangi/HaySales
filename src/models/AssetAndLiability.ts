export type AssetCategory =
  'Machinery' | 'Infrastructure' | 'Equipment' | 'Vehicle' | 'Other';

export type FixedAsset = {
  id: string; // e.g. "asset_tractor", "asset_fence", "asset_talpatri"
  name: string; // e.g. "Pickup / Tractor Machinery", "Boundary Fence"
  category: AssetCategory;
  purchaseCost: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  lastDepreciatedPeriod?: string;
};

export type LiabilityCategory = 'Vendor Payables' | 'Loan' | 'Other';

export type Liability = {
  id: string;
  name: string;
  category: LiabilityCategory;
  amount: number;
  note?: string;
};

export type CapitalAccount = {
  id: string;
  partnerName: string;
  principalCapital: number;
  accruedInterest?: number;
};
