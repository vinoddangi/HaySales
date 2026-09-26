import { AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { TextField } from '../../../../components/TextField';
import { CropCategory, VALID_CROP_CATEGORIES } from '../../../../models';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './SaleFormCard.css';

export interface SaleFormData {
  category: CropCategory;
  weight: number;
  amount: number;
  discount?: number;
  cashPaid: number;
  date: string;
  note?: string;
}

export interface SaleFormCardProps {
  outstandingDue: number;
  creditLimit: number;
  isSaving: boolean;
  onSubmit: (_data: SaleFormData) => Promise<void>;
}

const CROP_OPTIONS = [
  { value: '', label: 'Select Crop Type' },
  ...VALID_CROP_CATEGORIES.map((crop) => ({ value: crop, label: crop })),
];

export const SaleFormCard: React.FC<SaleFormCardProps> = ({
  outstandingDue,
  creditLimit,
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<CropCategory>('Tuvar');
  const [weight, setWeight] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [allCash, setAllCash] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  const effectiveCashPaid = allCash ? amount : cashPaid;
  const remainingDue = Math.max(0, amount - discount - effectiveCashPaid);
  const newOutstandingDue = outstandingDue + remainingDue;
  const avgRate = weight > 0 && amount > 0 ? amount / weight : 0;
  const isOverCreditLimit = newOutstandingDue > creditLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || amount <= 0 || weight <= 0) return;

    await onSubmit({
      category,
      weight,
      amount,
      discount: discount > 0 ? discount : undefined,
      cashPaid: effectiveCashPaid,
      date,
      note: note.trim() || undefined,
    });

    // Reset form
    setWeight(0);
    setAmount(0);
    setDiscount(0);
    setCashPaid(0);
    setAllCash(false);
    setNote('');
  };

  const isFormValid = Boolean(category && amount > 0 && weight > 0);

  return (
    <form onSubmit={handleSubmit} className="hs-sale-form-card">
      <h3 className="hs-sale-form-card__section-title">
        Record Crop Sale Invoice
      </h3>

      {/* 1. Date & Crop Type in 2-column Grid */}
      <Grid columns={1} smColumns={2} gap="sm" fullWidth>
        <Grid.Item>
          <TextField
            label="Invoice Date"
            type="date"
            required
            value={date}
            onChange={(val) => setDate(val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Crop Item"
            required
            value={category}
            options={CROP_OPTIONS}
            onChange={(val) => setCategory(val as CropCategory)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Weight (Kg) and Sale Amount (₹) in 2-column Grid */}
      <Grid columns={1} smColumns={2} gap="sm" fullWidth>
        <Grid.Item>
          <TextField
            label="Weight (Kg)"
            type="number"
            required
            placeholder="0"
            value={weight ? String(weight) : ''}
            onChange={(val) => setWeight(Number(val) || 0)}
          />
        </Grid.Item>
        <Grid.Item>
          <TextField
            label="Sale Amount (₹)"
            type="number"
            required
            placeholder="0"
            value={amount ? String(amount) : ''}
            onChange={(val) => setAmount(Number(val) || 0)}
          />
        </Grid.Item>
      </Grid>

      {/* 3. Discount & Payment Settlement Side-by-Side */}
      <Grid columns={1} smColumns={2} gap="sm" fullWidth>
        <Grid.Item>
          <TextField
            label="Discount (₹) (Optional)"
            type="number"
            placeholder="0"
            value={discount ? String(discount) : ''}
            onChange={(val) => setDiscount(Number(val) || 0)}
          />
        </Grid.Item>
        <Grid.Item>
          <div className="flex h-full flex-col justify-center gap-1.5">
            <Checkbox
              label="All Cash (Wipes out dues)"
              checked={allCash}
              onChange={(checked) => setAllCash(checked)}
            />

            {!allCash && (
              <TextField
                label="Cash Paid Now (₹)"
                type="number"
                placeholder="0"
                value={cashPaid ? String(cashPaid) : ''}
                onChange={(val) => setCashPaid(Number(val) || 0)}
              />
            )}
          </div>
        </Grid.Item>
      </Grid>

      {/* 4. Remarks / Note */}
      <TextField
        label="Remarks / Note (Optional)"
        type="text"
        placeholder="e.g. Bag count, vehicle number"
        value={note}
        onChange={(val) => setNote(val)}
      />

      {/* 5. Summary Box */}
      <div className="hs-sale-form-card__summary">
        <div className="hs-sale-form-card__summary-row">
          <span className="hs-sale-form-card__summary-label">
            Derived Rate:
          </span>
          <span className="hs-sale-form-card__summary-value">
            {avgRate > 0 ? `${formatRupee(avgRate)} / Kg` : '—'}
          </span>
        </div>
        <div className="hs-sale-form-card__summary-row">
          <span className="hs-sale-form-card__summary-label">
            Total Billed:
          </span>
          <span className="hs-sale-form-card__summary-value">
            {formatRupee(amount)} ({formatWeight(weight)})
          </span>
        </div>
        <div className="hs-sale-form-card__summary-row">
          <span className="hs-sale-form-card__summary-label">
            Cash Received:
          </span>
          <span className="hs-sale-form-card__summary-value text-emerald-600">
            {formatRupee(effectiveCashPaid)}
          </span>
        </div>
        <div className="hs-sale-form-card__summary-row">
          <span className="hs-sale-form-card__summary-label">
            Added to Dues:
          </span>
          <span className="hs-sale-form-card__summary-value">
            {formatRupee(remainingDue)}
          </span>
        </div>
        <div className="hs-sale-form-card__summary-row">
          <span className="hs-sale-form-card__summary-label">
            New Customer Total Due:
          </span>
          <span className="hs-sale-form-card__summary-value hs-sale-form-card__summary-value--highlight">
            {formatRupee(newOutstandingDue)}
          </span>
        </div>
      </div>

      {/* 6. Credit Warning */}
      {remainingDue > 0 && isOverCreditLimit && (
        <div className="hs-sale-form-card__warning-box">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Customer balance ({formatRupee(newOutstandingDue)}) exceeds credit
            limit ({formatRupee(creditLimit)}). Credit sale permitted.
          </span>
        </div>
      )}

      {/* 7. Submit Button */}
      <Button
        variant="filled"
        type="submit"
        disabled={isSaving || !isFormValid}
      >
        {isSaving ? 'Processing Sale...' : 'Process Sale'}
      </Button>
    </form>
  );
};
