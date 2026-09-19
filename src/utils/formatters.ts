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
  dateVal: { seconds?: number } | string | number | Date | undefined,
): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'object' && 'seconds' in dateVal && dateVal.seconds) {
    return new Date(dateVal.seconds * 1000).toLocaleDateString('en-IN');
  }
  return new Date(dateVal as string | number | Date).toLocaleDateString(
    'en-IN',
  );
};

export const parseTransactionDate = (
  dateVal: { seconds?: number } | string | number | Date | undefined,
): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (
    typeof dateVal === 'object' &&
    'seconds' in dateVal &&
    typeof dateVal.seconds === 'number'
  ) {
    return new Date(dateVal.seconds * 1000);
  }
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === 'string') {
    const s = dateVal.trim();
    if (!s) return null;

    // Check for DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const formatWeight = (kg: number): string => {
  if (!kg || kg <= 0) return '0 kg';
  return `${kg.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`;
};

export const calculateCustomerBalance = (
  transactions: {
    type?: string;
    item?: string;
    amount?: number;
    cashPaid?: number;
    remainingDue?: number;
    paymentAmount?: number;
  }[],
): number => {
  const calculatedDue = transactions.reduce((acc, tx) => {
    if (tx.type === 'PAYMENT') {
      return acc - (tx.paymentAmount || 0);
    }
    // All charges: SALE, SERVICE, OPENING_BALANCE, etc.
    const credit = tx.remainingDue ?? (tx.amount || 0) - (tx.cashPaid || 0);
    return acc + credit;
  }, 0);

  return Math.max(0, calculatedDue);
};
