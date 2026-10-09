import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Button } from '../../../../components/Button';
import { DatePicker } from '../../../../components/DatePicker';
import { IconAlertTriangle, IconX } from '../../../../components/Icon';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { Text } from '../../../../components/Text';
import { TextField } from '../../../../components/TextField';
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
    badgeSentiment,
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
    <div
      className="hs-activity-edit-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="hs-activity-edit-drawer">
        <div className="hs-activity-edit-drawer__handle" />

        <Flex direction="column" gap="md" fullWidth>
          {/* Header */}
          <Flex align="center" justify="between" fullWidth>
            <Flex align="center" gap="xs">
              <Text variant="title-md" weight="bold">
                Edit Transaction
              </Text>
              <Badge sentiment={badgeSentiment} size="md">
                {badgeLabel}
              </Badge>
            </Flex>
            <button
              type="button"
              aria-label="Close"
              onClick={handleClose}
              className="hs-activity-edit-drawer__close-btn"
            >
              <IconX size="md" />
            </button>
          </Flex>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="hs-activity-edit-drawer__form"
          >
            {errorMessage && (
              <div className="hs-activity-edit-drawer__error-banner">
                <Flex align="center" gap="xs">
                  <IconAlertTriangle size="sm" />
                  <Text variant="body-sm">{errorMessage}</Text>
                </Flex>
              </div>
            )}

            {/* Date & Associated Party */}
            <Grid columns={2} gap="md" fullWidth>
              <Grid.Item>
                <DatePicker
                  label="Date"
                  value={date}
                  onChange={handleDateChange}
                  required
                />
              </Grid.Item>
              <Grid.Item>
                {isSale || isService || isPayment || isOpeningDue ? (
                  <Select
                    label="Customer"
                    value={customerId}
                    options={customerOptions}
                    onChange={handleCustomerChange}
                  />
                ) : (
                  <TextField
                    label="Vendor / Payee Name"
                    value={vendorName}
                    onChange={handleVendorNameChange}
                    placeholder="Vendor / Farmer"
                  />
                )}
              </Grid.Item>
            </Grid>

            {/* Category & Weight */}
            {isCrop && (
              <Grid columns={2} gap="md" fullWidth>
                <Grid.Item>
                  <Select
                    label="Crop Category"
                    value={category}
                    options={categoryOptions}
                    onChange={handleCategoryChange}
                    required
                  />
                </Grid.Item>
                <Grid.Item>
                  <TextField
                    label="Weight (Kg)"
                    type="number"
                    value={weight || ''}
                    onChange={handleWeightChange}
                    suffixText="Kg"
                    supportingText="Weight in Kg only"
                    required
                  />
                </Grid.Item>
              </Grid>
            )}

            {isService && (
              <Select
                label="Service Category"
                value={category}
                options={categoryOptions}
                onChange={handleCategoryChange}
                required
              />
            )}

            {isExpense && (
              <Select
                label="Expense Category"
                value={category}
                options={categoryOptions}
                onChange={handleCategoryChange}
                required
              />
            )}

            {/* Financial Amounts */}
            <Grid
              columns={isPayment || isOpeningDue ? 1 : 2}
              gap="md"
              fullWidth
            >
              <Grid.Item>
                <TextField
                  label="Total Amount (₹)"
                  type="number"
                  value={amount || ''}
                  onChange={handleAmountChange}
                  prefixText="₹"
                  required
                />
              </Grid.Item>
              {!isPayment && !isOpeningDue && (
                <Grid.Item>
                  <TextField
                    label="Cash Settled (₹)"
                    type="number"
                    value={cashPaid || ''}
                    onChange={handleCashPaidChange}
                    prefixText="₹"
                  />
                </Grid.Item>
              )}
            </Grid>

            {/* Discount (if applicable) */}
            {(isSale || isPurchase || isService) && (
              <TextField
                label="Discount (₹)"
                type="number"
                value={discount || ''}
                onChange={handleDiscountChange}
                prefixText="₹"
              />
            )}

            {/* Notes */}
            <TextField
              label="Notes / Remarks"
              value={note}
              onChange={handleNoteChange}
              placeholder="Optional transaction note"
            />

            {/* Live Calculation Summary */}
            <div className="hs-activity-edit-drawer__summary-card">
              <Grid columns={isCrop ? 4 : 3} gap="sm" fullWidth>
                <Grid.Item className="hs-activity-edit-drawer__summary-item">
                  <Text variant="caption" appearance="secondary">
                    Total Amount
                  </Text>
                  <Text variant="title-sm" weight="bold" sentiment="accent">
                    {formatRupee(amount)}
                  </Text>
                </Grid.Item>

                {isCrop && weight > 0 && (
                  <Grid.Item className="hs-activity-edit-drawer__summary-item">
                    <Text variant="caption" appearance="secondary">
                      Weight
                    </Text>
                    <Text variant="title-sm" weight="bold" sentiment="neutral">
                      {formatWeight(weight)}
                    </Text>
                  </Grid.Item>
                )}

                {!isPayment && !isOpeningDue && (
                  <>
                    <Grid.Item className="hs-activity-edit-drawer__summary-item">
                      <Text variant="caption" appearance="secondary">
                        Cash Settled
                      </Text>
                      <Text
                        variant="title-sm"
                        weight="bold"
                        sentiment="positive"
                      >
                        {formatRupee(cashPaid)}
                      </Text>
                    </Grid.Item>
                    <Grid.Item className="hs-activity-edit-drawer__summary-item">
                      <Text variant="caption" appearance="secondary">
                        Remaining Due
                      </Text>
                      <Text
                        variant="title-sm"
                        weight="bold"
                        sentiment={remainingDue > 0 ? 'warning' : 'neutral'}
                      >
                        {formatRupee(remainingDue)}
                      </Text>
                    </Grid.Item>
                  </>
                )}

                {isCrop && typeof derivedRate === 'number' && (
                  <Grid.Item className="hs-activity-edit-drawer__summary-item">
                    <Text variant="caption" appearance="secondary">
                      Derived Rate
                    </Text>
                    <Text variant="title-sm" weight="bold" sentiment="accent">
                      ₹{derivedRate} / Kg
                    </Text>
                  </Grid.Item>
                )}
              </Grid>
            </div>

            {/* Form Actions */}
            <div className="hs-activity-edit-drawer__actions">
              <Button
                variant="tonal"
                fullWidth
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                fullWidth
                type="submit"
                disabled={!isValid || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Flex>
      </div>
    </div>
  );
};

export default ActivityEditDrawer;
