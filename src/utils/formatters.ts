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

export const formatDate = (dateStr?: string): string => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (trimmed.length < 10) return '';
  const [yyyy, mm, dd] = trimmed.slice(0, 10).split('-');
  if (!yyyy || !mm || !dd) return '';
  return `${dd}/${mm}/${yyyy}`;
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
