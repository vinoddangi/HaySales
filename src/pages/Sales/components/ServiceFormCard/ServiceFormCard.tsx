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
import { ServiceCategory, VALID_SERVICE_CATEGORIES } from '../../../../models';
import { formatRupee, getTodayDateString } from '../../../../utils/formatters';
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
  { value: '', label: 'Select' },
  ...VALID_SERVICE_CATEGORIES.map((s) => ({ value: s, label: s })),
];

export const ServiceFormCard: React.FC<ServiceFormCardProps> = ({
  outstandingDue,
  creditLimit,
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(() => getTodayDateString());
  const [category, setCategory] = useState<string>('');
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
    setCategory('');
    setAmount(0);
    setDiscount(0);
    setCashPaid(0);
    setAllCash(false);
    setNote('');
  };

  const isFormValid = Boolean(category && amount > 0);

  return (
    <form onSubmit={handleSubmit} className="hs-service-form-card">
      <Text
        variant="title-sm"
        weight="bold"
        className="hs-service-form-card__section-title"
      >
        Record Service Income
      </Text>

      {/* 1. Date and Service Item */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <DatePicker
            label="Service Date"
            required
            value={date}
            onChange={(val) => setDate(val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Service Type"
            required
            value={category}
            options={SERVICE_OPTIONS}
            onChange={(val) => setCategory(val)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Amount and Discount */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <TextField
            label="Amount (₹)"
            type="number"
            required
            placeholder="0"
            value={amount ? String(amount) : ''}
            onChange={(val) => setAmount(Number(val) || 0)}
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

      {/* 3. Full Cash Payment Checkbox (Row layout matching Payment Form) */}
      <Flex align="center" justify="between" fullWidth>
        <Checkbox
          label="Full Cash Payment (All Cash)"
          checked={allCash}
          onChange={(checked) => setAllCash(checked)}
        />
      </Flex>

      {/* 4. Cash Paid (when not all cash) */}
      {!allCash && (
        <TextField
          label="Cash Paid (₹)"
          type="number"
          placeholder="0"
          value={cashPaid ? String(cashPaid) : ''}
          onChange={(val) => setCashPaid(Number(val) || 0)}
        />
      )}

      {/* 5. Remarks / Note */}
      <TextField
        label="Remarks / Note (Optional)"
        type="text"
        placeholder="e.g. Village trip, threshing, driver"
        value={note}
        onChange={(val) => setNote(val)}
      />

      {/* 6. Summary Box */}
      <div className="hs-service-form-card__summary">
        <div className="hs-service-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Service Fee:
          </Text>
          <Text variant="body-sm" weight="bold">
            {formatRupee(amount)}
          </Text>
        </div>
        <div className="hs-service-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Cash Received:
          </Text>
          <Text variant="body-sm" weight="bold" sentiment="positive">
            {formatRupee(effectiveCashPaid)}
          </Text>
        </div>
        {discount > 0 && (
          <div className="hs-service-form-card__summary-row">
            <Text variant="body-sm" appearance="secondary">
              Discount:
            </Text>
            <Text variant="body-sm" weight="bold" sentiment="warning">
              -{formatRupee(discount)}
            </Text>
          </div>
        )}
        <div className="hs-service-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Added to Dues:
          </Text>
          <Text variant="body-sm" weight="bold">
            {formatRupee(remainingDue)}
          </Text>
        </div>
        <div className="hs-service-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            New Customer Total Due:
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
        <div className="hs-service-form-card__warning-box">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <Text variant="body-sm">
            Customer balance ({formatRupee(newOutstandingDue)}) exceeds credit
            limit ({formatRupee(creditLimit)}). Credit service permitted.
          </Text>
        </div>
      )}

      {/* 8. Submit Button */}
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

export default ServiceFormCard;
