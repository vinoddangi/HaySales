import { useState } from 'react';
import { getTodayDateString, MONTH_NAMES } from '../../utils/formatters';

export interface UseDatePickerOptions {
  value?: string;
  onChange?: (_dateStr: string) => void;
  disabled?: boolean;
}

const WEEKDAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const useDatePicker = ({
  value,
  onChange,
  disabled = false,
}: UseDatePickerOptions) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse YYYY-MM-DD
  const parseDateParts = (val?: string) => {
    if (!val) {
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth(),
        day: today.getDate(),
      };
    }
    const parts = val.split('-').map(Number);
    if (
      parts.length === 3 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      !isNaN(parts[2])
    ) {
      return {
        year: parts[0],
        month: parts[1] - 1,
        day: parts[2],
      };
    }
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
    };
  };

  const initial = parseDateParts(value);
  const [viewYear, setViewYear] = useState<number>(initial.year);
  const [viewMonth, setViewMonth] = useState<number>(initial.month);
  const [selectedDate, setSelectedDate] = useState<string>(
    value || getTodayDateString(),
  );

  const handleOpen = () => {
    if (disabled) return;
    const current = parseDateParts(value);
    setViewYear(current.year);
    setViewMonth(current.month);
    setSelectedDate(value || getTodayDateString());
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onChange?.(selectedDate);
    }
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    setSelectedDate(dateStr);
    if (year !== viewYear || month !== viewMonth) {
      setViewYear(year);
      setViewMonth(month);
    }
  };

  // Generate calendar days for viewYear & viewMonth
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const days: Array<{
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }> = [];

  const todayStr = getTodayDateString();

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    });
  }

  // Next month leading days to complete full 7-day grid weeks
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    });
  }

  // Format headline according to M3 spec (e.g. "Wed, Oct 7")
  const formatHeadline = (dateStr?: string) => {
    if (!dateStr) return 'Select date';
    const parts = dateStr.split('-').map(Number);
    if (
      parts.length === 3 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      !isNaN(parts[2])
    ) {
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      const weekday = WEEKDAY_NAMES_FULL[dt.getDay()]?.slice(0, 3) || '';
      const month = MONTH_NAMES[parts[1] - 1]?.slice(0, 3) || '';
      return `${weekday}, ${month} ${parts[2]}`;
    }
    return dateStr;
  };

  return {
    isOpen,
    viewYear,
    viewMonth,
    selectedDate,
    headlineDate: formatHeadline(selectedDate),
    monthYearLabel: `${MONTH_NAMES[viewMonth]} ${viewYear}`,
    days,
    handleOpen,
    handleClose,
    handleConfirm,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDay,
  };
};
