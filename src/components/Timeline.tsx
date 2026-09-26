import { Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setFilterMode, setSelectedMonth } from '../store/slices/uiSlice';
import { cn } from '../utils/cn';
import './Timeline.css';

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

export interface TimelineProps {
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ className }) => {
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

  return (
    <div className={cn('timeline', className)}>
      <div className="timeline__container">
        {/* Month Dropdown Button */}
        <div className="timeline__month-wrapper">
          <button
            type="button"
            aria-label="Select month"
            onClick={() => {
              if (isYtd) {
                dispatch(setFilterMode('month'));
              }
            }}
            className={cn(
              'timeline__btn',
              !isYtd ? 'timeline__btn--active' : 'timeline__btn--inactive',
            )}
          >
            <Calendar className="timeline__icon" />
            <span>
              {SHORT_MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <ChevronDown className="timeline__chevron" />
          </button>

          {/* Native select overlay when in month mode */}
          {!isYtd && (
            <select
              aria-label="Select month dropdown"
              value={selectedMonth}
              onChange={handleMonthSelect}
              className="timeline__select-overlay"
            >
              {SHORT_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name} {selectedYear}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* YTD Button */}
        <button
          type="button"
          aria-label="Year to date"
          onClick={() => dispatch(setFilterMode('ytd'))}
          className={cn(
            'timeline__btn',
            isYtd ? 'timeline__btn--active' : 'timeline__btn--inactive',
          )}
        >
          <TrendingUp className="timeline__icon" />
          <span>YTD {selectedYear}</span>
        </button>
      </div>
    </div>
  );
};

export default Timeline;
