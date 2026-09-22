import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/common/Button';
import { PageContainer } from '../../components/common/PageContainer';
import { Text } from '../../components/common/Text';
import { Flex } from '../../components/layout/Flex';
import { auth } from '../../store/firebaseConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setColorScheme,
  setFontSize,
  setThemeMode,
} from '../../store/slices/themeSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import { ColorScheme, FontSize } from '../../types';
import { APP_VERSION } from '../../utils/version';
import { DataBackupRestoreSettings } from './components/DataBackupRestoreSettings';
import { FontSettings } from './components/FontSettings';
import { LocalDatabaseSettings } from './components/LocalDatabaseSettings';
import { MockEnvironmentSettings } from './components/MockEnvironmentSettings';
import { MonthlyRolloutSettings } from './components/MonthlyRolloutSettings';
import { ProfileHeader } from './components/ProfileHeader';
import { ThemeSettings } from './components/ThemeSettings';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { mode, scheme, fontSize } = useAppSelector((state) => state.theme);
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

  const handleSelectFontSize = (newSize: FontSize) => {
    dispatch(setFontSize(newSize));
    const labels: Record<FontSize, string> = {
      small: 'Small (Compact)',
      medium: 'Default (Standard)',
      large: 'Large (+1 Level)',
    };
    dispatch(
      showSnackbar({ message: `Font size updated to ${labels[newSize]}` }),
    );
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

      {/* 1. Theme & Colors */}
      <ThemeSettings
        isDark={isDark}
        scheme={scheme}
        onToggleDarkMode={handleToggleDarkMode}
        onSelectScheme={handleSelectScheme}
      />

      {/* 2. Font & Text Scaling */}
      <FontSettings
        fontSize={fontSize}
        onSelectFontSize={handleSelectFontSize}
      />

      {/* 3. Database & Offline Storage (IndexedDB / Cloud Firestore) */}
      <LocalDatabaseSettings />

      {/* 4. Mock Environment & CSV Sandbox */}
      <MockEnvironmentSettings />

      {/* 5. Database Backup & Restore (.csv & Google Drive) */}
      <DataBackupRestoreSettings />

      {/* 6. Monthly Rollout & Trading Period Accounting */}
      <MonthlyRolloutSettings />

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          variant="outlined"
          size="sm"
          onClick={handleSignOut}
          className="px-6 text-xs font-semibold"
        >
          Sign Out
        </Button>

        <Flex
          direction="column"
          align="center"
          gap="none"
          className="pt-2 text-center"
        >
          <Text variant="caption" color="muted">
            HaySales App • v{APP_VERSION}
          </Text>
          <Text
            variant="caption"
            color="muted"
            className="text-[9px] lowercase opacity-60"
          >
            Automated Versioning via Changesets
          </Text>
        </Flex>
      </div>
    </PageContainer>
  );
};
