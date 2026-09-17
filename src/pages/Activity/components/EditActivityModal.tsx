import { Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/common/Button';
import { ExpenseCategoryType, Transaction } from '../../../types';
import { parseTransactionDate } from '../../../utils/formatters';

export interface EditActivityModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (_updatedData: Partial<Transaction>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const EXPENSE_CATEGORIES: ExpenseCategoryType[] = [
  'Interest',
  'Fuel',
  'Labor',
  'Food / Drink',
  'Tools',
  'Others',
];

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  transaction,
  isSaving,
  onClose,
  onSave,
  onDelete,
}) => {
  const [dateStr, setDateStr] = useState('');
  const [item, setItem] = useState('');
  const [expenseCategory, setExpenseCategory] =
    useState<ExpenseCategoryType>('Fuel');
  const [weightKg, setWeightKg] = useState(0);
  const [amount, setAmount] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [vendorName, setVendorName] = useState('');
  const [note, setNote] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      const d = parseTransactionDate(transaction.date);
      if (d) {
        setDateStr(d.toISOString().split('T')[0]);
      } else {
        setDateStr(new Date().toISOString().split('T')[0]);
      }
      setItem(transaction.item || 'Chana');
      setExpenseCategory(
        (transaction.expenseCategory as ExpenseCategoryType) || 'Fuel',
      );
      setWeightKg(Number(transaction.weightKg) || 0);
      setAmount(Number(transaction.amount) || 0);
      setCashPaid(Number(transaction.cashPaid) || 0);
      setPaymentAmount(
        Number(transaction.paymentAmount) || Number(transaction.amount) || 0,
      );
      setVendorName(transaction.vendorName || '');
      setNote(transaction.note || '');
      setShowConfirmDelete(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const isSale = transaction.type === 'SALE';
  const isService = transaction.type === 'SERVICE';
  const isPayment = transaction.type === 'PAYMENT';
  const isPurchase = transaction.type === 'PURCHASE';
  const isExpense = transaction.type === 'EXPENSE';

  const handleSave = async () => {
    const updated: Partial<Transaction> = {
      date: new Date(dateStr),
      note: note.trim() || undefined,
    };

    if (isSale) {
      updated.item = item;
      updated.weightKg = weightKg;
      updated.amount = amount;
      updated.cashPaid = cashPaid;
    } else if (isService) {
      updated.item = item;
      updated.amount = amount;
      updated.cashPaid = cashPaid;
    } else if (isPayment) {
      updated.paymentAmount = paymentAmount;
    } else if (isPurchase) {
      updated.item = item;
      updated.weightKg = weightKg;
      updated.amount = amount;
      updated.cashPaid = cashPaid;
      updated.vendorName = vendorName.trim() || undefined;
    } else if (isExpense) {
      updated.expenseCategory = expenseCategory;
      updated.amount = amount;
      updated.vendorName = vendorName.trim() || undefined;
    }

    await onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md animate-slide-up space-y-4 overflow-y-auto rounded-t-3xl border-t border-m3-outline-variant bg-m3-surface p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-m3-outline-variant/30 pb-3">
          <div>
            <h3 className="text-sm font-bold text-m3-on-surface">
              Edit{' '}
              {isSale
                ? 'Sale Record'
                : isService
                  ? 'Service Record'
                  : isPayment
                    ? 'Payment Record'
                    : isPurchase
                      ? 'Stock Purchase'
                      : 'Expense Record'}
            </h3>
            {transaction.customerName && (
              <p className="text-xs font-semibold text-m3-primary">
                {transaction.customerName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-m3-on-surface-variant hover:bg-m3-surface-container-high"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Edit Form */}
        <div className="space-y-3.5 text-xs">
          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
              Date
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
            />
          </div>

          {/* Item Type for Sale & Purchase */}
          {(isSale || isPurchase) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                Item / Crop Type
              </label>
              <select
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
              >
                <option value="Chana">Chana</option>
                <option value="Gavatri">Gavatri</option>
                <option value="B. Kutty">B. Kutty</option>
                <option value="Kutty">Kutty</option>
                <option value="Tuvar">Tuvar</option>
                <option value="Others">Others</option>
              </select>
            </div>
          )}

          {/* Service Item Type */}
          {isService && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                Service Type
              </label>
              <select
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
              >
                <option value="Pickup">Pickup</option>
                <option value="Tractor">Tractor</option>
                <option value="Commission">Commission</option>
                <option value="Labour">Labour</option>
                <option value="Transport">Transport</option>
                <option value="Others">Others</option>
              </select>
            </div>
          )}

          {/* Expense Category */}
          {isExpense && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                Expense Category
              </label>
              <select
                value={expenseCategory}
                onChange={(e) =>
                  setExpenseCategory(e.target.value as ExpenseCategoryType)
                }
                className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Weight & Amount for Sale & Purchase */}
          {(isSale || isPurchase) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg || ''}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Amount and Cash Paid for Service */}
          {isService && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                  Service Fee (₹)
                </label>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                  Cash Paid (₹)
                </label>
                <input
                  type="number"
                  value={cashPaid || ''}
                  onChange={(e) => setCashPaid(Number(e.target.value))}
                  className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Cash Paid for Sale & Purchase */}
          {(isSale || isPurchase) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                Cash Paid (₹)
              </label>
              <input
                type="number"
                value={cashPaid || ''}
                onChange={(e) => setCashPaid(Number(e.target.value))}
                className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
              />
            </div>
          )}

          {/* Payment Amount for Payment */}
          {isPayment && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
              />
            </div>
          )}

          {/* Amount for Expense */}
          {isExpense && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                Expense Amount (₹)
              </label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
              />
            </div>
          )}

          {/* Vendor / Payee Name */}
          {(isPurchase || isExpense) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                Supplier / Payee Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
              />
            </div>
          )}

          {/* Note / Remarks */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
              Notes / Remarks
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            variant="filled"
            className="w-full text-xs"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </Button>

          {onDelete && (
            <div>
              {showConfirmDelete ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="filled"
                    className="flex-1 bg-rose-600 text-xs text-white hover:bg-rose-700"
                    onClick={onDelete}
                    disabled={isSaving}
                  >
                    Confirm Delete
                  </Button>
                  <Button
                    variant="tonal"
                    className="text-xs"
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Record</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
