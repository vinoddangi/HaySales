import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../store/hooks/useAuth';
import { setSelectedYear } from '../../store/slices/uiSlice';

export interface UseTopAppBarOptions {
  onBack?: () => void;
}

export const useTopAppBar = ({ onBack }: UseTopAppBarOptions = {}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser } = useAuth();
  const { selectedYear } = useAppSelector((state) => state.ui);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleYearChange = (year: number) => {
    dispatch(setSelectedYear(year));
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

  return {
    selectedYear,
    profileName,
    availableYears,
    handleBack,
    handleProfileClick,
    handleYearChange,
  };
};
