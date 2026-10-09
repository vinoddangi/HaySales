import React from 'react';
import {
  Flex,
  IconCalendar,
  IconChevronDown,
  IconTrendingUp,
  Text,
} from '../../components';
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
            <IconCalendar size="sm" />
            <Text variant="label-sm" weight="bold" as="span">
              {shortMonthNames[selectedMonth]} {selectedYear}
            </Text>
            <IconChevronDown size="sm" />
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
          <IconTrendingUp size="sm" />
          <Text variant="label-sm" weight="bold" as="span">
            YTD {selectedYear}
          </Text>
        </Flex.Item>
      </Flex>
    </div>
  );
};

export default Timeline;
