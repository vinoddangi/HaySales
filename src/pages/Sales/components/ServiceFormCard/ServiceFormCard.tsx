import React from 'react';
import {
  Button,
  Card,
  Checkbox,
  FlexLayout,
  FormField,
  FormFieldLabel,
  GridLayout,
  GridItem,
  Input,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { AlertTriangle } from 'lucide-react';
import { useForm } from '../../../../hooks/useForm';
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
  onDataChange?: (
    _key: keyof ServiceFormData,
    _value: any,
    _allValues: ServiceFormData,
  ) => void;
}

const SERVICE_OPTIONS = [
  { value: '', label: 'Select Service' },
  ...VALID_SERVICE_CATEGORIES.map((s) => ({ value: s, label: s })),
];

interface ServiceFormState {
  date: string;
  category: string;
  amount: number;
  discount: number;
  cashPaid: number;
  allCash: boolean;
  note: string;
}

export const ServiceFormCard: React.FC<ServiceFormCardProps> = ({
  outstandingDue,
  creditLimit,
  isSaving,
  onSubmit,
  onDataChange,
}) => {
  const form = useForm<ServiceFormState>({
    initialValues: {
      date: getTodayDateString(),
      category: '',
      amount: 0,
      discount: 0,
      cashPaid: 0,
      allCash: false,
      note: '',
    },
    validate: (vals) => Boolean(vals.category && vals.amount > 0),
    isSaving,
    onDataChange: (key, val, allVals) => {
      onDataChange?.(
        key as keyof ServiceFormData,
        val,
        allVals as unknown as ServiceFormData,
      );
    },
    onSubmit: async (vals) => {
      const effectiveCashPaid = vals.allCash ? vals.amount : vals.cashPaid;
      await onSubmit({
        category: vals.category as ServiceCategory,
        amount: vals.amount,
        discount: vals.discount > 0 ? vals.discount : undefined,
        cashPaid: effectiveCashPaid,
        date: vals.date,
        note: vals.note.trim() || undefined,
      });
      form.reset();
    },
  });

  const { values, setValue, isValid } = form;
  const effectiveCashPaid = values.allCash ? values.amount : values.cashPaid;
  const remainingDue = Math.max(
    0,
    values.amount - values.discount - effectiveCashPaid,
  );
  const newOutstandingDue = outstandingDue + remainingDue;
  const isOverCreditLimit = newOutstandingDue > creditLimit;

  return (
    <Card className="hs-service-form-card">
      <form onSubmit={form.handleSubmit}>
        <StackLayout gap={2}>
          <Text styleAs="label">
            <b>RECORD SERVICE INCOME</b>
          </Text>

          {/* 1. Date and Service Item */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Service Date</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'date',
                    value: values.date,
                    onChange: (e) => setValue('date', e.target.value),
                  }}
                />
              </FormField>
            </GridItem>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Service Type</FormFieldLabel>
                <select
                  value={values.category}
                  onChange={(e) => setValue('category', e.target.value)}
                  style={{
                    width: '100%',
                    height: 'var(--salt-size-base, 36px)',
                    borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
                    border: '1px solid var(--salt-palette-neutral-border)',
                    backgroundColor: 'var(--salt-container-primary-background)',
                    color: 'var(--salt-palette-neutral-primary-foreground)',
                    padding: '0 8px',
                    fontSize: '14px',
                  }}
                >
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </GridItem>
          </GridLayout>

          {/* 2. Amount and Discount */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Amount (₹)</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'number',
                    placeholder: '0',
                    value: values.amount ? String(values.amount) : '',
                    onChange: (e) =>
                      setValue('amount', Number(e.target.value) || 0),
                  }}
                />
              </FormField>
            </GridItem>
            <GridItem>
              <FormField>
                <FormFieldLabel>Discount (₹)</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'number',
                    placeholder: '0',
                    value: values.discount ? String(values.discount) : '',
                    onChange: (e) =>
                      setValue('discount', Number(e.target.value) || 0),
                  }}
                />
              </FormField>
            </GridItem>
          </GridLayout>

          {/* 3. Full Cash Payment Checkbox */}
          <Checkbox
            label="Full Cash Payment (All Cash)"
            checked={values.allCash}
            onChange={(e) => setValue('allCash', e.target.checked)}
          />

          {/* 4. Cash Paid (when not all cash) */}
          {!values.allCash && (
            <FormField>
              <FormFieldLabel>Cash Paid (₹)</FormFieldLabel>
              <Input
                inputProps={{
                  type: 'number',
                  placeholder: '0',
                  value: values.cashPaid ? String(values.cashPaid) : '',
                  onChange: (e) =>
                    setValue('cashPaid', Number(e.target.value) || 0),
                }}
              />
            </FormField>
          )}

          {/* 5. Remarks / Note */}
          <FormField>
            <FormFieldLabel>Remarks / Note (Optional)</FormFieldLabel>
            <Input
              inputProps={{
                placeholder: 'e.g. Village trip, threshing, driver',
                value: values.note,
                onChange: (e) => setValue('note', e.target.value),
              }}
            />
          </FormField>

          {/* 6. Summary Card */}
          <Card
            style={{
              backgroundColor: 'var(--salt-container-secondary-background)',
              padding: 'var(--salt-spacing-150)',
            }}
          >
            <StackLayout gap={1}>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Service Fee:
                </Text>
                <Text styleAs="notation">
                  <b>{formatRupee(values.amount)}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Cash Received:
                </Text>
                <Text styleAs="notation" color="success">
                  <b>{formatRupee(effectiveCashPaid)}</b>
                </Text>
              </FlexLayout>
              {values.discount > 0 && (
                <FlexLayout justify="space-between">
                  <Text styleAs="notation" color="secondary">
                    Discount:
                  </Text>
                  <Text styleAs="notation" color="warning">
                    <b>-{formatRupee(values.discount)}</b>
                  </Text>
                </FlexLayout>
              )}
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Added to Dues:
                </Text>
                <Text styleAs="notation">
                  <b>{formatRupee(remainingDue)}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  New Customer Total Due:
                </Text>
                <Text
                  styleAs="notation"
                  color={newOutstandingDue > 0 ? 'error' : 'secondary'}
                >
                  <b>{formatRupee(newOutstandingDue)}</b>
                </Text>
              </FlexLayout>
            </StackLayout>
          </Card>

          {/* 7. Credit Warning */}
          {remainingDue > 0 && isOverCreditLimit && (
            <FlexLayout
              align="center"
              gap={1}
              style={{
                padding: 'var(--salt-spacing-100)',
                backgroundColor:
                  'var(--salt-status-warning-background, #fff8e1)',
                borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
              }}
            >
              <AlertTriangle
                size={18}
                color="var(--salt-status-warning-foreground, #b78103)"
              />
              <Text styleAs="notation">
                Customer balance ({formatRupee(newOutstandingDue)}) exceeds
                credit limit ({formatRupee(creditLimit)}). Credit service
                permitted.
              </Text>
            </FlexLayout>
          )}

          {/* 8. Submit Button */}
          <Button
            sentiment="accented"
            type="submit"
            disabled={!isValid || isSaving}
            style={{ width: '100%', height: '44px' }}
          >
            {isSaving ? 'Recording Service...' : 'Record Service'}
          </Button>
        </StackLayout>
      </form>
    </Card>
  );
};

export default ServiceFormCard;
