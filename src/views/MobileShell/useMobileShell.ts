import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from '../../store/firebaseConfig';
import { useAppSelector } from '../../store/hooks';

export const useMobileShell = () => {
  const location = useLocation();
  const { previewFrame } = useAppSelector((state) => state.theme);

  // Authentication state
  const [showLogin, setShowLogin] = useState(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setShowLogin(true);
      } else {
        setShowLogin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Determine page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'HaySales Dashboard';
    if (path === '/sales') return 'New Sales Register';
    if (path === '/purchases') return 'Purchases & Expenses';
    if (path === '/ledger') return 'Customer Dues Ledger';
    if (path === '/activity') return 'Activity & Orders';
    if (path === '/customer') return 'Customer Details';
    if (path === '/profile') return 'Profile & Settings';
    if (path.startsWith('/item/')) return 'Item Details';
    return 'HaySales Mobile';
  };

  const isDetailPage =
    location.pathname.startsWith('/item/') ||
    location.pathname === '/profile' ||
    location.pathname === '/customer';

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  return {
    previewFrame,
    showLogin,
    pageTitle: getPageTitle(),
    isDetailPage,
    handleCloseLogin,
  };
};
