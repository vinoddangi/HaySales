import { hasPendingMonthlyRollout } from '../business/monthlyRolloutBusiness';
import baselineHistory from '../data/monthlyRolloutHistory.json';
import { doc, getDoc, setDoc } from '../services/dbBridge';
import { db } from '../store/firebaseConfig';
import { MonthlyRolloutStatus, MonthlyTradingSummary } from '../types';
import { parseTransactionDate } from '../utils/formatters';
import { parseMonthlyRolloutStatus } from '../utils/parsers';

export const DEFAULT_ROLLED_OUT_MONTH = '2026-08';

/**
 * Fetch the latest monthly rollout status metadata from DB (or local IndexedDB)
 */
export async function fetchMonthlyRolloutStatusApi(): Promise<MonthlyRolloutStatus> {
  try {
    const docRef = doc(db, 'metadata', 'monthly_rollout_status');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return parseMonthlyRolloutStatus(snap.data(), DEFAULT_ROLLED_OUT_MONTH);
    }
  } catch (err) {
    console.warn('Error fetching monthly rollout status metadata:', err);
  }
  return parseMonthlyRolloutStatus(baselineHistory, DEFAULT_ROLLED_OUT_MONTH);
}

/**
 * Perform monthly rollout for target month and save metadata in DB
 */
export async function rolloutMonthApi(
  targetMonth: string,
  summary?: MonthlyTradingSummary,
): Promise<MonthlyRolloutStatus> {
  const currentStatus = await fetchMonthlyRolloutStatusApi();

  const newHistory = [
    ...(currentStatus.history || []),
    {
      month: targetMonth,
      rolledOutAt: new Date().toISOString(),
      summary,
    },
  ];

  const updatedStatus: MonthlyRolloutStatus = {
    lastRolledOutMonth: targetMonth,
    lastRolledOutAt: new Date().toISOString(),
    history: newHistory,
  };

  const docRef = doc(db, 'metadata', 'monthly_rollout_status');
  await setDoc(docRef, updatedStatus, { merge: true });

  return updatedStatus;
}

/**
 * Format a Date to YYYY-MM
 */
export function getMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the next sequential month in YYYY-MM format
 */
export function getNextMonthString(monthStr: string): string {
  const [yStr, mStr] = monthStr.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10);
  m += 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Check whether a transaction date is locked because prior monthly rollouts are unclosed.
 */
export function isTransactionMonthLocked(
  date: any,
  rolloutStatus?: MonthlyRolloutStatus | null,
): boolean {
  const lastRolledOut =
    rolloutStatus?.lastRolledOutMonth || DEFAULT_ROLLED_OUT_MONTH;
  const d = parseTransactionDate(date) || new Date();
  const txMonth = getMonthString(d);

  // If the transaction month is more than 1 month ahead of lastRolledOutMonth, it is locked
  const nextAllowedMonth = getNextMonthString(lastRolledOut);

  if (txMonth > nextAllowedMonth) {
    return true;
  }

  // Also check if current date month is ahead of last rolled out
  const nowDate = new Date();
  const period = lastRolledOut.replace('-', '_');
  const check = hasPendingMonthlyRollout(nowDate, period);
  return check.isPending && txMonth === getMonthString(nowDate);
}
