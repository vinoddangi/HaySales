import { AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { DatePicker } from '../../../../components/DatePicker';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { Text } from '../../../../components/Text';
import { TextField } from '../../../../components/TextField';
import { CropCategory, VALID_CROP_CATEGORIES } from '../../../../models';
import {
  formatRupee,
  formatWeight,
  getTodayDateString,
} from '../../../../utils/formatters';
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
  { value: '', label: 'Select' },
  ...VALID_CROP_CATEGORIES.map((crop) => ({ value: crop, label: crop })),
];

export const SaleFormCard: React.FC<SaleFormCardProps> = ({
  outstandingDue,
  creditLimit,
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(() => getTodayDateString());
  const [category, setCategory] = useState<CropCategory | ''>('');
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
      category: category as CropCategory,
      weight,
      amount,
      discount: discount > 0 ? discount : undefined,
      cashPaid: effectiveCashPaid,
      date,
      note: note.trim() || undefined,
    });

    // Reset form
    setCategory('');
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
      <Text
        variant="title-sm"
        weight="bold"
        className="hs-sale-form-card__section-title"
      >
        Record Crop Sale Invoice
      </Text>

      {/* 1. Date & Crop Type in 2-column Grid */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <DatePicker
            label="Sale Date"
            required
            value={date}
            onChange={(val) => setDate(val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Crop Type"
            required
            value={category}
            options={CROP_OPTIONS}
            onChange={(val) => setCategory(val as CropCategory)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Weight (Kg) and Sale Amount (₹) in 2-column Grid */}
      <Grid columns={2} gap="md" fullWidth>
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

      {/* 3. Full Cash Payment Checkbox (Row layout matching Payment Form) */}
      <Flex align="center" justify="between" fullWidth>
        <Checkbox
          label="Full Cash Payment (All Cash)"
          checked={allCash}
          onChange={(checked) => setAllCash(checked)}
        />
      </Flex>

      {/* 4. Cash Paid and Discount in 2-column Grid */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <TextField
            label="Cash Paid (₹)"
            type="number"
            placeholder="0"
            disabled={allCash}
            value={
              allCash
                ? amount > 0
                  ? String(amount)
                  : ''
                : cashPaid
                  ? String(cashPaid)
                  : ''
            }
            onChange={(val) => setCashPaid(Number(val) || 0)}
          />
        </Grid.Item>
        <Grid.Item>
          <TextField
            label="Discount (₹)"
            type="number"
            placeholder="0"
            value={discount ? String(discount) : ''}
            onChange={(val) => setDiscount(Number(val) || 0)}
          />
        </Grid.Item>
      </Grid>

      {/* 5. Remarks / Note */}
      <TextField
        label="Note / Remarks (Optional)"
        type="text"
        placeholder="e.g. Bag count, vehicle number"
        value={note}
        onChange={(val) => setNote(val)}
      />

      {/* 6. Summary Box (Styled identically to Payment Form) */}
      <div className="hs-sale-form-card__summary">
        <div className="hs-sale-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Rate:
          </Text>
          <Text variant="body-sm" weight="bold">
            {avgRate > 0 ? `${formatRupee(avgRate)} / Kg` : '—'}
          </Text>
        </div>
        <div className="hs-sale-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Total Amount:
          </Text>
          <Text variant="body-sm" weight="bold">
            {formatRupee(amount)} ({formatWeight(weight)})
          </Text>
        </div>
        <div className="hs-sale-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Cash Paid:
          </Text>
          <Text variant="body-sm" weight="bold" sentiment="positive">
            {formatRupee(effectiveCashPaid)}
          </Text>
        </div>
        {discount > 0 && (
          <div className="hs-sale-form-card__summary-row">
            <Text variant="body-sm" appearance="secondary">
              Discount:
            </Text>
            <Text variant="body-sm" weight="bold" sentiment="warning">
              -{formatRupee(discount)}
            </Text>
          </div>
        )}
        <div className="hs-sale-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Added Due:
          </Text>
          <Text variant="body-sm" weight="bold">
            {formatRupee(remainingDue)}
          </Text>
        </div>
        <div className="hs-sale-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            New Total Due:
          </Text>
          <Text
            variant="body-sm"
            weight="bold"
            sentiment={newOutstandingDue > 0 ? 'negative' : 'neutral'}
          >
            {formatRupee(newOutstandingDue)}
          </Text>
        </div>
      </div>

      {/* 7. Credit Warning */}
      {remainingDue > 0 && isOverCreditLimit && (
        <div className="hs-sale-form-card__warning-box">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <Text variant="body-sm">
            Customer balance ({formatRupee(newOutstandingDue)}) exceeds credit
            limit ({formatRupee(creditLimit)}). Credit sale permitted.
          </Text>
        </div>
      )}

      {/* 8. Submit Button */}
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

export default SaleFormCard;
