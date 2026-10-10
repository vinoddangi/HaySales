import React from 'react';
import { FlexLayout, Text } from '@salt-ds/core';
import { clsx } from 'clsx';
import { Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import './Timeline.css';
import { SHORT_MONTH_NAMES, useTimeline } from './useTimeline';

export { SHORT_MONTH_NAMES };

export interface TimelineProps {
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ className }) => {
  const {
    selectedMonth,
    selectedYear,
    isYtd,
    shortMonthNames,
    handleMonthSelect,
    handleMonthButtonClick,
    handleYtdClick,
  } = useTimeline();

  return (
    <div className={clsx('timeline', className)}>
      <FlexLayout
        direction="row"
        align="center"
        gap={1}
        className="timeline__container"
      >
        {/* Month Dropdown Button */}
        <div className="timeline__month-wrapper">
          <button
            type="button"
            aria-label="Select month"
            onClick={handleMonthButtonClick}
            className={clsx(
              'timeline__btn',
              !isYtd ? 'timeline__btn--active' : 'timeline__btn--inactive',
            )}
          >
            <Calendar size={16} />
            <Text styleAs="label">
              <b>
                {shortMonthNames[selectedMonth]} {selectedYear}
              </b>
            </Text>
            <ChevronDown size={16} />
          </button>

          {/* Native select overlay when in month mode */}
          {!isYtd && (
            <select
              aria-label="Select month dropdown"
              value={selectedMonth}
              onChange={handleMonthSelect}
              className="timeline__select-overlay"
            >
              {shortMonthNames.map((name, idx) => (
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
          onClick={handleYtdClick}
          className={clsx(
            'timeline__btn',
            isYtd ? 'timeline__btn--active' : 'timeline__btn--inactive',
          )}
        >
          <TrendingUp size={16} />
          <Text styleAs="label">
            <b>YTD {selectedYear}</b>
          </Text>
        </button>
      </FlexLayout>
    </div>
  );
};

export default Timeline;
