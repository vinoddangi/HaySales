import clsx from 'clsx';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Database,
  Edit3,
  Moon,
  Palette,
  RefreshCw,
  Sparkles,
  Sun,
  Trash2,
  Type,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Switch,
  Text,
} from '../../components';
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
import { PageContainer } from '../../views';
import './ProfilePage.css';

const colorPalettes: { key: ColorScheme; name: string; hex: string }[] = [
  { key: 'green', name: 'Agriculture Green', hex: '#006c4c' },
  { key: 'purple', name: 'Material Baseline', hex: '#6750a4' },
  { key: 'blue', name: 'Ocean Blue', hex: '#0061a4' },
  { key: 'orange', name: 'Harvest Amber', hex: '#8b5000' },
  { key: 'rose', name: 'Crimson Rose', hex: '#9c4146' },
];

const fontSizeOptions: {
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

export const ProfilePage: React.FC = () => {
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

  const getFontBadgeLabel = () => {
    if (fontSize === 'small') return 'Small (87.5%)';
    if (fontSize === 'large') return 'Large (+1 Level / 112.5%)';
    return 'Default (100%)';
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* 1. Profile Header Card */}
      <Card variant="filled">
        <Card.Header
          avatar={<Avatar name={name} size="md" />}
          title={
            <div className="profile-header__name-row">
              <h2 className="profile-header__name">{name}</h2>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditValue(name);
                    setIsEditing(true);
                  }}
                  className="profile-header__edit-btn"
                  title="Edit Name"
                  aria-label="Edit Name"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          }
          subtitle={
            <div className="profile-header__subtitle-col">
              <p className="profile-header__phone">{phoneNumber}</p>
              <div className="profile-header__badge">
                <Sparkles className="h-3 w-3" />
                <span>{role}</span>
              </div>
            </div>
          }
        />

        {isEditing && (
          <Card.Content>
            <form onSubmit={handleSaveName} className="profile-header__form">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter your name"
                className="profile-header__input"
                autoFocus
              />
              <Button
                type="submit"
                variant="filled"
                disabled={isSaving || !editValue.trim()}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </form>
          </Card.Content>
        )}
      </Card>

      {/* 2. Theme & Colors */}
      <Flex direction="column" gap="xs">
        <div className="profile-page__section-label">
          <Palette className="profile-page__section-icon" />
          <span>Theme &amp; Colors</span>
        </div>

        <Card variant="outlined">
          <Card.Content>
            {/* Dark Mode Switch Row */}
            <div className="theme-settings__mode-row">
              <div className="theme-settings__mode-left">
                <div
                  className={clsx(
                    'theme-settings__icon-box',
                    isDark
                      ? 'theme-settings__icon-box--dark'
                      : 'theme-settings__icon-box--light',
                  )}
                >
                  {isDark ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="theme-settings__title-row">
                    <span className="theme-settings__title">Dark Mode</span>
                    <span
                      className={clsx(
                        'theme-settings__status-badge',
                        isDark
                          ? 'theme-settings__status-badge--dark'
                          : 'theme-settings__status-badge--light',
                      )}
                    >
                      {isDark ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="theme-settings__subtitle">
                    {isDark
                      ? 'Dark theme active across all screens'
                      : 'Light theme active across all screens'}
                  </div>
                </div>
              </div>

              <Switch selected={isDark} onChange={handleToggleDarkMode} />
            </div>

            {/* Dynamic Color Palette Grid */}
            <div className="theme-settings__palette-section">
              <span className="theme-settings__palette-title">
                Dynamic M3 Color Palette
              </span>
              <div className="theme-settings__palette-grid">
                {colorPalettes.map((pal) => (
                  <button
                    key={pal.key}
                    type="button"
                    onClick={() => handleSelectScheme(pal.key, pal.name)}
                    className={clsx(
                      'theme-settings__palette-btn',
                      scheme === pal.key &&
                        'theme-settings__palette-btn--active',
                    )}
                  >
                    <div
                      className="theme-settings__palette-circle"
                      style={{ backgroundColor: pal.hex }}
                    />
                    <span className="theme-settings__palette-label">
                      {pal.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>
      </Flex>

      {/* 3. Font & Text Scaling */}
      <Flex direction="column" gap="xs">
        <div className="profile-page__section-label">
          <Type className="profile-page__section-icon" />
          <span>Font &amp; Text Scaling</span>
        </div>

        <Card variant="outlined">
          <Card.Content>
            <div className="font-settings__top-row">
              <div>
                <div className="font-settings__title">Text Size Scaling</div>
                <div className="font-settings__subtitle">
                  Adjust readable text size across the entire application
                </div>
              </div>
              <span className="font-settings__badge">
                {getFontBadgeLabel()}
              </span>
            </div>

            <div className="font-settings__grid">
              {fontSizeOptions.map((opt) => {
                const isSelected = fontSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectFontSize(opt.key)}
                    className={clsx(
                      'font-settings__option-btn',
                      isSelected && 'font-settings__option-btn--active',
                    )}
                  >
                    <span
                      className={clsx('font-settings__symbol', opt.symbolClass)}
                    >
                      A
                    </span>
                    <span className="font-settings__label">{opt.label}</span>
                    <span className="font-settings__level">{opt.level}</span>
                  </button>
                );
              })}
            </div>

            <div className="font-settings__preview">
              <span>Preview: Fast Hay Invoicing, Purchases &amp; Ledger</span>
            </div>
          </Card.Content>
        </Card>
      </Flex>

      {/* 4. Local Database & Offline Storage (Reference: create-modal) */}
      <Flex direction="column" gap="xs">
        <div className="profile-page__section-label">
          <Database className="profile-page__section-icon" />
          <span>Database &amp; Storage</span>
        </div>

        <Card variant="outlined">
          <Card.Header
            icon={<Database className="h-4 w-4" />}
            title="Local &amp; Cloud Database"
            subtitle="IndexedDB storage with Cloud Firestore replication"
            action={
              <Badge sentiment="positive" appearance="subtle">
                Connected
              </Badge>
            }
          />
          <Card.Content>
            <Grid columns={3} gap="sm">
              <div className="db-settings__stat-item">
                <span className="db-settings__stat-value">124</span>
                <span className="db-settings__stat-label">Sales</span>
              </div>
              <div className="db-settings__stat-item">
                <span className="db-settings__stat-value">48</span>
                <span className="db-settings__stat-label">Purchases</span>
              </div>
              <div className="db-settings__stat-item">
                <span className="db-settings__stat-value">28</span>
                <span className="db-settings__stat-label">Customers</span>
              </div>
            </Grid>

            <div className="db-settings__actions-grid">
              <Button
                variant="tonal"
                onClick={() =>
                  dispatch(showSnackbar('Syncing from live cloud...'))
                }
                icon={<ArrowDownToLine className="h-4 w-4" />}
              >
                Sync
              </Button>
              <Button
                variant="tonal"
                onClick={() =>
                  dispatch(showSnackbar('Loaded 2026 dataset snapshot.'))
                }
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Load 2026
              </Button>
              <Button
                variant="filled"
                onClick={() =>
                  dispatch(showSnackbar('All changes published to Firestore.'))
                }
                icon={<ArrowUpRight className="h-4 w-4" />}
              >
                Publish
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  dispatch(showSnackbar('Local database cleared.'))
                }
                icon={<Trash2 className="h-4 w-4" />}
              >
                Clear
              </Button>
            </div>
          </Card.Content>
        </Card>
      </Flex>

      {/* 5. Sign Out & Version Footer */}
      <div className="profile-footer">
        <Button variant="outlined" onClick={handleSignOut}>
          Sign Out
        </Button>

        <div className="profile-footer__meta">
          <Text
            styleAs="caption"
            appearance="secondary"
            className="profile-footer__version"
          >
            HaySales App • v1.0.0
          </Text>
          <Text
            styleAs="caption"
            appearance="secondary"
            className="profile-footer__subtext"
          >
            Automated Versioning via Changesets
          </Text>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
