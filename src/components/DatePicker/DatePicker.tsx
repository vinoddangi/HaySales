import '@material/web/textfield/outlined-text-field.js';
import clsx from 'clsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import React from 'react';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { Flex } from '../layouts/Flex';
import { Text } from '../Text';
import './DatePicker.css';
import { useDatePicker } from './useDatePicker';

export interface DatePickerProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  className?: string;
  onChange?: (_dateStr: string) => void;
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Material Design 3 DatePicker component adhering to official M3 specs:
 * https://m3.material.io/components/date-pickers/specs
 *
 * 1. Outlined Text Field trigger with floating label, 56px M3 height, and trailing calendar icon.
 * 2. M3 Calendar Modal Dialog with headline date, month navigation, 7-column day grid, and Cancel/OK actions.
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  label = 'Date',
  value,
  disabled = false,
  required = false,
  error = false,
  errorText,
  supportingText,
  className,
  onChange,
}) => {
  const {
    isOpen,
    monthYearLabel,
    headlineDate,
    days,
    handleOpen,
    handleClose,
    handleConfirm,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDay,
  } = useDatePicker({ value, onChange, disabled });

  // Format value for text field display (e.g. "07 Oct 2026")
  const formatDisplay = (val?: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const monthName = MONTH_NAMES_SHORT[monthIdx] || parts[1];
      return `${day} ${monthName} ${year}`;
    }
    return val;
  };

  return (
    <div className={clsx('hs-date-picker', className)}>
      {/* 1. M3 Outlined Text Field Trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={clsx(
          'hs-date-picker__trigger',
          disabled && 'hs-date-picker__trigger--disabled',
        )}
      >
        <md-outlined-text-field
          label={label}
          value={formatDisplay(value)}
          required={required || undefined}
          disabled={disabled || undefined}
          error={error || undefined}
          error-text={errorText}
          supporting-text={supportingText}
          readOnly
          className="hs-date-picker__field"
        >
          <span slot="trailing-icon" className="hs-date-picker__icon-wrapper">
            <CalendarIcon className="hs-date-picker__icon" />
          </span>
        </md-outlined-text-field>
      </div>

      {/* 2. Official M3 Date Picker Modal Dialog */}
      <Dialog
        open={isOpen}
        onClose={handleClose}
        className="hs-date-picker__dialog"
        headline={
          <div className="hs-date-picker__header">
            <Text
              variant="label-md"
              appearance="secondary"
              className="hs-date-picker__subhead"
            >
              Select date
            </Text>
            <Text
              variant="headline-md"
              weight="bold"
              className="hs-date-picker__headline"
            >
              {headlineDate}
            </Text>
          </div>
        }
        actions={
          <Flex gap="xs" justify="end" fullWidth>
            <Button variant="text" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="text" onClick={handleConfirm}>
              OK
            </Button>
          </Flex>
        }
      >
        <div className="hs-date-picker__calendar">
          {/* Month / Year Navigation */}
          <Flex
            align="center"
            justify="between"
            fullWidth
            className="hs-date-picker__controls"
          >
            <Text variant="title-sm" weight="bold">
              {monthYearLabel}
            </Text>

            <Flex gap="xs" align="center">
              <button
                type="button"
                className="hs-date-picker__nav-btn"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="hs-date-picker__nav-btn"
                onClick={handleNextMonth}
                aria-label="Next Month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </Flex>
          </Flex>

          {/* Weekday Labels (S, M, T, W, T, F, S) */}
          <div className="hs-date-picker__weekdays">
            {WEEKDAY_NAMES.map((name, i) => (
              <span key={`${name}-${i}`} className="hs-date-picker__weekday">
                <Text variant="label-sm" appearance="secondary" weight="medium">
                  {name}
                </Text>
              </span>
            ))}
          </div>

          {/* 7-column Calendar Grid */}
          <div className="hs-date-picker__calendar-grid">
            {days.map((item, idx) => (
              <button
                key={`${item.year}-${item.month}-${item.day}-${idx}`}
                type="button"
                onClick={() => handleSelectDay(item.year, item.month, item.day)}
                className={clsx(
                  'hs-date-picker__day-btn',
                  !item.isCurrentMonth &&
                    'hs-date-picker__day-btn--other-month',
                  item.isToday && 'hs-date-picker__day-btn--today',
                  item.isSelected && 'hs-date-picker__day-btn--selected',
                )}
              >
                {item.day}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DatePicker;
