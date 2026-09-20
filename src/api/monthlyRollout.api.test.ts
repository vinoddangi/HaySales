import { describe, expect, it } from 'vitest';
import {
  getMonthString,
  getNextMonthString,
  isTransactionMonthLocked,
} from './monthlyRollout.api';

describe('monthlyRollout.api tests', () => {
  it('formats dates to YYYY-MM string correctly', () => {
    const d = new Date(2026, 7, 15); // Aug 2026
    expect(getMonthString(d)).toBe('2026-08');
  });

  it('calculates the next sequential month string', () => {
    expect(getNextMonthString('2026-08')).toBe('2026-09');
    expect(getNextMonthString('2026-12')).toBe('2027-01');
  });

  it('allows entry for current active month following last rolled out month', () => {
    const rolloutStatus = {
      lastRolledOutMonth: '2026-08',
    };

    // Dates in Sep 2026 (next sequential month) should not be locked
    const sepDate = new Date(2026, 8, 10);
    expect(isTransactionMonthLocked(sepDate, rolloutStatus)).toBe(false);

    // Dates in Aug 2026 (already rolled out period) should not be locked
    const augDate = new Date(2026, 7, 10);
    expect(isTransactionMonthLocked(augDate, rolloutStatus)).toBe(false);
  });

  it('locks entry for future months that skip sequential rollout', () => {
    const rolloutStatus = {
      lastRolledOutMonth: '2026-08',
    };

    // Dates in Oct 2026 (2 months ahead) should be locked until Sep 2026 is rolled out
    const octDate = new Date(2026, 9, 10);
    expect(isTransactionMonthLocked(octDate, rolloutStatus)).toBe(true);

    // Dates in 2027 should also be locked
    const nextYearDate = new Date(2027, 0, 10);
    expect(isTransactionMonthLocked(nextYearDate, rolloutStatus)).toBe(true);
  });
});
