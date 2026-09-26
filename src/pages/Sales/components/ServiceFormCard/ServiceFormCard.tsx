import { AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { TextField } from '../../../../components/TextField';
import { ServiceCategory, VALID_SERVICE_CATEGORIES } from '../../../../models';
import { formatRupee } from '../../../../utils/formatters';
import './ServiceFormCard.css';

export interface ServiceFormData {
  category: ServiceCategory;
  amount: number;
  discount?: number;
  cashPaid: number;
  date: string;
  note?: string;
}

export interface ServiceFormCardProps {
  outstandingDue: number;
  creditLimit: number;
  isSaving: boolean;
  onSubmit: (_data: ServiceFormData) => Promise<void>;
}

const SERVICE_OPTIONS = [
  { value: '', label: 'Select Service Type' },
  ...VALID_SERVICE_CATEGORIES.map((s) => ({ value: s, label: s })),
];

export const ServiceFormCard: React.FC<ServiceFormCardProps> = ({
  outstandingDue,
  creditLimit,
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<string>('Pickup');
  const [amount, setAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [allCash, setAllCash] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  const effectiveCashPaid = allCash ? amount : cashPaid;
  const remainingDue = Math.max(0, amount - discount - effectiveCashPaid);
  const newOutstandingDue = outstandingDue + remainingDue;
  const isOverCreditLimit = newOutstandingDue > creditLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || amount <= 0) return;

    await onSubmit({
      category: category as ServiceCategory,
      amount,
      discount: discount > 0 ? discount : undefined,
      cashPaid: effectiveCashPaid,
      date,
      note: note.trim() || undefined,
    });

    // Reset form
    setCategory('Pickup');
    setAmount(0);
    setDiscount(0);
    setCashPaid(0);
    setAllCash(false);
    setNote('');
  };

  const isFormValid = Boolean(category && amount > 0);

  return (
    <form onSubmit={handleSubmit} className="hs-service-form-card">
      <h3 className="hs-service-form-card__section-title">
        Record Service Income
      </h3>

      {/* 1. Date and Service Item */}
      <Grid columns={1} smColumns={2} gap="sm" fullWidth>
        <Grid.Item>
          <TextField
            label="Service Date"
            type="date"
            required
            value={date}
            onChange={(val) => setDate(val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Service Item"
            required
            value={category}
            options={SERVICE_OPTIONS}
            onChange={(val) => setCategory(val)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Amount and Discount */}
      <Grid columns={1} smColumns={2} gap="sm" fullWidth>
        <Grid.Item>
          <TextField
            label="Service Fee (₹)"
            type="number"
            required
            placeholder="0"
            value={amount ? String(amount) : ''}
            onChange={(val) => setAmount(Number(val) || 0)}
          />
        </Grid.Item>
        <Grid.Item>
          <TextField
            label="Discount (₹) (Optional)"
            type="number"
            placeholder="0"
            value={discount ? String(discount) : ''}
            onChange={(val) => setDiscount(Number(val) || 0)}
          />
        </Grid.Item>
      </Grid>

      {/* 3. Payment Settlement */}
      <Flex direction="column" gap="sm" fullWidth>
        <Checkbox
          label="All Cash (Paid immediately)"
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
      </Flex>

      {/* 4. Remarks / Note */}
      <TextField
        label="Remarks / Note (Optional)"
        type="text"
        placeholder="e.g. Village trip, threshing, driver"
        value={note}
        onChange={(val) => setNote(val)}
      />

      {/* 5. Summary Box */}
      <div className="hs-service-form-card__summary">
        <div className="hs-service-form-card__summary-row">
          <span className="hs-service-form-card__summary-label">
            Service Fee:
          </span>
          <span className="hs-service-form-card__summary-value">
            {formatRupee(amount)}
          </span>
        </div>
        <div className="hs-service-form-card__summary-row">
          <span className="hs-service-form-card__summary-label">
            Cash Received:
          </span>
          <span className="hs-service-form-card__summary-value text-emerald-600">
            {formatRupee(effectiveCashPaid)}
          </span>
        </div>
        <div className="hs-service-form-card__summary-row">
          <span className="hs-service-form-card__summary-label">
            Added to Dues:
          </span>
          <span className="hs-service-form-card__summary-value">
            {formatRupee(remainingDue)}
          </span>
        </div>
        <div className="hs-service-form-card__summary-row">
          <span className="hs-service-form-card__summary-label">
            New Customer Total Due:
          </span>
          <span className="hs-service-form-card__summary-value hs-service-form-card__summary-value--highlight">
            {formatRupee(newOutstandingDue)}
          </span>
        </div>
      </div>

      {/* 6. Credit Warning */}
      {remainingDue > 0 && isOverCreditLimit && (
        <div className="hs-service-form-card__warning-box">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Customer balance ({formatRupee(newOutstandingDue)}) exceeds credit
            limit ({formatRupee(creditLimit)}). Credit service permitted.
          </span>
        </div>
      )}

      {/* 7. Submit Button */}
      <Button
        variant="filled"
        type="submit"
        disabled={isSaving || !isFormValid}
      >
        {isSaving ? 'Recording Service...' : 'Record Service'}
      </Button>
    </form>
  );
};
