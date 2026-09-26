import clsx from 'clsx';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomSheet, Snackbar } from '../../components';
import { BottomNavBar } from '../BottomNavBar';
import { DesktopToolbar } from '../DesktopToolbar';
import { LoginModal } from '../LoginModal';
import { TopAppBar } from '../TopAppBar';
import './MobileShell.css';
import { useMobileShell } from './useMobileShell';

export const MobileShell: React.FC = () => {
  const { previewFrame, showLogin, pageTitle, isDetailPage, handleCloseLogin } =
    useMobileShell();

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
        <TopAppBar title={pageTitle} showBack={isDetailPage} />

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
        <LoginModal isOpen={showLogin} onClose={handleCloseLogin} />
      </div>
    </div>
  );
};

export default MobileShell;
