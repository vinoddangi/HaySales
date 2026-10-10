import React from 'react';
import {
  Button,
  Card,
  Checkbox,
  FlexLayout,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  GridLayout,
  GridItem,
  Input,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { useForm } from '../../../../hooks/useForm';
import { formatRupee, getTodayDateString } from '../../../../utils/formatters';
import './LedgerPaymentForm.css';

export interface LedgerPaymentFormProps {
  outstandingDue: number;
  isPaying: boolean;
  onPay: (
    _paymentAmount: number,
    _date?: string,
    _discount?: number,
  ) => Promise<void>;
  onDataChange?: (
    _key: 'date' | 'paymentAmount' | 'allDueClear' | 'discount',
    _value: any,
    _allValues: {
      date: string;
      paymentAmount: number;
      allDueClear: boolean;
      discount: number;
    },
  ) => void;
}

interface LedgerPaymentFormState {
  date: string;
  paymentAmount: number;
  allDueClear: boolean;
  discount: number;
}

export const LedgerPaymentForm: React.FC<LedgerPaymentFormProps> = ({
  outstandingDue,
  isPaying,
  onPay,
  onDataChange,
}) => {
  const form = useForm<LedgerPaymentFormState>({
    initialValues: {
      date: getTodayDateString(),
      paymentAmount: 0,
      allDueClear: false,
      discount: 0,
    },
    validate: (vals) => {
      const effectiveAmt = vals.allDueClear
        ? outstandingDue - vals.discount
        : vals.paymentAmount;
      const totalCleared = effectiveAmt + vals.discount;
      return totalCleared > 0 && totalCleared <= outstandingDue;
    },
    isSaving: isPaying,
    onDataChange,
    onSubmit: async (vals) => {
      const effectiveAmt = vals.allDueClear
        ? outstandingDue - vals.discount
        : vals.paymentAmount;
      await onPay(effectiveAmt, vals.date, vals.discount);
      form.reset({
        date: getTodayDateString(),
        paymentAmount: 0,
        allDueClear: false,
        discount: 0,
      });
    },
  });

  const { values, setValue, isValid } = form;
  const effectivePaymentAmount = values.allDueClear
    ? outstandingDue - values.discount
    : values.paymentAmount;
  const discountDuringPayment = values.discount;
  const totalClearedAmount = effectivePaymentAmount + discountDuringPayment;
  const newOutstandingDue = Math.max(0, outstandingDue - totalClearedAmount);

  return (
    <Card className="hs-ledger-payment-form">
      <form onSubmit={form.handleSubmit}>
        <StackLayout gap={2}>
          <Text styleAs="label">
            <b>RECORD ACCOUNT PAYMENT</b>
          </Text>

          {/* 1. Date */}
          <FormField necessity="required">
            <FormFieldLabel>Payment Date</FormFieldLabel>
            <Input
              inputProps={{
                type: 'date',
                value: values.date,
                onChange: (e) => setValue('date', e.target.value),
              }}
            />
          </FormField>

          {/* 2. Full Clear Checkbox */}
          <Checkbox
            label={`Pay Full Outstanding Due (${formatRupee(outstandingDue)})`}
            checked={values.allDueClear}
            onChange={(e) => {
              const checked = e.target.checked;
              setValue('allDueClear', checked);
              if (checked) {
                setValue('paymentAmount', outstandingDue);
              }
            }}
          />

          {/* 3. Amounts Grid */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Payment Received (₹)</FormFieldLabel>
                <Input
                  disabled={values.allDueClear}
                  inputProps={{
                    type: 'number',
                    placeholder: '0',
                    value: effectivePaymentAmount
                      ? String(effectivePaymentAmount)
                      : '',
                    onChange: (e) =>
                      setValue(
                        'paymentAmount',
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                  }}
                />
                <FormFieldHelperText>Cash paid today</FormFieldHelperText>
              </FormField>
            </GridItem>

            <GridItem>
              <FormField>
                <FormFieldLabel>Discount Waived (₹)</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'number',
                    placeholder: '0',
                    value: values.discount ? String(values.discount) : '',
                    onChange: (e) =>
                      setValue(
                        'discount',
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                  }}
                />
                <FormFieldHelperText>
                  Write-off / settlement
                </FormFieldHelperText>
              </FormField>
            </GridItem>
          </GridLayout>

          {/* 4. Summary Card */}
          <Card
            style={{
              backgroundColor: 'var(--salt-container-secondary-background)',
              padding: 'var(--salt-spacing-150)',
            }}
          >
            <StackLayout gap={1}>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Current Outstanding Due:
                </Text>
                <Text styleAs="notation">
                  <b>{formatRupee(outstandingDue)}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Payment Applied:
                </Text>
                <Text styleAs="notation" color="success">
                  <b>-{formatRupee(effectivePaymentAmount)}</b>
                </Text>
              </FlexLayout>
              {discountDuringPayment > 0 && (
                <FlexLayout justify="space-between">
                  <Text styleAs="notation" color="secondary">
                    Discount Waived:
                  </Text>
                  <Text styleAs="notation" color="warning">
                    <b>-{formatRupee(discountDuringPayment)}</b>
                  </Text>
                </FlexLayout>
              )}
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  New Balance Due:
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

          {/* 5. Submit Button */}
          <Button
            sentiment="accented"
            type="submit"
            disabled={!isValid || isPaying}
            style={{ width: '100%', height: '44px' }}
          >
            {isPaying
              ? 'Recording Payment...'
              : `Record Payment of ${formatRupee(effectivePaymentAmount)}`}
          </Button>
        </StackLayout>
      </form>
    </Card>
  );
};

export default LedgerPaymentForm;
