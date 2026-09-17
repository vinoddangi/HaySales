import { DollarSign, Receipt, ShoppingBag } from 'lucide-react';
import React from 'react';
import { cn } from '../../../utils/cn';

export type ActivityCategory = 'SALES' | 'PAYMENTS' | 'PURCHASES_EXPENSES';

export interface ActivityCategoryTabsProps {
  activeCategory: ActivityCategory;
  salesCount: number;
  paymentsCount: number;
  purchasesExpensesCount: number;
  onSelectCategory: (_category: ActivityCategory) => void;
}

export const ActivityCategoryTabs: React.FC<ActivityCategoryTabsProps> = ({
  activeCategory,
  salesCount,
  paymentsCount,
  purchasesExpensesCount,
  onSelectCategory,
}) => {
  return (
    <div className="flex rounded-xl bg-m3-surface-container-high p-1">
      {/* 1. Sales (includes Sales & Service) */}
      <button
        type="button"
        onClick={() => onSelectCategory('SALES')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
          activeCategory === 'SALES'
            ? 'shadow-xs bg-m3-primary text-m3-on-primary'
            : 'text-m3-on-surface-variant hover:text-m3-on-surface',
        )}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>Sales</span>
        <span
          className={cn(
            'py-0.2 rounded-full px-1.5 text-[10px] font-bold',
            activeCategory === 'SALES'
              ? 'bg-m3-on-primary/20 text-m3-on-primary'
              : 'bg-m3-surface text-m3-on-surface-variant',
          )}
        >
          {salesCount}
        </span>
      </button>

      {/* 2. Payment Tab */}
      <button
        type="button"
        onClick={() => onSelectCategory('PAYMENTS')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
          activeCategory === 'PAYMENTS'
            ? 'shadow-xs bg-emerald-600 text-white'
            : 'text-m3-on-surface-variant hover:text-m3-on-surface',
        )}
      >
        <DollarSign className="h-3.5 w-3.5" />
        <span>Payment</span>
        <span
          className={cn(
            'py-0.2 rounded-full px-1.5 text-[10px] font-bold',
            activeCategory === 'PAYMENTS'
              ? 'bg-white/20 text-white'
              : 'bg-m3-surface text-m3-on-surface-variant',
          )}
        >
          {paymentsCount}
        </span>
      </button>

      {/* 3. Purchase (includes Purchase & Expense) */}
      <button
        type="button"
        onClick={() => onSelectCategory('PURCHASES_EXPENSES')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
          activeCategory === 'PURCHASES_EXPENSES'
            ? 'shadow-xs bg-amber-600 text-white'
            : 'text-m3-on-surface-variant hover:text-m3-on-surface',
        )}
      >
        <Receipt className="h-3.5 w-3.5" />
        <span>Purchase</span>
        <span
          className={cn(
            'py-0.2 rounded-full px-1.5 text-[10px] font-bold',
            activeCategory === 'PURCHASES_EXPENSES'
              ? 'bg-white/20 text-white'
              : 'bg-m3-surface text-m3-on-surface-variant',
          )}
        >
          {purchasesExpensesCount}
        </span>
      </button>
    </div>
  );
};
