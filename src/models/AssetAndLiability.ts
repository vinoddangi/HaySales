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

export type AssetRecord = Record<string, FixedAsset>;
export type LiabilityRecord = Record<string, Liability>;
export type CapitalRecord = Record<string, CapitalAccount>;

// ── Baseline Initial Records (Jan 2026 / 2026-01-01) ────────────────────────

export const INITIAL_ASSETS: AssetRecord = {
  asset_pickup: {
    id: 'asset_pickup',
    name: 'Pickup Vehicle',
    category: 'Vehicle',
    purchaseCost: 960000,
    accumulatedDepreciation: 0,
    currentBookValue: 960000,
  },
  asset_fence: {
    id: 'asset_fence',
    name: 'Boundary Fence',
    category: 'Infrastructure',
    purchaseCost: 64800,
    accumulatedDepreciation: 0,
    currentBookValue: 64800,
  },
  asset_talpatri: {
    id: 'asset_talpatri',
    name: 'Talpatri (Waterproof Tarpaulins)',
    category: 'Equipment',
    purchaseCost: 60000,
    accumulatedDepreciation: 0,
    currentBookValue: 60000,
  },
};

export const INITIAL_LIABILITIES: LiabilityRecord = {
  liability_vendor_payables: {
    id: 'liability_vendor_payables',
    name: 'Vendor Payables',
    category: 'Vendor Payables',
    amount: 0,
  },
  loan_partner_vinod: {
    id: 'loan_partner_vinod',
    name: 'Partner Loan (Vinod)',
    category: 'Loan',
    amount: 750000,
    note: 'Loan from partner',
  },
};

export const INITIAL_CAPITAL: CapitalRecord = {
  capital_vinod: {
    id: 'capital_vinod',
    partnerName: 'Vinod',
    principalCapital: 1500000,
  },
};

export const INITIAL_RETAINED_PROFIT = 2085394;
