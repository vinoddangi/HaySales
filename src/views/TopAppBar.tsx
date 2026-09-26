import { ArrowLeft } from 'lucide-react';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useAuth } from '../store/hooks/useAuth';
import { setSelectedYear } from '../store/slices/uiSlice';
import { TopAppBarProps } from './navigationTypes';
import './TopAppBar.css';

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
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const profileName = useMemo(() => {
    if (currentUser?.displayName) return currentUser.displayName;
    try {
      const stored = localStorage.getItem('haysales_profile_name');
      if (stored) return stored;
    } catch {
      // Ignore localStorage read errors in SSR/test
    }
    return currentUser?.phoneNumber || 'Vinod Dangi';
  }, [currentUser]);

  return (
    <div className="top-app-bar__leading">
      {showBack ? (
        <button
          onClick={handleBack}
          aria-label="Go Back"
          className="top-app-bar__icon-btn"
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <Avatar
          name={profileName}
          size="sm"
          onClick={() => navigate('/profile')}
          title={`Profile: ${profileName}`}
          className="top-app-bar__avatar"
        />
      )}
      <h1 className="top-app-bar__title">{title}</h1>
    </div>
  );
};

// ── 2. Trailing Component (Right side: Year selector only) ───────────────────

export interface TopAppBarTrailingProps {
  customActions?: React.ReactNode;
}

export const TopAppBarTrailing: React.FC<TopAppBarTrailingProps> = ({
  customActions,
}) => {
  const dispatch = useAppDispatch();
  const { selectedYear } = useAppSelector((state) => state.ui);

  // Available years from 2026 to current calendar year
  const availableYears = useMemo(() => {
    const startYear = 2026;
    const currentYear = new Date().getFullYear();
    const endYear = Math.max(startYear, currentYear);
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, []);

  if (customActions) {
    return <div className="top-app-bar__trailing">{customActions}</div>;
  }

  return (
    <div className="top-app-bar__trailing">
      <div className="top-app-bar__year-selector" title="Accounting Year">
        <span>{selectedYear}</span>
        <select
          aria-label="Select Year"
          value={selectedYear}
          onChange={(e) => dispatch(setSelectedYear(Number(e.target.value)))}
          className="top-app-bar__year-select"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
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
      <div className="top-app-bar__container">
        <TopAppBarLeading title={title} showBack={showBack} onBack={onBack} />
        <TopAppBarTrailing customActions={actions} />
      </div>
    </header>
  );
};

export default TopAppBar;
