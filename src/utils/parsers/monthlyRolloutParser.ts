import { MonthlyRolloutStatus } from '../../types';
import { parseMonthlyTradingSummary } from './monthlyTradingSummaryParser';
import { parseIsoDate, parseString } from './utils';

/**
 * Parses raw monthly rollout metadata or snapshot into MonthlyRolloutStatus
 */
export function parseMonthlyRolloutStatus(
  raw: any,
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
    summary: h.summary ? parseMonthlyTradingSummary(h.summary) : undefined,
  }));

  return {
    lastRolledOutMonth,
    lastRolledOutAt,
    history,
  };
}
