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
    <div className="shadow-xs flex w-full items-center rounded-2xl border border-m3-outline-variant/60 bg-m3-surface-container-low p-1">
      {/* 1. Sales (includes Sales & Service) */}
      <button
        type="button"
        onClick={() => onSelectCategory('SALES')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all',
          activeCategory === 'SALES'
            ? 'shadow-xs bg-m3-primary text-m3-on-primary'
            : 'text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
        )}
      >
        <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
        <span>Sales</span>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-extrabold',
            activeCategory === 'SALES'
              ? 'bg-m3-on-primary/20 text-m3-on-primary'
              : 'bg-m3-surface-container-highest text-m3-on-surface-variant',
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
          'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all',
          activeCategory === 'PAYMENTS'
            ? 'shadow-xs bg-emerald-600 text-white'
            : 'text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
        )}
      >
        <DollarSign className="h-3.5 w-3.5 shrink-0" />
        <span>Payment</span>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-extrabold',
            activeCategory === 'PAYMENTS'
              ? 'bg-white/20 text-white'
              : 'bg-m3-surface-container-highest text-m3-on-surface-variant',
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
          'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all',
          activeCategory === 'PURCHASES_EXPENSES'
            ? 'shadow-xs bg-amber-600 text-white'
            : 'text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
        )}
      >
        <Receipt className="h-3.5 w-3.5 shrink-0" />
        <span>Purchase</span>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-extrabold',
            activeCategory === 'PURCHASES_EXPENSES'
              ? 'bg-white/20 text-white'
              : 'bg-m3-surface-container-highest text-m3-on-surface-variant',
          )}
        >
          {purchasesExpensesCount}
        </span>
      </button>
    </div>
  );
};
