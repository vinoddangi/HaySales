import {
  ArrowDownLeft,
  Banknote,
  Coins,
  CreditCard,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React from 'react';
import { Card } from '../../../components/common/Card';
import { cn } from '../../../utils/cn';
import { formatRupee, formatWeight } from '../../../utils/formatters';

export interface DashboardMetricsData {
  totalSalesAmount: number;
  totalSalesWeightKg: number;
  salesCount: number;
  totalPurchaseAmount: number;
  totalPurchaseWeightKg: number;
  purchasesCount: number;
  totalExpenseAmount: number;
  expensesCount: number;
  avgSalesRate: number;
  avgBuyRate: number;
  totalCashIn: number;
  netCashflow: number;
  salesOnCredit: number;
  salesOnCash: number;
  paymentsReceived: number;
}

export interface DashboardMetricCardsProps {
  metrics: DashboardMetricsData;
  isLoading?: boolean;
}

export const DashboardMetricCards: React.FC<DashboardMetricCardsProps> = ({
  metrics,
  isLoading,
}) => {
  const totalSales = metrics.totalSalesAmount;
  const cashPercentage =
    totalSales > 0 ? (metrics.salesOnCash / totalSales) * 100 : 0;
  const creditPercentage =
    totalSales > 0 ? (metrics.salesOnCredit / totalSales) * 100 : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-m3-outline-variant/40 bg-m3-surface-container-low"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Main Cards: Sales & Purchases */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Total Sales Card */}
        <Card
          variant="elevated"
          className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-m3-surface-container-low p-4 dark:from-emerald-500/[0.12]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Sales
            </span>
            <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black tracking-tight text-m3-on-surface">
              {formatRupee(metrics.totalSalesAmount)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-m3-on-surface-variant">
              <span>{formatWeight(metrics.totalSalesWeightKg)}</span>
              <span>•</span>
              <span>{metrics.salesCount} Invoices</span>
            </div>
          </div>
        </Card>

        {/* Total Purchases Card */}
        <Card
          variant="elevated"
          className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-m3-surface-container-low p-4 dark:from-amber-500/[0.12]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Total Purchases
            </span>
            <div className="rounded-full bg-amber-500/20 p-2 text-amber-600 dark:text-amber-300">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black tracking-tight text-m3-on-surface">
              {formatRupee(metrics.totalPurchaseAmount)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-m3-on-surface-variant">
              <span>{formatWeight(metrics.totalPurchaseWeightKg)}</span>
              <span>•</span>
              <span>{metrics.purchasesCount} Orders</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid of Key Rate and Cashflow Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sales Rate (Avg) */}
        <Card
          variant="outlined"
          className="border-m3-outline-variant bg-m3-surface-container-low p-3.5"
        >
          <div className="flex items-center gap-2 text-m3-primary">
            <Scale className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-m3-on-surface-variant">
              Sales Rate (Avg)
            </span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-m3-on-surface">
            {metrics.avgSalesRate > 0
              ? `₹${metrics.avgSalesRate.toFixed(2)}`
              : '₹0.00'}
            <span className="text-xs font-normal text-m3-on-surface-variant">
              /kg
            </span>
          </div>
          <div className="mt-0.5 text-[10px] text-m3-on-surface-variant">
            Avg selling rate
          </div>
        </Card>

        {/* Buy Rate (Avg) */}
        <Card
          variant="outlined"
          className="border-m3-outline-variant bg-m3-surface-container-low p-3.5"
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Coins className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-m3-on-surface-variant">
              Buy Rate (Avg)
            </span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-m3-on-surface">
            {metrics.avgBuyRate > 0
              ? `₹${metrics.avgBuyRate.toFixed(2)}`
              : '₹0.00'}
            <span className="text-xs font-normal text-m3-on-surface-variant">
              /kg
            </span>
          </div>
          <div className="mt-0.5 text-[10px] text-m3-on-surface-variant">
            Avg purchase cost
          </div>
        </Card>

        {/* Sales on Cash */}
        <Card
          variant="outlined"
          className="border-teal-500/20 bg-teal-500/[0.04] p-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <Banknote className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wide">
                Sales on Cash
              </span>
            </div>
            <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
              {cashPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-m3-on-surface">
            {formatRupee(metrics.salesOnCash)}
          </div>
          <div className="mt-0.5 text-[10px] text-m3-on-surface-variant">
            Direct cash received
          </div>
        </Card>

        {/* Sales on Credit */}
        <Card
          variant="outlined"
          className="border-purple-500/20 bg-purple-500/[0.04] p-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <CreditCard className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wide">
                Sales on Credit
              </span>
            </div>
            <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
              {creditPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-m3-on-surface">
            {formatRupee(metrics.salesOnCredit)}
          </div>
          <div className="mt-0.5 text-[10px] text-m3-on-surface-variant">
            Credit given to buyers
          </div>
        </Card>
      </div>

      {/* Cashflow Card */}
      <Card
        variant="filled"
        className="border border-m3-outline-variant/60 bg-m3-surface-container p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-m3-primary/10 p-2 text-m3-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-m3-on-surface">
                Total Cashflow
              </div>
              <div className="text-[11px] text-m3-on-surface-variant">
                Total cash in (Cash Sales + Payments)
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-lg font-black',
                metrics.netCashflow >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {formatRupee(metrics.netCashflow)}
            </div>
            <div className="text-[10px] font-medium text-m3-on-surface-variant">
              In: {formatRupee(metrics.totalCashIn)} • Out:{' '}
              {formatRupee(
                metrics.totalPurchaseAmount + metrics.totalExpenseAmount,
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
