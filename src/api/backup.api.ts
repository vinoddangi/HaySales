import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../store/firebaseConfig';
import { Transaction } from '../types';
import { parseTransactionDate } from '../utils/formatters';

export interface BackupStatus {
  lastBackedUpYear: number;
  backedUpAt?: any;
}

export interface BackupResult {
  backedUpCount: number;
  purchasesBackedUpCount: number;
  customersProcessed: number;
  targetYear: number;
}

/**
 * Fetch the latest backup status metadata from Firestore
 */
export async function fetchBackupStatusApi(): Promise<BackupStatus> {
  try {
    const docRef = doc(db, 'metadata', 'backup_status');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        lastBackedUpYear: Number(data.lastBackedUpYear) || 0,
        backedUpAt: data.backedUpAt,
      };
    }
  } catch (err) {
    console.warn('Error fetching backup status metadata:', err);
  }
  return { lastBackedUpYear: 0 };
}

/**
 * Check whether previous year backup is required / pending.
 * Returns true if:
 * 1. The Firestore backup status has not recorded a backup for (currentYear - 1), OR
 * 2. Any active transactions / purchases are from a previous year (< currentYear)
 */
export function hasPendingPreviousYearRecords(
  allTransactions: Transaction[],
  currentYear = new Date().getFullYear(),
  backupStatus?: BackupStatus | null,
): boolean {
  // If backup status is loaded and indicates previous year is not yet backed up
  if (backupStatus !== undefined && backupStatus !== null) {
    if (backupStatus.lastBackedUpYear < currentYear - 1) {
      return true;
    }
  }

  if (!allTransactions || allTransactions.length === 0) return false;

  return allTransactions.some((tx) => {
    const d = parseTransactionDate(tx.date);

    // If it is an OPENING_BALANCE created as a rollover for current year, ignore it
    if (tx.type === 'OPENING_BALANCE') {
      if (d && d.getFullYear() >= currentYear) return false;
      if (
        typeof tx.note === 'string' &&
        (tx.note.includes(`customers-${currentYear - 1}`) ||
          tx.note.includes(`Customers-${currentYear - 1}`) ||
          tx.note.includes(`transactions-${currentYear - 1}`) ||
          tx.note.includes(`Transactions-${currentYear - 1}`))
      ) {
        return false;
      }
    }

    if (d) {
      return d.getFullYear() < currentYear;
    }

    // Fallback: check if date property has a 4-digit year string matching < currentYear
    if (typeof tx.date === 'string') {
      const match = tx.date.match(/\b(20\d\d)\b/);
      if (match) {
        const year = parseInt(match[1], 10);
        return year < currentYear;
      }
    }

    return false;
  });
}

/**
 * Backup/Rollout transactions & purchases by year to customers-(YYYY) with transactions subcollection
 * & purchases-(YYYY), aggregate balance, create opening balance, and update metadata/backup_status
 */
export async function backupYearlyTransactionsApi(
  year?: number,
): Promise<BackupResult> {
  const currentYear = new Date().getFullYear();
  const targetYear = year || currentYear - 1;
  const backupCustomersColName = `customers-${targetYear}`;
  const backupPurchasesColName = `purchases-${targetYear}`;

  let backedUpCount = 0;
  let customersProcessed = 0;
  let purchasesBackedUpCount = 0;

  // 1. Process all customers -> archive profile snapshot into customers-(YYYY) and transactions into subcollections
  const customersSnap = await getDocs(collection(db, 'customers'));

  for (const custDoc of customersSnap.docs) {
    const custId = custDoc.id;
    const custData = custDoc.data();
    const currentTxCol = collection(db, 'customers', custId, 'transactions');
    const txSnap = await getDocs(currentTxCol);

    const batch = writeBatch(db);
    const backupCustDocRef = doc(db, backupCustomersColName, custId);
    const backupTxColRef = collection(
      db,
      backupCustomersColName,
      custId,
      'transactions',
    );

    // Save customer profile snapshot into customers-(YYYY)
    batch.set(
      backupCustDocRef,
      {
        ...custData,
        year: targetYear,
      },
      { merge: true },
    );

    let cumulativeDue = 0;
    let custMovedCount = 0;

    txSnap.forEach((tDoc) => {
      const data = tDoc.data();
      const txDate = parseTransactionDate(data.date);
      const txYear = txDate ? txDate.getFullYear() : currentYear;

      // Only backup and roll forward transactions from targetYear or earlier (< currentYear)
      if (txYear <= targetYear) {
        const backupDocRef = doc(backupTxColRef, tDoc.id);
        batch.set(backupDocRef, data, { merge: true });

        if (data.type === 'PAYMENT') {
          cumulativeDue -= Number(data.paymentAmount) || 0;
        } else {
          const credit =
            data.remainingDue !== undefined
              ? Number(data.remainingDue) || 0
              : (Number(data.amount) || 0) - (Number(data.cashPaid) || 0);
          cumulativeDue += credit;
        }

        batch.delete(tDoc.ref);
        backedUpCount++;
        custMovedCount++;
      }
    });

    if (custMovedCount > 0) {
      const finalOpeningDue = Math.max(0, cumulativeDue);

      batch.set(
        backupCustDocRef,
        {
          outstandingAmountAtYearEnd: finalOpeningDue,
        },
        { merge: true },
      );

      if (finalOpeningDue > 0) {
        const newOpeningRef = doc(
          currentTxCol,
          `opening_balance_${targetYear}`,
        );
        batch.set(newOpeningRef, {
          type: 'OPENING_BALANCE',
          item: 'Previous Outstanding',
          amount: finalOpeningDue,
          cashPaid: 0,
          remainingDue: finalOpeningDue,
          date: new Date(currentYear, 0, 1),
          note: `Cumulative balance rolled over into ${backupCustomersColName}`,
        });
      }

      batch.set(
        custDoc.ref,
        { outstandingAmount: finalOpeningDue },
        { merge: true },
      );
    }

    await batch.commit();
    customersProcessed++;
  }

  // 2. Process root Purchases collection -> archive into purchases-(YYYY)
  const purchasesSnap = await getDocs(collection(db, 'purchases'));
  if (!purchasesSnap.empty) {
    const purchaseBatch = writeBatch(db);
    let pCount = 0;

    purchasesSnap.forEach((pDoc) => {
      const pData = pDoc.data();
      const pDate = parseTransactionDate(pData.date);
      const pYear = pDate ? pDate.getFullYear() : currentYear;

      if (pYear <= targetYear) {
        const backupDocRef = doc(db, backupPurchasesColName, pDoc.id);
        purchaseBatch.set(backupDocRef, pData, { merge: true });
        purchaseBatch.delete(pDoc.ref);
        purchasesBackedUpCount++;
        pCount++;
      }
    });

    if (pCount > 0) {
      await purchaseBatch.commit();
    }
  }

  // 3. Update Firestore metadata/backup_status
  try {
    const statusRef = doc(db, 'metadata', 'backup_status');
    await setDoc(
      statusRef,
      {
        lastBackedUpYear: targetYear,
        backedUpAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (statusErr) {
    console.warn('Failed to update backup status document:', statusErr);
  }

  return {
    backedUpCount,
    purchasesBackedUpCount,
    customersProcessed,
    targetYear,
  };
}
