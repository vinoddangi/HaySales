import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFilterMode, setSelectedMonth } from '../../store/slices/uiSlice';

export const SHORT_MONTH_NAMES = [
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

export const useTimeline = () => {
  const dispatch = useAppDispatch();
  const { filterMode, selectedMonth, selectedYear } = useAppSelector(
    (state) => state.ui,
  );

  const isYtd = filterMode === 'ytd';

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthNum = Number(e.target.value);
    if (!isNaN(monthNum)) {
      dispatch(setSelectedMonth(monthNum));
      dispatch(setFilterMode('month'));
    }
  };

  const handleMonthButtonClick = () => {
    if (isYtd) {
      dispatch(setFilterMode('month'));
    }
  };

  const handleYtdClick = () => {
    dispatch(setFilterMode('ytd'));
  };

  return {
    filterMode,
    selectedMonth,
    selectedYear,
    isYtd,
    shortMonthNames: SHORT_MONTH_NAMES,
    handleMonthSelect,
    handleMonthButtonClick,
    handleYtdClick,
  };
};
