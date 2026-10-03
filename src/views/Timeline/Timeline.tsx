import { Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import React from 'react';
import { Flex } from '../../components';
import { cn } from '../../utils/cn';
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
    <div className={cn('timeline', className)}>
      <Flex
        direction="row"
        align="center"
        gap="xs"
        padding="xs"
        fullWidth
        className="timeline__container"
      >
        {/* Month Dropdown Button */}
        <Flex.Item className="timeline__month-wrapper">
          <button
            type="button"
            aria-label="Select month"
            onClick={handleMonthButtonClick}
            className={cn(
              'timeline__btn',
              !isYtd ? 'timeline__btn--active' : 'timeline__btn--inactive',
            )}
          >
            <Calendar className="timeline__icon" />
            <span>
              {shortMonthNames[selectedMonth]} {selectedYear}
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
              {shortMonthNames.map((name, idx) => (
                <option key={name} value={idx}>
                  {name} {selectedYear}
                </option>
              ))}
            </select>
          )}
        </Flex.Item>

        {/* YTD Button */}
        <Flex.Item
          as="button"
          type="button"
          aria-label="Year to date"
          onClick={handleYtdClick}
          className={cn(
            'timeline__btn',
            isYtd ? 'timeline__btn--active' : 'timeline__btn--inactive',
          )}
        >
          <TrendingUp className="timeline__icon" />
          <span>YTD {selectedYear}</span>
        </Flex.Item>
      </Flex>
    </div>
  );
};

export default Timeline;
