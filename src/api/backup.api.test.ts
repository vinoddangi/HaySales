import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import { hasPendingPreviousYearRecords } from './backup.api';

describe('backup.api tests', () => {
  it('detects unbacked previous year records correctly', () => {
    const currentYear = 2026;
    const pastTx: Transaction = {
      id: 'tx-1',
      type: 'SALE',
      date: new Date(2025, 5, 1),
      amount: 500,
    };
    const currentTx: Transaction = {
      id: 'tx-2',
      type: 'SALE',
      date: new Date(2026, 2, 1),
      amount: 300,
    };

    expect(hasPendingPreviousYearRecords([currentTx], currentYear)).toBe(false);
    expect(
      hasPendingPreviousYearRecords([currentTx, pastTx], currentYear),
    ).toBe(true);
  });

  it('ignores opening balance records created for current year', () => {
    const currentYear = 2026;
    const openingBal: Transaction = {
      id: 'opening_1',
      type: 'OPENING_BALANCE',
      date: new Date(2026, 0, 1),
      amount: 1000,
    };
    expect(hasPendingPreviousYearRecords([openingBal], currentYear)).toBe(
      false,
    );
  });

  it('flags pending backup if backupStatus has not backed up targetYear (2025)', () => {
    const currentYear = 2026;
    // When no status doc or lastBackedUpYear < 2025
    expect(
      hasPendingPreviousYearRecords([], currentYear, { lastBackedUpYear: 0 }),
    ).toBe(true);
    expect(
      hasPendingPreviousYearRecords([], currentYear, {
        lastBackedUpYear: 2024,
      }),
    ).toBe(true);
    // When lastBackedUpYear >= 2025
    expect(
      hasPendingPreviousYearRecords([], currentYear, {
        lastBackedUpYear: 2025,
      }),
    ).toBe(false);
  });
});
