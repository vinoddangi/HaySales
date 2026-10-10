import React from 'react';
import {
  Button,
  Drawer,
  DrawerCloseButton,
  FlexLayout,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  GridLayout,
  GridItem,
  Input,
  Pill,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { AlertTriangle } from 'lucide-react';
import { Transaction } from '../../../../models';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './ActivityEditDrawer.css';
import { useActivityEditDrawer } from './useActivityEditDrawer';

export interface ActivityEditDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    _tx: Transaction,
    _updatedData: {
      date: string;
      amount: number;
      cashPaid: number;
      remainingDue: number;
      category?: string;
      weight?: number;
      discount?: number;
      note?: string;
      customerId?: string;
      customerName?: string;
      vendorName?: string;
    },
  ) => Promise<void>;
}

export const ActivityEditDrawer: React.FC<ActivityEditDrawerProps> = (
  props,
) => {
  const {
    isOpen,
    transaction,
    isSale,
    isPurchase,
    isCrop,
    isService,
    isExpense,
    isPayment,
    isOpeningDue,
    badgeLabel,
    date,
    customerId,
    vendorName,
    category,
    weight,
    amount,
    cashPaid,
    discount,
    remainingDue,
    derivedRate,
    note,
    isSaving,
    errorMessage,
    isValid,
    categoryOptions,
    customerOptions,
    handleDateChange,
    handleCustomerChange,
    handleVendorNameChange,
    handleCategoryChange,
    handleWeightChange,
    handleAmountChange,
    handleCashPaidChange,
    handleDiscountChange,
    handleNoteChange,
    handleSubmit,
    handleClose,
  } = useActivityEditDrawer(props);

  if (!isOpen || !transaction) return null;

  return (
    <Drawer
      open={isOpen}
      position="bottom"
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      className="hs-activity-edit-drawer"
      style={{ maxHeight: '90vh' }}
    >
      <StackLayout gap={2} style={{ padding: 'var(--salt-spacing-200)' }}>
        {/* Header */}
        <FlexLayout align="center" justify="space-between">
          <FlexLayout align="center" gap={1}>
            <Text styleAs="h2">
              <b>Edit Transaction</b>
            </Text>
            <Pill>{badgeLabel}</Pill>
          </FlexLayout>
          <DrawerCloseButton onClick={handleClose} />
        </FlexLayout>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <StackLayout gap={2}>
            {errorMessage && (
              <FlexLayout
                align="center"
                gap={1}
                style={{
                  padding: 'var(--salt-spacing-100)',
                  backgroundColor:
                    'var(--salt-status-error-background, #ffebee)',
                  borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
                }}
              >
                <AlertTriangle
                  size={18}
                  color="var(--salt-status-error-foreground, #c62828)"
                />
                <Text styleAs="notation" color="error">
                  <b>{errorMessage}</b>
                </Text>
              </FlexLayout>
            )}

            {/* Date & Associated Party */}
            <GridLayout columns={2} gap={2}>
              <GridItem>
                <FormField necessity="required">
                  <FormFieldLabel>Date</FormFieldLabel>
                  <Input
                    inputProps={{
                      type: 'date',
                      value: date,
                      onChange: (e) => handleDateChange(e.target.value),
                    }}
                  />
                </FormField>
              </GridItem>
              <GridItem>
                {isSale || isService || isPayment || isOpeningDue ? (
                  <FormField>
                    <FormFieldLabel>Customer</FormFieldLabel>
                    <select
                      value={customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      style={{
                        width: '100%',
                        height: 'var(--salt-size-base, 36px)',
                        borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
                        border: '1px solid var(--salt-palette-neutral-border)',
                        backgroundColor:
                          'var(--salt-container-primary-background)',
                        color: 'var(--salt-palette-neutral-primary-foreground)',
                        padding: '0 8px',
                        fontSize: '14px',
                      }}
                    >
                      {customerOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : (
                  <FormField>
                    <FormFieldLabel>Vendor / Payee Name</FormFieldLabel>
                    <Input
                      inputProps={{
                        value: vendorName,
                        onChange: (e) => handleVendorNameChange(e.target.value),
                        placeholder: 'Vendor / Farmer',
                      }}
                    />
                  </FormField>
                )}
              </GridItem>
            </GridLayout>

            {/* Category & Weight */}
            {isCrop && (
              <GridLayout columns={2} gap={2}>
                <GridItem>
                  <FormField necessity="required">
                    <FormFieldLabel>Crop Category</FormFieldLabel>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      style={{
                        width: '100%',
                        height: 'var(--salt-size-base, 36px)',
                        borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
                        border: '1px solid var(--salt-palette-neutral-border)',
                        backgroundColor:
                          'var(--salt-container-primary-background)',
                        color: 'var(--salt-palette-neutral-primary-foreground)',
                        padding: '0 8px',
                        fontSize: '14px',
                      }}
                    >
                      {categoryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </GridItem>
                <GridItem>
                  <FormField necessity="required">
                    <FormFieldLabel>Weight (Kg)</FormFieldLabel>
                    <Input
                      inputProps={{
                        type: 'number',
                        value: weight || '',
                        onChange: (e) => handleWeightChange(e.target.value),
                      }}
                    />
                    <FormFieldHelperText>Weight in Kg only</FormFieldHelperText>
                  </FormField>
                </GridItem>
              </GridLayout>
            )}

            {isService && (
              <FormField necessity="required">
                <FormFieldLabel>Service Category</FormFieldLabel>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
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
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {isExpense && (
              <FormField necessity="required">
                <FormFieldLabel>Expense Category</FormFieldLabel>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
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
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {/* Financial Amounts */}
            <GridLayout columns={isPayment || isOpeningDue ? 1 : 2} gap={2}>
              <GridItem>
                <FormField necessity="required">
                  <FormFieldLabel>Total Amount (₹)</FormFieldLabel>
                  <Input
                    inputProps={{
                      type: 'number',
                      value: amount || '',
                      onChange: (e) => handleAmountChange(e.target.value),
                    }}
                  />
                </FormField>
              </GridItem>
              {!isPayment && !isOpeningDue && (
                <GridItem>
                  <FormField>
                    <FormFieldLabel>Cash Settled (₹)</FormFieldLabel>
                    <Input
                      inputProps={{
                        type: 'number',
                        value: cashPaid || '',
                        onChange: (e) => handleCashPaidChange(e.target.value),
                      }}
                    />
                  </FormField>
                </GridItem>
              )}
            </GridLayout>

            {/* Discount (if applicable) */}
            {(isSale || isPurchase || isService) && (
              <FormField>
                <FormFieldLabel>Discount (₹)</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'number',
                    value: discount || '',
                    onChange: (e) => handleDiscountChange(e.target.value),
                  }}
                />
              </FormField>
            )}

            {/* Notes */}
            <FormField>
              <FormFieldLabel>Notes / Remarks</FormFieldLabel>
              <Input
                inputProps={{
                  value: note,
                  onChange: (e) => handleNoteChange(e.target.value),
                  placeholder: 'Optional transaction note',
                }}
              />
            </FormField>

            {/* Live Calculation Summary */}
            <div className="hs-activity-edit-drawer__summary-card">
              <GridLayout columns={isCrop ? 4 : 3} gap={1}>
                <GridItem className="hs-activity-edit-drawer__summary-item">
                  <Text styleAs="notation" color="secondary">
                    Total Amount
                  </Text>
                  <Text>
                    <b>{formatRupee(amount)}</b>
                  </Text>
                </GridItem>

                {isCrop && weight > 0 && (
                  <GridItem className="hs-activity-edit-drawer__summary-item">
                    <Text styleAs="notation" color="secondary">
                      Weight
                    </Text>
                    <Text>
                      <b>{formatWeight(weight)}</b>
                    </Text>
                  </GridItem>
                )}

                {!isPayment && !isOpeningDue && (
                  <>
                    <GridItem className="hs-activity-edit-drawer__summary-item">
                      <Text styleAs="notation" color="secondary">
                        Cash Settled
                      </Text>
                      <Text color="success">
                        <b>{formatRupee(cashPaid)}</b>
                      </Text>
                    </GridItem>
                    <GridItem className="hs-activity-edit-drawer__summary-item">
                      <Text styleAs="notation" color="secondary">
                        Remaining Due
                      </Text>
                      <Text color={remainingDue > 0 ? 'warning' : 'secondary'}>
                        <b>{formatRupee(remainingDue)}</b>
                      </Text>
                    </GridItem>
                  </>
                )}

                {isCrop && typeof derivedRate === 'number' && (
                  <GridItem className="hs-activity-edit-drawer__summary-item">
                    <Text styleAs="notation" color="secondary">
                      Derived Rate
                    </Text>
                    <Text>
                      <b>₹{derivedRate} / Kg</b>
                    </Text>
                  </GridItem>
                )}
              </GridLayout>
            </div>

            {/* Form Actions */}
            <FlexLayout gap={1}>
              <Button
                onClick={handleClose}
                disabled={isSaving}
                style={{ flex: 1, height: '44px' }}
              >
                Cancel
              </Button>
              <Button
                sentiment="accented"
                type="submit"
                disabled={!isValid || isSaving}
                style={{ flex: 1, height: '44px' }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </FlexLayout>
          </StackLayout>
        </form>
      </StackLayout>
    </Drawer>
  );
};

export default ActivityEditDrawer;
