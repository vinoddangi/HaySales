export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'rose';
export type FontSize = 'small' | 'medium' | 'large';

export interface Item {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  category: 'Premium' | 'Standard' | 'Organic' | 'Bulk';
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  isFavorite: boolean;
  badge?: string;
  specifications: { label: string; value: string }[];
}

export interface ActivityNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'system' | 'alert' | 'promo';
  isRead: boolean;
}

export interface SnackbarState {
  isOpen: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface Customer {
  id: string; // Document ID
  name: string; // Customer name
  mobile?: string; // Contact mobile
  village?: string; // Village / City
  creditLimit?: number; // Advisory credit limit indicator (default ₹35,000)
  outstandingAmount?: number; // Real-time running outstanding balance on customer doc
}

export type ExpenseCategoryType =
  | 'Interest'
  | 'Fuel'
  | 'Maintenance'
  | 'Depreciation'
  | 'Labor'
  | 'Food / Drink'
  | 'Tools'
  | 'Others';

export type CropItemType =
  'Tuvar' | 'Chana' | 'B. Kutty' | 'M. Kutty' | 'Isabgol' | 'Others';

export interface MonthlyTradingSummary {
  period: string; // e.g. '2026_01'
  label: string; // e.g. 'Jan 2026'
  openingStock: {
    weightKg: number;
    rate: number;
    amount: number;
  };
  purchases: {
    weightKg: number;
    rate: number;
    amount: number;
  };
  totalStock: {
    weightKg: number;
    weightedRate: number;
    amount: number;
  };
  sales: {
    weightKg: number;
    avgRate: number;
    amount: number;
  };
  closingStock: {
    weightKg: number;
    rate: number;
    amount: number;
  };
  commission: {
    cm: number;
    prev: number;
    discountC2?: number;
    total: number;
  };
  daalu: {
    cm: number;
    prev: number;
    total: number;
  };
  expenses: {
    cm: number;
    prev: number;
    total: number;
  };
  netProfit: {
    cm: number;
    total: number;
  };
  lendingToCustomers: number;
  cashBalance: number;
  totalCapital: number;
}

export interface Transaction {
  id?: string;
  customerId?: string;
  customerName?: string;
  type:
    'SALE' | 'SERVICE' | 'PAYMENT' | 'OPENING_BALANCE' | 'PURCHASE' | 'EXPENSE';
  category?: 'Purchase' | 'Expense' | 'Sales' | 'Services';
  expenseCategory?: ExpenseCategoryType | string;
  date?: { seconds?: number } | string | number | Date;
  item?: CropItemType | string;
  weightKg?: number;
  amount?: number;
  discount?: number;
  cashPaid?: number;
  remainingDue?: number;
  paymentAmount?: number;
  rate?: number;
  purchaseRate?: number;
  vendorName?: string;
  note?: string;
}

export interface MonthlyRolloutStatus {
  lastRolledOutMonth: string; // e.g. "2026-08" (YYYY-MM)
  lastRolledOutAt?: string;
  history?: {
    month: string;
    rolledOutAt: string;
    summary?: MonthlyTradingSummary;
  }[];
}
