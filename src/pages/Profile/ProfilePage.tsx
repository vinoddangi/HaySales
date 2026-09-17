import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/common/Button';
import { PageContainer } from '../../components/common/PageContainer';
import { auth } from '../../store/firebaseConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setColorScheme, setThemeMode } from '../../store/slices/themeSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import { ColorScheme } from '../../types';
import { AppearanceSettings } from './components/AppearanceSettings';
import { ProfileHeader } from './components/ProfileHeader';
import { TransactionBackupSettings } from './components/TransactionBackupSettings';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { mode, scheme } = useAppSelector((state) => state.theme);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Force reload user token/profile from Firebase to catch any displayName updates
          await user.reload();
        } catch {
          // Ignore reload error
        }
      }
      setCurrentUser(auth.currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isDark = mode === 'dark';

  const handleToggleDarkMode = (dark: boolean) => {
    dispatch(setThemeMode(dark ? 'dark' : 'light'));
    dispatch(
      showSnackbar({
        message: `Switched to ${dark ? 'Dark' : 'Light'} Mode`,
      }),
    );
  };

  const handleSelectScheme = (newScheme: ColorScheme) => {
    dispatch(setColorScheme(newScheme));
    dispatch(showSnackbar({ message: `Applied ${newScheme} Theme` }));
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(showSnackbar({ message: 'Signed out successfully.' }));
    } catch {
      dispatch(showSnackbar({ message: 'Error signing out.' }));
    }
  };

  const handleUpdateDisplayName = async (newName: string) => {
    if (!auth.currentUser) return;
    try {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
      dispatch(showSnackbar({ message: 'Name updated successfully!' }));
    } catch (err) {
      console.error(err);
      dispatch(showSnackbar({ message: 'Failed to update name.' }));
    }
  };

  // Derive dynamic details from Firebase Auth (Mobile / Phone Auth)
  const displayName = currentUser?.displayName;
  const phoneNumber = currentUser?.phoneNumber;
  const userName = displayName || phoneNumber || 'Guest User';
  const userRole = currentUser ? 'Enterprise Manager' : 'Guest';

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* Profile Header populated dynamically from Firebase Auth with quick edit */}
      <ProfileHeader
        name={userName}
        phoneNumber={phoneNumber}
        role={userRole}
        onUpdateName={currentUser ? handleUpdateDisplayName : undefined}
      />

      {/* Material 3 Appearance & Themes */}
      <AppearanceSettings
        isDark={isDark}
        scheme={scheme}
        onToggleDarkMode={handleToggleDarkMode}
        onSelectScheme={handleSelectScheme}
      />

      {/* Financial Year Rollover & Backup */}
      <TransactionBackupSettings />

      <div className="flex justify-center pt-2">
        <Button
          variant="outlined"
          size="sm"
          onClick={handleSignOut}
          className="px-6 text-xs font-semibold"
        >
          Sign Out
        </Button>
      </div>
    </PageContainer>
  );
};
