import React from 'react';
import { Avatar, Flex, IconArrowLeft, Text } from '../../components';
import { TopAppBarProps } from '../navigationTypes';
import './TopAppBar.css';
import { useTopAppBar } from './useTopAppBar';

// ── 1. Leading Component (Left side: Back button / Profile Avatar + Title) ────

export interface TopAppBarLeadingProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const TopAppBarLeading: React.FC<TopAppBarLeadingProps> = ({
  title = 'HaySales',
  showBack = false,
  onBack,
}) => {
  const { profileName, handleBack, handleProfileClick } = useTopAppBar({
    onBack,
  });

  return (
    <Flex
      direction="row"
      align="center"
      gap="sm"
      className="top-app-bar__leading"
    >
      {showBack ? (
        <button
          onClick={handleBack}
          aria-label="Go Back"
          className="top-app-bar__icon-btn"
          type="button"
        >
          <IconArrowLeft size="lg" />
        </button>
      ) : (
        <Avatar
          name={profileName}
          size="sm"
          onClick={handleProfileClick}
          title={`Profile: ${profileName}`}
          className="top-app-bar__avatar"
        />
      )}
      <Text
        variant="title-md"
        weight="bold"
        as="h1"
        className="top-app-bar__title"
      >
        {title}
      </Text>
    </Flex>
  );
};

// ── 2. Trailing Component (Right side: Year selector only) ───────────────────

export interface TopAppBarTrailingProps {
  customActions?: React.ReactNode;
}

export const TopAppBarTrailing: React.FC<TopAppBarTrailingProps> = ({
  customActions,
}) => {
  const { selectedYear, availableYears, handleYearChange } = useTopAppBar();

  if (customActions) {
    return (
      <Flex
        direction="row"
        align="center"
        gap="xs"
        className="top-app-bar__trailing"
      >
        {customActions}
      </Flex>
    );
  }

  return (
    <Flex
      direction="row"
      align="center"
      gap="xs"
      className="top-app-bar__trailing"
    >
      <Flex.Item className="top-app-bar__year-selector" title="Accounting Year">
        <Text variant="label-sm" weight="bold">
          {selectedYear}
        </Text>
        <select
          aria-label="Select Year"
          value={selectedYear}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="top-app-bar__year-select"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </Flex.Item>
    </Flex>
  );
};

// ── 3. Main TopAppBar Shell View ─────────────────────────────────────────────

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = 'HaySales',
  showBack = false,
  onBack,
  actions,
}) => {
  return (
    <header className="top-app-bar">
      <Flex
        direction="row"
        align="center"
        justify="between"
        fullWidth
        className="top-app-bar__container"
      >
        <TopAppBarLeading title={title} showBack={showBack} onBack={onBack} />
        <TopAppBarTrailing customActions={actions} />
      </Flex>
    </header>
  );
};

export default TopAppBar;
