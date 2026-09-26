import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { TextField } from '../../../../components/TextField';
import { CropCategory, VALID_CROP_CATEGORIES } from '../../../../models';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './PurchaseFormCard.css';

export interface PurchaseFormData {
  category: CropCategory;
  weight: number;
  amount: number;
  cashPaid: number;
  vendorName?: string;
  note?: string;
  date: string;
}

export interface PurchaseFormCardProps {
  isSaving: boolean;
  onSubmit: (_data: PurchaseFormData) => Promise<void>;
}

const CROP_OPTIONS = [
  { value: '', label: 'Select Crop Type' },
  ...VALID_CROP_CATEGORIES.map((crop) => ({ value: crop, label: crop })),
];

export const PurchaseFormCard: React.FC<PurchaseFormCardProps> = ({
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<CropCategory>('Tuvar');
  const [weight, setWeight] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [paidInFull, setPaidInFull] = useState<boolean>(true);
  const [vendorName, setVendorName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const effectiveCashPaid = paidInFull ? amount : cashPaid;
  const avgRate = weight > 0 && amount > 0 ? amount / weight : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || amount <= 0 || weight <= 0) return;

    await onSubmit({
      category,
      weight,
      amount,
      cashPaid: effectiveCashPaid,
      vendorName: vendorName.trim() || undefined,
      note: note.trim() || undefined,
      date,
    });

    // Reset form
    setWeight(0);
    setAmount(0);
    setCashPaid(0);
    setPaidInFull(true);
    setVendorName('');
    setNote('');
  };

  const isFormValid = Boolean(category && amount > 0 && weight > 0);

  return (
    <form onSubmit={handleSubmit} className="hs-purchase-form-card">
      <h3 className="hs-purchase-form-card__section-title">
        Record Raw Crop Procurement
      </h3>

      {/* 1. Date & Crop Type in 2-column Grid */}
      <Grid columns={1} smColumns={2} gap="sm" fullWidth>
        <Grid.Item>
          <TextField
            label="Procurement Date"
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

      {/* 2. Weight (Kg) and Purchase Amount (₹) in 2-column Grid */}
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
            label="Purchase Amount (₹)"
            type="number"
            required
            placeholder="0"
            value={amount ? String(amount) : ''}
            onChange={(val) => setAmount(Number(val) || 0)}
          />
        </Grid.Item>
      </Grid>

      {/* 3. Supplier / Farmer Name */}
      <TextField
        label="Supplier / Farmer Name (Optional)"
        type="text"
        placeholder="e.g. Ramesh Patel, Mandi Trader"
        value={vendorName}
        onChange={(val) => setVendorName(val)}
      />

      {/* 4. Payment Settlement */}
      <div className="hs-purchase-form-card__payment-group">
        <Checkbox
          label="Paid in Full (100% Cash Paid)"
          checked={paidInFull}
          onChange={(checked) => setPaidInFull(checked)}
        />

        {!paidInFull && (
          <TextField
            label="Cash Paid Now (₹)"
            type="number"
            placeholder="0"
            value={cashPaid ? String(cashPaid) : ''}
            onChange={(val) => setCashPaid(Number(val) || 0)}
          />
        )}
      </div>

      {/* 5. Remarks / Note */}
      <TextField
        label="Remarks / Note (Optional)"
        type="text"
        placeholder="e.g. Lot #12, 14% moisture, direct from farm"
        value={note}
        onChange={(val) => setNote(val)}
      />

      {/* 6. Summary Box */}
      <div className="hs-purchase-form-card__summary">
        <div className="hs-purchase-form-card__summary-row">
          <span className="hs-purchase-form-card__summary-label">
            Calculated Buying Rate:
          </span>
          <span className="hs-purchase-form-card__summary-value">
            {avgRate > 0 ? `${formatRupee(avgRate)} / Kg` : '—'}
          </span>
        </div>
        <div className="hs-purchase-form-card__summary-row">
          <span className="hs-purchase-form-card__summary-label">
            Total Purchase Cost:
          </span>
          <span className="hs-purchase-form-card__summary-value">
            {formatRupee(amount)} ({formatWeight(weight)})
          </span>
        </div>
        <div className="hs-purchase-form-card__summary-row">
          <span className="hs-purchase-form-card__summary-label">
            Cash Outflow Now:
          </span>
          <span className="hs-purchase-form-card__summary-value hs-purchase-form-card__summary-value--highlight">
            {formatRupee(effectiveCashPaid)}
          </span>
        </div>
      </div>

      {/* 7. Action Button */}
      <Button
        variant="filled"
        type="submit"
        disabled={isSaving || !isFormValid}
      >
        {isSaving ? 'Recording Purchase...' : 'Record Stock Purchase'}
      </Button>
    </form>
  );
};
