import { Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { VALID_EXPENSE_CATEGORIES } from '../../../business/purchasesBusiness';
import { Button, Input, SelectField, Text } from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
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

const ITEM_OPTIONS = [
  { value: 'Chana', label: 'Chana' },
  { value: 'Gavatri', label: 'Gavatri' },
  { value: 'B. Kutty', label: 'B. Kutty' },
  { value: 'Kutty', label: 'Kutty' },
  { value: 'Tuvar', label: 'Tuvar' },
  { value: 'Others', label: 'Others' },
];

const SERVICE_OPTIONS = [
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Tractor', label: 'Tractor' },
  { value: 'Commission', label: 'Commission' },
  { value: 'Labour', label: 'Labour' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Others', label: 'Others' },
];

const EXPENSE_OPTIONS = VALID_EXPENSE_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat,
}));

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
      updated.cashPaid = cashPaid;
      updated.vendorName = vendorName.trim() || undefined;
    }

    await onSave(updated);
  };

  const titleText = isSale
    ? 'Sale Record'
    : isService
      ? 'Service Record'
      : isPayment
        ? 'Payment Record'
        : isPurchase
          ? 'Stock Purchase'
          : 'Expense Record';

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md animate-slide-up space-y-4 overflow-y-auto rounded-t-3xl border-t border-m3-outline-variant bg-m3-surface p-5 shadow-2xl">
        {/* Header */}
        <Flex
          align="center"
          justify="between"
          fullWidth
          className="border-b border-m3-outline-variant/30 pb-3"
        >
          <div>
            <Text styleAs="h4" appearance="primary" weight="bold">
              Edit {titleText}
            </Text>
            {transaction.customerName && (
              <Text
                styleAs="body-sm"
                sentiment="accent"
                weight="semibold"
                className="block"
              >
                {transaction.customerName}
              </Text>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-m3-on-surface-variant hover:bg-m3-surface-container-high"
          >
            <X className="h-4 w-4" />
          </button>
        </Flex>

        {/* Edit Form */}
        <Flex direction="column" gap="md" fullWidth>
          <Input
            label="Date"
            type="date"
            required
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />

          {(isSale || isPurchase) && (
            <SelectField
              label="Item / Crop Type"
              required
              value={item}
              options={ITEM_OPTIONS}
              onChange={(e) => setItem(e.target.value)}
            />
          )}

          {isService && (
            <SelectField
              label="Service Type"
              required
              value={item}
              options={SERVICE_OPTIONS}
              onChange={(e) => setItem(e.target.value)}
            />
          )}

          {isExpense && (
            <SelectField
              label="Expense Category"
              required
              value={expenseCategory}
              options={EXPENSE_OPTIONS}
              onChange={(e) =>
                setExpenseCategory(e.target.value as ExpenseCategoryType)
              }
            />
          )}

          {(isSale || isPurchase) && (
            <Grid columns={2} gap="md" fullWidth>
              <Input
                label="Weight (kg)"
                type="number"
                required
                value={weightKg || ''}
                onChange={(e) => setWeightKg(Number(e.target.value))}
              />
              <Input
                label="Total Amount (₹)"
                type="number"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </Grid>
          )}

          {isService && (
            <Grid columns={2} gap="md" fullWidth>
              <Input
                label="Service Fee (₹)"
                type="number"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <Input
                label="Cash Paid (₹)"
                type="number"
                value={cashPaid || ''}
                onChange={(e) => setCashPaid(Number(e.target.value))}
              />
            </Grid>
          )}

          {(isSale || isPurchase || isExpense) && (
            <Input
              label="Cash Paid (₹)"
              type="number"
              value={cashPaid || ''}
              onChange={(e) => setCashPaid(Number(e.target.value))}
            />
          )}

          {isPayment && (
            <Input
              label="Payment Amount (₹)"
              type="number"
              required
              value={paymentAmount || ''}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
            />
          )}

          {isExpense && (
            <Input
              label="Expense Amount (₹)"
              type="number"
              required
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          )}

          {(isPurchase || isExpense) && (
            <Input
              label="Supplier / Payee Name"
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          )}

          <Input
            label="Notes / Remarks"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Flex>

        {/* Action Buttons */}
        <Flex direction="column" gap="sm" fullWidth className="pt-2">
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
                <Flex align="center" gap="sm" fullWidth>
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
                </Flex>
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
        </Flex>
      </div>
    </div>
  );
};
