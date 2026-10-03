import React from 'react';
import { Button, Flex, Text } from '../../components';
import { PageContainer } from '../../views';
import {
  FontSettingsCard,
  LocalDatabaseSettingsCard,
  ProfileHeaderCard,
  ThemeSettingsCard,
} from './components';
import './ProfilePage.css';
import { useProfilePage } from './useProfilePage';

export const ProfilePage: React.FC = () => {
  const {
    name,
    phoneNumber,
    role,
    isDark,
    scheme,
    fontSize,
    dbMode,
    stats,
    pendingCount,
    pendingItems,
    showPendingDetails,
    setShowPendingDetails,
    loadingDb,
    syncingCloud,
    syncingPull,
    colorPalettes,
    fontSizeOptions,
    getFontBadgeLabel,
    handleToggleDarkMode,
    handleSelectScheme,
    handleSelectFontSize,
    handleUpdateDisplayName,
    handleSignOut,
    handleToggleDbMode,
    handleSyncFromCloud,
    handlePublishToCloud,
    handleClearLocalDb,
    loadDbStats,
  } = useProfilePage();

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* 1. Profile Header Card */}
      <ProfileHeaderCard
        name={name}
        phoneNumber={phoneNumber}
        role={role}
        onUpdateName={handleUpdateDisplayName}
      />

      {/* 2. Theme & Colors */}
      <ThemeSettingsCard
        isDark={isDark}
        scheme={scheme}
        colorPalettes={colorPalettes}
        onToggleDarkMode={handleToggleDarkMode}
        onSelectScheme={handleSelectScheme}
      />

      {/* 3. Font & Text Scaling */}
      <FontSettingsCard
        fontSize={fontSize}
        fontSizeOptions={fontSizeOptions}
        getFontBadgeLabel={getFontBadgeLabel}
        onSelectFontSize={handleSelectFontSize}
      />

      {/* 4. Local Database & Offline Storage (IndexedDB / Cloud Firestore) */}
      <LocalDatabaseSettingsCard
        dbMode={dbMode}
        stats={stats}
        pendingCount={pendingCount}
        pendingItems={pendingItems}
        showPendingDetails={showPendingDetails}
        loadingDb={loadingDb}
        syncingCloud={syncingCloud}
        syncingPull={syncingPull}
        onToggleDbMode={handleToggleDbMode}
        onRefreshStats={loadDbStats}
        onTogglePendingDetails={() =>
          setShowPendingDetails(!showPendingDetails)
        }
        onSyncFromCloud={handleSyncFromCloud}
        onPublishToCloud={handlePublishToCloud}
        onClearLocalDb={handleClearLocalDb}
      />

      {/* 5. Sign Out & Version Footer */}
      <div className="profile-footer">
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
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
