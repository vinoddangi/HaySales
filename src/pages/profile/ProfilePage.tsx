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
import React from 'react';
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
import { PageContainer } from '../../views';
import './ProfilePage.css';
import { useProfilePage } from './useProfilePage';

export const ProfilePage: React.FC = () => {
  const {
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
  } = useProfilePage();

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* 1. Profile Header Card */}
      <Card variant="filled">
        <Card.Header
          avatar={<Avatar name={name} size="md" />}
          title={
            <Flex align="center" gap="xs" className="profile-header__name-row">
              <h2 className="profile-header__name">{name}</h2>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="profile-header__edit-btn"
                  title="Edit Name"
                  aria-label="Edit Name"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
            </Flex>
          }
          subtitle={
            <Flex
              direction="column"
              gap="xs"
              className="profile-header__subtitle-col"
            >
              <p className="profile-header__phone">{phoneNumber}</p>
              <Flex align="center" gap="xs" className="profile-header__badge">
                <Sparkles className="h-3 w-3" />
                <span>{role}</span>
              </Flex>
            </Flex>
          }
        />

        {isEditing && (
          <Card.Content>
            <Flex
              align="center"
              gap="xs"
              wrap
              as="form"
              onSubmit={handleSaveName}
              className="profile-header__form"
            >
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
                onClick={handleCancelEditing}
              >
                Cancel
              </Button>
            </Flex>
          </Card.Content>
        )}
      </Card>

      {/* 2. Theme & Colors */}
      <Flex direction="column" gap="xs">
        <Flex align="center" gap="xs" className="profile-page__section-label">
          <Palette className="profile-page__section-icon" />
          <span>Theme &amp; Colors</span>
        </Flex>

        <Card variant="outlined">
          <Card.Content>
            {/* Dark Mode Switch Row */}
            <Flex
              align="center"
              justify="between"
              fullWidth
              className="theme-settings__mode-row"
            >
              <Flex
                align="center"
                gap="md"
                className="theme-settings__mode-left"
              >
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

                <Flex.Item grow>
                  <Flex
                    align="center"
                    gap="xs"
                    className="theme-settings__title-row"
                  >
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
                  </Flex>
                  <div className="theme-settings__subtitle">
                    {isDark
                      ? 'Dark theme active across all screens'
                      : 'Light theme active across all screens'}
                  </div>
                </Flex.Item>
              </Flex>

              <Switch selected={isDark} onChange={handleToggleDarkMode} />
            </Flex>

            {/* Dynamic Color Palette Grid */}
            <div className="theme-settings__palette-section">
              <span className="theme-settings__palette-title">
                Dynamic M3 Color Palette
              </span>
              <Grid
                columns={4}
                gap="sm"
                className="theme-settings__palette-grid"
              >
                {colorPalettes.map((pal) => (
                  <Grid.Item key={pal.key}>
                    <button
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
                  </Grid.Item>
                ))}
              </Grid>
            </div>
          </Card.Content>
        </Card>
      </Flex>

      {/* 3. Font & Text Scaling */}
      <Flex direction="column" gap="xs">
        <Flex align="center" gap="xs" className="profile-page__section-label">
          <Type className="profile-page__section-icon" />
          <span>Font &amp; Text Scaling</span>
        </Flex>

        <Card variant="outlined">
          <Card.Content>
            <Flex
              align="center"
              justify="between"
              fullWidth
              className="font-settings__top-row"
            >
              <Flex.Item grow>
                <div className="font-settings__title">Text Size Scaling</div>
                <div className="font-settings__subtitle">
                  Adjust readable text size across the entire application
                </div>
              </Flex.Item>
              <span className="font-settings__badge">
                {getFontBadgeLabel()}
              </span>
            </Flex>

            <Grid columns={4} gap="sm" className="font-settings__grid">
              {fontSizeOptions.map((opt) => {
                const isSelected = fontSize === opt.key;
                return (
                  <Grid.Item key={opt.key}>
                    <button
                      type="button"
                      onClick={() => handleSelectFontSize(opt.key)}
                      className={clsx(
                        'font-settings__option-btn',
                        isSelected && 'font-settings__option-btn--active',
                      )}
                    >
                      <span
                        className={clsx(
                          'font-settings__symbol',
                          opt.symbolClass,
                        )}
                      >
                        A
                      </span>
                      <span className="font-settings__label">{opt.label}</span>
                      <span className="font-settings__level">{opt.level}</span>
                    </button>
                  </Grid.Item>
                );
              })}
            </Grid>

            <div className="font-settings__preview">
              <span>Preview: Fast Hay Invoicing, Purchases &amp; Ledger</span>
            </div>
          </Card.Content>
        </Card>
      </Flex>

      {/* 4. Local Database & Offline Storage (Reference: create-modal) */}
      <Flex direction="column" gap="xs">
        <Flex align="center" gap="xs" className="profile-page__section-label">
          <Database className="profile-page__section-icon" />
          <span>Database &amp; Storage</span>
        </Flex>

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
              <Grid.Item>
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  className="db-settings__stat-item"
                >
                  <span className="db-settings__stat-value">124</span>
                  <span className="db-settings__stat-label">Sales</span>
                </Flex>
              </Grid.Item>
              <Grid.Item>
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  className="db-settings__stat-item"
                >
                  <span className="db-settings__stat-value">48</span>
                  <span className="db-settings__stat-label">Purchases</span>
                </Flex>
              </Grid.Item>
              <Grid.Item>
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  className="db-settings__stat-item"
                >
                  <span className="db-settings__stat-value">28</span>
                  <span className="db-settings__stat-label">Customers</span>
                </Flex>
              </Grid.Item>
            </Grid>

            <Grid columns={2} gap="sm" className="db-settings__actions-grid">
              <Button
                variant="tonal"
                onClick={handleSyncCloud}
                icon={<ArrowDownToLine className="h-4 w-4" />}
              >
                Sync
              </Button>
              <Button
                variant="tonal"
                onClick={handleLoadSnapshot}
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Load 2026
              </Button>
              <Button
                variant="filled"
                onClick={handlePublishFirestore}
                icon={<ArrowUpRight className="h-4 w-4" />}
              >
                Publish
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearLocalDB}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Clear
              </Button>
            </Grid>
          </Card.Content>
        </Card>
      </Flex>

      {/* 5. Sign Out & Version Footer */}
      <Flex
        direction="column"
        align="center"
        gap="md"
        className="profile-footer"
      >
        <Button variant="outlined" onClick={handleSignOut}>
          Sign Out
        </Button>

        <Flex
          direction="column"
          align="center"
          gap="xs"
          className="profile-footer__meta"
        >
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
        </Flex>
      </Flex>
    </PageContainer>
  );
};

export default ProfilePage;
