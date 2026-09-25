import {
  parseIsoDate,
  parseNumber,
  parseOptionalNumber,
  parseString,
  RawRecord,
} from '../utils/rawHelpers';
import { BalanceSheetData } from './BalanceSheet';
import { FixedAsset, FixedAssetData } from './FixedAsset';

export type DividendDistribution = {
  id: string;
  partnerName: string;
  amount: number;
  date: string;
  note?: string;
};

export type CapitalAccount = {
  id: string;
  partnerName: string;
  principalCapital: number;
  capitalInterestPaidTotal?: number;
};

/**
 * Reusable monthly cumulative financial metric tracking current month, previous total, and cumulative total
 */
export type MonthlyCumulativeMetric = {
  cm: number;
  prev: number;
  total: number;
  discountC2?: number;
};

/**
 * Domain Class for Monthly Cumulative Metric with addition/delta helpers
 */
export class CumulativeMetric {
  cm: number;
  prev: number;
  total: number;
  discountC2?: number;

  constructor(data: MonthlyCumulativeMetric) {
    this.cm = Number(data.cm) || 0;
    this.prev = Number(data.prev) || 0;
    this.discountC2 = data.discountC2;
    this.total =
      data.total !== undefined
        ? Number(data.total)
        : Number((this.prev + this.cm).toFixed(2));
  }

  static from(data: MonthlyCumulativeMetric): CumulativeMetric {
    return data instanceof CumulativeMetric ? data : new CumulativeMetric(data);
  }

  static compute(prev: number, cm: number, discountC2 = 0): CumulativeMetric {
    const netPrev = prev - discountC2;
    const total = Number((netPrev + cm).toFixed(2));
    return new CumulativeMetric({
      cm: Number(cm.toFixed(2)),
      prev: Number(prev.toFixed(2)),
      discountC2,
      total,
    });
  }
}

/**
 * Stock valuation representation (weight, rate, amount)
 */
export type StockValuationMetric = {
  weightKg: number;
  rate: number;
  amount: number;
};

export type TotalStockValuationMetric = {
  weightKg: number;
  weightedRate: number;
  amount: number;
};

export type SalesMetric = {
  weightKg: number;
  avgRate: number;
  amount: number;
};

export type ProfitCategorization = {
  commissionProfit: MonthlyCumulativeMetric;
  serviceProfit: MonthlyCumulativeMetric;
  operatingExpenses: MonthlyCumulativeMetric;
  depreciationExpense: MonthlyCumulativeMetric;
  capitalInterestExpense: MonthlyCumulativeMetric;
  operatingNetProfit: MonthlyCumulativeMetric;
  dividendDistribution: MonthlyCumulativeMetric;
  netRetainedProfit: MonthlyCumulativeMetric;
};

export type MonthlyTradingSummary = {
  period: string; // e.g. '2026_01'
  label: string; // e.g. 'Jan 2026'
  openingStock: StockValuationMetric;
  purchases: StockValuationMetric;
  totalStock: TotalStockValuationMetric;
  sales: SalesMetric;
  closingStock: StockValuationMetric;
  commission: MonthlyCumulativeMetric;
  pickup: MonthlyCumulativeMetric;
  expenses: MonthlyCumulativeMetric;
  netProfit: {
    cm: number;
    total: number;
  };
  lendingToCustomers: number;
  cashBalance: number;
  cashAdj?: number;
  totalCapital: number;
  profitBreakdown?: ProfitCategorization;
  balanceSheet?: BalanceSheetData;
  fixedAssets?: (FixedAsset | FixedAssetData)[];
  dividends?: DividendDistribution[];
};

export type MonthlyRolloutStatus = {
  lastRolledOutMonth: string; // e.g. "2026-08" (YYYY-MM)
  lastRolledOutAt?: string;
  history?: {
    month: string;
    rolledOutAt: string;
    summary?: MonthlyTradingSummary;
  }[];
};

/**
 * Parser / fromRaw helpers for MonthlyTradingSummary & MonthlyRolloutStatus
 */
export function parseMonthlyTradingSummaryFromRaw(
  raw: RawRecord,
): MonthlyTradingSummary {
  const r = raw as Record<string, any>;
  return {
    period: parseString(r?.period),
    label: parseString(r?.label || r?.name),
    openingStock: {
      weightKg: parseNumber(r?.openingStock?.weightKg),
      rate: parseNumber(r?.openingStock?.rate),
      amount: parseNumber(r?.openingStock?.amount),
    },
    purchases: {
      weightKg: parseNumber(r?.purchases?.weightKg),
      rate: parseNumber(r?.purchases?.rate),
      amount: parseNumber(r?.purchases?.amount),
    },
    totalStock: {
      weightKg: parseNumber(r?.totalStock?.weightKg),
      weightedRate: parseNumber(
        r?.totalStock?.weightedRate ?? r?.totalStock?.rate,
      ),
      amount: parseNumber(r?.totalStock?.amount),
    },
    sales: {
      weightKg: parseNumber(r?.sales?.weightKg),
      avgRate: parseNumber(r?.sales?.avgRate ?? r?.sales?.rate),
      amount: parseNumber(r?.sales?.amount),
    },
    closingStock: {
      weightKg: parseNumber(r?.closingStock?.weightKg),
      rate: parseNumber(r?.closingStock?.rate),
      amount: parseNumber(r?.closingStock?.amount),
    },
    commission: {
      cm: parseNumber(r?.commission?.cm ?? r?.grossCommission?.cm),
      prev: parseNumber(r?.commission?.prev ?? r?.grossCommission?.prev),
      discountC2: parseOptionalNumber(r?.commission?.discountC2),
      total: parseNumber(r?.commission?.total ?? r?.grossCommission?.total),
    },
    pickup: {
      cm: parseNumber(r?.pickup?.cm),
      prev: parseNumber(r?.pickup?.prev),
      total: parseNumber(r?.pickup?.total),
    },
    expenses: {
      cm: parseNumber(r?.expenses?.cm),
      prev: parseNumber(r?.expenses?.prev),
      total: parseNumber(r?.expenses?.total),
    },
    netProfit: {
      cm: parseNumber(r?.netProfit?.cm),
      total: parseNumber(r?.netProfit?.total),
    },
    lendingToCustomers: parseNumber(r?.lendingToCustomers),
    cashBalance: parseNumber(r?.cashBalance),
    cashAdj: r?.cashAdj !== undefined ? parseNumber(r?.cashAdj) : undefined,
    totalCapital: parseNumber(r?.totalCapital),
    profitBreakdown: r?.profitBreakdown,
    balanceSheet: r?.balanceSheet,
    fixedAssets: r?.fixedAssets,
    dividends: r?.dividends,
  };
}

export function parseMonthlyRolloutStatusFromRaw(
  raw: RawRecord | null | undefined,
  fallbackMonth = '2026-08',
): MonthlyRolloutStatus {
  if (!raw) {
    return {
      lastRolledOutMonth: fallbackMonth,
      lastRolledOutAt: new Date().toISOString(),
      history: [],
    };
  }

  const lastRolledOutMonth = parseString(raw.lastRolledOutMonth, fallbackMonth);
  const lastRolledOutAt = raw.lastRolledOutAt
    ? parseIsoDate(raw.lastRolledOutAt)
    : undefined;

  const rawHistory = Array.isArray(raw.history) ? raw.history : [];
  const history = rawHistory.map((h: any) => ({
    month: parseString(h.month),
    rolledOutAt: parseIsoDate(h.rolledOutAt),
    summary: h.summary
      ? parseMonthlyTradingSummaryFromRaw(h.summary)
      : undefined,
  }));

  return {
    lastRolledOutMonth,
    lastRolledOutAt,
    history,
  };
}
