export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Returns the local calendar date formatted strictly as 'YYYY-MM-DD' (e.g. '2026-01-16').
 * Unlike Date.prototype.toISOString() which uses UTC and rolls back by 1 day between midnight
 * and 5:30 AM in India (IST), this uses the local device / Indian timezone date components.
 */
export const getTodayDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatRupee = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(num || 0));
};

export const formatDate = (
  dateVal:
    | { seconds?: number; _seconds?: number; toDate?: () => Date }
    | string
    | number
    | Date
    | undefined,
): string => {
  const d = parseTransactionDate(dateVal);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const parseTransactionDate = (
  dateVal:
    | {
        seconds?: number;
        _seconds?: number;
        toDate?: () => Date;
        toMillis?: () => number;
      }
    | string
    | number
    | Date
    | undefined,
): Date | null => {
  if (!dateVal) return null;

  // 1. Native Date instance
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  // 2. Firestore Timestamp instance with toDate() or toMillis()
  if (typeof (dateVal as any)?.toDate === 'function') {
    try {
      const d = (dateVal as any).toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // Fallback
    }
  }
  if (typeof (dateVal as any)?.toMillis === 'function') {
    try {
      const ms = (dateVal as any).toMillis();
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    } catch {
      // Fallback
    }
  }

  // 3. Firestore Timestamp plain object ({ seconds } or { _seconds })
  if (typeof dateVal === 'object') {
    const sec =
      typeof (dateVal as any).seconds === 'number'
        ? (dateVal as any).seconds
        : typeof (dateVal as any)._seconds === 'number'
          ? (dateVal as any)._seconds
          : null;
    if (sec !== null) {
      const d = new Date(sec * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // 4. Epoch milliseconds or timestamp number
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  // 5. Date String formats
  if (typeof dateVal === 'string') {
    const s = dateVal.trim();
    if (!s) return null;

    // A. ISO strings with time or UTC indicator (e.g. 2026-01-15T14:30:00.000Z) -> parse with full timezone conversion
    if (s.includes('T') || s.endsWith('Z')) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d;
    }

    // B. Pure Date String: YYYY-MM-DD (e.g. 2025-01-15) -> lock to local midday
    const ymdMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }

    // C. Pattern: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY -> lock to local midday
    const ddmmyyyyMatch = s.match(
      /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/i,
    );
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      let year = parseInt(ddmmyyyyMatch[3], 10);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      return new Date(year, month, day, 12, 0, 0);
    }

    // D. Generic Date parse fallback
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

export const formatWeight = (kg: number): string => {
  if (!kg || kg <= 0) return '0 kg';
  return `${Math.round(kg).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kg`;
};

export const formatWeightWithRate = (
  weight?: number,
  rate?: number,
  amount?: number,
): string => {
  if (!weight || weight <= 0) return '';
  const weightStr = `${weight.toLocaleString('en-IN')} kg`;
  const effectiveRate = rate || (amount && weight > 0 ? amount / weight : 0);
  if (!effectiveRate || effectiveRate <= 0) return weightStr;
  const rateStr = `₹${effectiveRate.toFixed(2).replace(/\.00$/, '')}/kg`;
  return `${weightStr} @ ${rateStr}`;
};

export const getTransactionFinancials = (tx: {
  amount?: number;
  cashPaid?: number;
  remainingDue?: number;
  type?: string;
}): {
  amount: number;
  cash: number;
  credit: number;
  paymentVal: number;
} => {
  const isPayment = tx.type === 'PAYMENT';
  const amount = Number(tx.amount) || 0;
  const paymentVal = isPayment ? amount : 0;
  const cash = Number(tx.cashPaid) || 0;
  const credit =
    tx.remainingDue !== undefined
      ? Number(tx.remainingDue) || 0
      : Math.max(0, amount - cash);

  return { amount, cash, credit, paymentVal };
};

export const calculateCustomerBalance = (
  transactions: {
    type?: string;
    item?: string;
    amount?: number;
    cashPaid?: number;
    remainingDue?: number;
  }[],
): number => {
  const calculatedDue = transactions.reduce((acc, tx) => {
    if (tx.type === 'PAYMENT') {
      return acc - (Number(tx.amount) || 0);
    }
    const { credit } = getTransactionFinancials(tx);
    return acc + credit;
  }, 0);

  return Math.max(0, calculatedDue);
};
