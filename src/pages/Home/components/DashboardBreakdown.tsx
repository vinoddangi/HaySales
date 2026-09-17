import { ChevronRight, Layers, PieChart } from 'lucide-react';
import React from 'react';
import { Card } from '../../../components/common/Card';
import { formatRupee, formatWeight } from '../../../utils/formatters';

export interface ItemBreakdownItem {
  item: string;
  amount: number;
  weightKg: number;
  count: number;
  stockKg?: number;
  avgBuyRate?: number;
}

export interface DashboardBreakdownProps {
  itemBreakdown: ItemBreakdownItem[];
  totalSales: number;
  salesOnCash: number;
  salesOnCredit: number;
  onNavigateToSales: () => void;
  onNavigateToLedger: () => void;
}

export const DashboardBreakdown: React.FC<DashboardBreakdownProps> = ({
  itemBreakdown,
  totalSales,
  salesOnCash,
  salesOnCredit,
  onNavigateToSales,
  onNavigateToLedger,
}) => {
  const cashPct = totalSales > 0 ? (salesOnCash / totalSales) * 100 : 0;
  const creditPct = totalSales > 0 ? (salesOnCredit / totalSales) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Visual Cash vs Credit Distribution Bar */}
      {totalSales > 0 && (
        <Card
          variant="outlined"
          className="space-y-2.5 border-m3-outline-variant bg-m3-surface-container-low p-3.5"
        >
          <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface">
            <span className="flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-m3-primary" />
              Sales Settlement Split
            </span>
            <span className="text-[11px] font-normal text-m3-on-surface-variant">
              Total: {formatRupee(totalSales)}
            </span>
          </div>

          {/* Dual-color Progress Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-m3-surface-container-highest">
            <div
              style={{ width: `${cashPct}%` }}
              className="bg-teal-500 transition-all duration-500"
              title={`Cash: ${cashPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${creditPct}%` }}
              className="bg-purple-500 transition-all duration-500"
              title={`Credit: ${creditPct.toFixed(1)}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium">
            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <span>
                Cash: {formatRupee(salesOnCash)} ({cashPct.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>
                Credit: {formatRupee(salesOnCredit)} ({creditPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Item-wise Performance Breakdown */}
      {itemBreakdown.length > 0 && (
        <Card
          variant="outlined"
          className="space-y-3 border-m3-outline-variant bg-m3-surface-container-low p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-m3-on-surface">
              <Layers className="h-4 w-4 text-m3-primary" />
              Crop / Item Sales & Stock
            </span>
            <span className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
              {itemBreakdown.length} Products
            </span>
          </div>

          <div className="space-y-2">
            {itemBreakdown.map((item) => {
              const itemPct =
                totalSales > 0 ? (item.amount / totalSales) * 100 : 0;
              const avgRate =
                item.weightKg > 0 ? item.amount / item.weightKg : 0;

              return (
                <div
                  key={item.item}
                  className="rounded-lg border border-m3-outline-variant/50 bg-m3-surface p-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-m3-on-surface">
                      {item.item}
                    </span>
                    <span className="font-extrabold text-m3-on-surface">
                      {formatRupee(item.amount)}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-m3-on-surface-variant">
                    <span>
                      Sold: {formatWeight(item.weightKg)} • Avg:{' '}
                      <strong>₹{avgRate.toFixed(2)}/kg</strong>
                    </span>
                    {item.stockKg !== undefined && (
                      <span className="py-0.2 rounded bg-blue-500/10 px-1.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                        Stock: {formatWeight(item.stockKg)}
                      </span>
                    )}
                  </div>

                  {item.avgBuyRate !== undefined && item.avgBuyRate > 0 && (
                    <div className="mt-0.5 text-[10px] font-medium text-m3-on-surface-variant">
                      Avg Buying: ₹{item.avgBuyRate.toFixed(2)}/kg
                    </div>
                  )}

                  {/* Progress Line */}
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-m3-surface-container-highest">
                    <div
                      style={{ width: `${itemPct}%` }}
                      className="h-full rounded-full bg-m3-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Access Action Banners */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={onNavigateToSales}
          className="flex items-center justify-between rounded-xl border border-m3-primary/30 bg-m3-primary/[0.08] p-3 text-left transition-all hover:bg-m3-primary/[0.14] active:scale-[0.98]"
        >
          <div>
            <div className="text-xs font-bold text-m3-primary">New Sale</div>
            <div className="text-[10px] text-m3-on-surface-variant">
              Record invoice
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-m3-primary" />
        </button>

        <button
          type="button"
          onClick={onNavigateToLedger}
          className="flex items-center justify-between rounded-xl border border-m3-outline-variant bg-m3-surface-container-low p-3 text-left transition-all hover:bg-m3-surface-container active:scale-[0.98]"
        >
          <div>
            <div className="text-xs font-bold text-m3-on-surface">
              Customer Ledgers
            </div>
            <div className="text-[10px] text-m3-on-surface-variant">
              Manage balances
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
        </button>
      </div>
    </div>
  );
};
