export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'rose';

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
  Id: number; // Numeric sequence ID
  Name: string; // Customer name
  totalOutstandingDue?: number; // Added to support tracking dues!
}
