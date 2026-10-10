import React from 'react';
import { Avatar, FlexLayout, Text } from '@salt-ds/core';
import { ArrowLeft } from 'lucide-react';
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
    <FlexLayout
      direction="row"
      align="center"
      gap={1}
      className="top-app-bar__leading"
    >
      {showBack ? (
        <button
          onClick={handleBack}
          aria-label="Go Back"
          className="top-app-bar__icon-btn"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
      ) : (
        <Avatar
          name={profileName}
          onClick={handleProfileClick}
          title={`Profile: ${profileName}`}
          className="top-app-bar__avatar"
        />
      )}
      <Text styleAs="h2" className="top-app-bar__title">
        <b>{title}</b>
      </Text>
    </FlexLayout>
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
      <FlexLayout
        direction="row"
        align="center"
        gap={1}
        className="top-app-bar__trailing"
      >
        {customActions}
      </FlexLayout>
    );
  }

  return (
    <FlexLayout
      direction="row"
      align="center"
      gap={1}
      className="top-app-bar__trailing"
    >
      <div className="top-app-bar__year-selector" title="Accounting Year">
        <Text styleAs="label">
          <b>{selectedYear}</b>
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
      </div>
    </FlexLayout>
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
      <FlexLayout
        direction="row"
        align="center"
        justify="space-between"
        className="top-app-bar__container"
      >
        <TopAppBarLeading title={title} showBack={showBack} onBack={onBack} />
        <TopAppBarTrailing customActions={actions} />
      </FlexLayout>
    </header>
  );
};

export default TopAppBar;
