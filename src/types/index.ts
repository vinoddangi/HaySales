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
  creditLimit?: number; // Advisory credit limit indicator (default ₹35,000)
  outstandingAmount?: number; // Real-time running outstanding balance on customer doc
}

export type ExpenseCategoryType =
  'Interest' | 'Fuel' | 'Labor' | 'Food / Drink' | 'Tools' | 'Others';

export interface Transaction {
  id?: string;
  customerId?: string;
  customerName?: string;
  type:
    'SALE' | 'SERVICE' | 'PAYMENT' | 'OPENING_BALANCE' | 'PURCHASE' | 'EXPENSE';
  category?: 'Purchase' | 'Expense';
  expenseCategory?: ExpenseCategoryType | string;
  date?: { seconds?: number } | string | number | Date;
  item?: string;
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
