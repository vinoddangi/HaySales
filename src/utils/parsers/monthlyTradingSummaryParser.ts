import { MonthlyTradingSummary } from '../../types';
import { parseNumber, parseOptionalNumber, parseString } from './utils';

/**
 * Parses raw trading summary into MonthlyTradingSummary
 */
export function parseMonthlyTradingSummary(raw: any): MonthlyTradingSummary {
  return {
    period: parseString(raw?.period),
    label: parseString(raw?.label || raw?.name),
    openingStock: {
      weightKg: parseNumber(raw?.openingStock?.weightKg),
      rate: parseNumber(raw?.openingStock?.rate),
      amount: parseNumber(raw?.openingStock?.amount),
    },
    purchases: {
      weightKg: parseNumber(raw?.purchases?.weightKg),
      rate: parseNumber(raw?.purchases?.rate),
      amount: parseNumber(raw?.purchases?.amount),
    },
    totalStock: {
      weightKg: parseNumber(raw?.totalStock?.weightKg),
      weightedRate: parseNumber(
        raw?.totalStock?.weightedRate ?? raw?.totalStock?.rate,
      ),
      amount: parseNumber(raw?.totalStock?.amount),
    },
    sales: {
      weightKg: parseNumber(raw?.sales?.weightKg),
      avgRate: parseNumber(raw?.sales?.avgRate ?? raw?.sales?.rate),
      amount: parseNumber(raw?.sales?.amount),
    },
    closingStock: {
      weightKg: parseNumber(raw?.closingStock?.weightKg),
      rate: parseNumber(raw?.closingStock?.rate),
      amount: parseNumber(raw?.closingStock?.amount),
    },
    commission: {
      cm: parseNumber(raw?.commission?.cm ?? raw?.grossCommission?.cm),
      prev: parseNumber(raw?.commission?.prev ?? raw?.grossCommission?.prev),
      discountC2: parseOptionalNumber(raw?.commission?.discountC2),
      total: parseNumber(raw?.commission?.total ?? raw?.grossCommission?.total),
    },
    daalu: {
      cm: parseNumber(raw?.daalu?.cm),
      prev: parseNumber(raw?.daalu?.prev),
      total: parseNumber(raw?.daalu?.total),
    },
    expenses: {
      cm: parseNumber(raw?.expenses?.cm),
      prev: parseNumber(raw?.expenses?.prev),
      total: parseNumber(raw?.expenses?.total),
    },
    netProfit: {
      cm: parseNumber(raw?.netProfit?.cm),
      total: parseNumber(raw?.netProfit?.total),
    },
    lendingToCustomers: parseNumber(raw?.lendingToCustomers),
    cashBalance: parseNumber(raw?.cashBalance),
    totalCapital: parseNumber(raw?.totalCapital),
  };
}
