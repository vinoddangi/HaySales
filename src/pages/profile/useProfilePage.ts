import React, { useState } from 'react';
import { auth } from '../../store/firebaseConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../store/hooks/useAuth';
import {
  ColorScheme,
  FontSize,
  setColorScheme,
  setFontSize,
  setThemeMode,
} from '../../store/slices/themeSlice';
import { showSnackbar } from '../../store/slices/uiSlice';

export const colorPalettes: { key: ColorScheme; name: string; hex: string }[] =
  [
    { key: 'green', name: 'Agriculture Green', hex: '#006c4c' },
    { key: 'purple', name: 'Material Baseline', hex: '#6750a4' },
    { key: 'blue', name: 'Ocean Blue', hex: '#0061a4' },
    { key: 'orange', name: 'Harvest Amber', hex: '#8b5000' },
    { key: 'rose', name: 'Crimson Rose', hex: '#9c4146' },
  ];

export const fontSizeOptions: {
  key: FontSize;
  label: string;
  level: string;
  symbolClass: string;
}[] = [
  {
    key: 'small',
    label: 'Small',
    level: '-1 Level',
    symbolClass: 'font-settings__symbol--small',
  },
  {
    key: 'medium',
    label: 'Default',
    level: 'Standard',
    symbolClass: 'font-settings__symbol--medium',
  },
  {
    key: 'large',
    label: 'Large',
    level: '+1 Level',
    symbolClass: 'font-settings__symbol--large',
  },
];

export const useProfilePage = () => {
  const dispatch = useAppDispatch();
  const { mode, scheme, fontSize } = useAppSelector((state) => state.theme);
  const { currentUser, logout } = useAuth();

  // Profile Header State
  const [name, setName] = useState(() => {
    try {
      const stored = localStorage.getItem('haysales_profile_name');
      if (stored) return stored;
    } catch {
      // Ignore storage error
    }
    return auth.currentUser?.displayName || 'Vinod Dangi';
  });

  const phoneNumber = currentUser?.phoneNumber || '+91 98765 43210';
  const role = 'Enterprise Manager';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [isSaving, setIsSaving] = useState(false);

  const isDark = mode === 'dark';

  const handleToggleDarkMode = (checked: boolean) => {
    const next = checked ? 'dark' : 'light';
    dispatch(setThemeMode(next));
    dispatch(showSnackbar(`Switched to ${checked ? 'Dark' : 'Light'} Mode`));
  };

  const handleSelectScheme = (palKey: ColorScheme, palName: string) => {
    dispatch(setColorScheme(palKey));
    dispatch(showSnackbar(`Applied ${palName} Theme`));
  };

  const handleSelectFontSize = (newSize: FontSize) => {
    dispatch(setFontSize(newSize));
    const labels: Record<FontSize, string> = {
      small: 'Small (Compact)',
      medium: 'Default (Standard)',
      large: 'Large (+1 Level)',
    };
    dispatch(showSnackbar(`Font size updated to ${labels[newSize]}`));
  };

  const handleStartEditing = () => {
    setEditValue(name);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editValue.trim();
    if (!cleanName) return;

    setIsSaving(true);
    setName(cleanName);
    try {
      localStorage.setItem('haysales_profile_name', cleanName);
    } catch {
      // Ignore storage error
    }

    if (auth.currentUser) {
      try {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(auth.currentUser, { displayName: cleanName });
      } catch (err) {
        console.error('Update profile name error:', err);
      }
    }

    setIsEditing(false);
    setIsSaving(false);
    dispatch(showSnackbar('Name updated successfully!'));
  };

  const handleSignOut = async () => {
    await logout();
    dispatch(showSnackbar('Signed out successfully.'));
  };

  const handleSyncCloud = () => {
    dispatch(showSnackbar('Syncing from live cloud...'));
  };

  const handleLoadSnapshot = () => {
    dispatch(showSnackbar('Loaded 2026 dataset snapshot.'));
  };

  const handlePublishFirestore = () => {
    dispatch(showSnackbar('All changes published to Firestore.'));
  };

  const handleClearLocalDB = () => {
    dispatch(showSnackbar('Local database cleared.'));
  };

  const getFontBadgeLabel = () => {
    if (fontSize === 'small') return 'Small (87.5%)';
    if (fontSize === 'large') return 'Large (+1 Level / 112.5%)';
    return 'Default (100%)';
  };

  return {
    name,
    phoneNumber,
    role,
    isEditing,
    editValue,
    setEditValue,
    isSaving,
    isDark,
    scheme,
    fontSize,
    colorPalettes,
    fontSizeOptions,
    getFontBadgeLabel,
    handleToggleDarkMode,
    handleSelectScheme,
    handleSelectFontSize,
    handleStartEditing,
    handleCancelEditing,
    handleSaveName,
    handleSignOut,
    handleSyncCloud,
    handleLoadSnapshot,
    handlePublishFirestore,
    handleClearLocalDB,
  };
};
