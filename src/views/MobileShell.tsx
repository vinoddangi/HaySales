import clsx from 'clsx';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomSheet, Snackbar } from '../components';
import { auth } from '../store/firebaseConfig';
import { useAppSelector } from '../store/hooks';
import { BottomNavBar } from './BottomNavBar';
import { DesktopToolbar } from './DesktopToolbar';
import { LoginModal } from './LoginModal';
import './MobileShell.css';
import { TopAppBar } from './TopAppBar';

export const MobileShell: React.FC = () => {
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

  return (
    <div className="mobile-shell-wrapper">
      {/* Desktop Toolbar (Visible on md/lg screens) */}
      <DesktopToolbar />

      {/* Main Mobile App Container */}
      <div
        className={clsx(
          'mobile-shell-container',
          previewFrame && 'mobile-shell-container--framed',
        )}
      >
        {/* Mobile Device Speaker Notch Mockup (Desktop Frame only) */}
        {previewFrame && (
          <div className="mobile-shell-notch">
            <div className="mobile-shell-notch__bar">
              <div className="mobile-shell-notch__camera" />
              <div className="mobile-shell-notch__speaker" />
            </div>
          </div>
        )}

        {/* Top App Bar */}
        <TopAppBar title={getPageTitle()} showBack={isDetailPage} />

        {/* Scrollable Main Content Area */}
        <main className="mobile-shell-content">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNavBar />

        {/* Global Bottom Sheet Modal */}
        <BottomSheet />

        {/* Global Snackbar */}
        <Snackbar />

        {/* Authentication Login Modal Gate */}
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    </div>
  );
};

export default MobileShell;
