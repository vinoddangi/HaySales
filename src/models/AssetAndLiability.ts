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

// ── Baseline Initial Records (Jan 2025 / 2025-01-01) ────────────────────────

export const INITIAL_ASSETS: AssetRecord = {
  asset_pickup: {
    id: 'asset_pickup',
    name: 'Pickup',
    category: 'Vehicle',
    purchaseCost: 329000,
    accumulatedDepreciation: 0,
    currentBookValue: 329000,
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
    purchaseCost: 24000,
    accumulatedDepreciation: 0,
    currentBookValue: 24000,
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
    name: 'Partner Loan (Vinod Cap. Interest)',
    category: 'Loan',
    amount: 800000,
    note: 'Loan / capital interest from partner',
  },
};

export const INITIAL_CAPITAL: CapitalRecord = {
  capital_vinod: {
    id: 'capital_vinod',
    partnerName: 'Vinod',
    principalCapital: 1200000,
  },
};

export const INITIAL_RETAINED_PROFIT = 2165402;
export const INITIAL_CUSTOMER_RECEIVABLES = 2721599;
export const INITIAL_CASH_BALANCE = 809386.15;
