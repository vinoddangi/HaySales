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

export const SERVICE_ITEMS = [
  'Pickup',
  'Tractor',
  'Commission',
  'Labour',
  'Transport',
  'Others',
];

export const formatRupee = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
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
  return d.toLocaleDateString('en-IN');
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

    // Check for DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY with optional time
    const ddmmyyyyMatch = s.match(
      /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*([ap]m))?)?$/i,
    );
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      let year = parseInt(ddmmyyyyMatch[3], 10);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      let hours = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
      const minutes = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
      const seconds = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
      const ampm = ddmmyyyyMatch[7] ? ddmmyyyyMatch[7].toLowerCase() : null;

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    // Standard JavaScript Date parsing (ISO 8601, YYYY-MM-DD, etc.)
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

export const formatWeight = (kg: number): string => {
  if (!kg || kg <= 0) return '0 kg';
  return `${kg.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`;
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
