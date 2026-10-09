import clsx from 'clsx';
import React from 'react';
import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  IconArrowDownToLine,
  IconArrowUpRight,
  IconDatabase,
  IconHardDrive,
  IconTrash2,
  IconUploadCloud,
  Switch,
  Text,
} from '../../../components';
import { DatabaseMode } from '../../../services/dbBridge';
import { PendingChange } from '../../../services/indexedDBService';
import { LocalStats } from '../useProfilePage';

export interface LocalDatabaseSettingsCardProps {
  dbMode: DatabaseMode;
  stats: LocalStats;
  pendingCount: number;
  pendingItems: PendingChange[];
  showPendingDetails: boolean;
  loadingDb: boolean;
  syncingCloud: boolean;
  syncingPull: boolean;
  onToggleDbMode: (_isLocal: boolean) => void;
  onRefreshStats: () => Promise<void>;
  onTogglePendingDetails: () => void;
  onSyncFromCloud: () => Promise<void>;
  onPublishToCloud: () => Promise<void>;
  onClearLocalDb: () => Promise<void>;
}

export const LocalDatabaseSettingsCard: React.FC<
  LocalDatabaseSettingsCardProps
> = ({
  dbMode,
  stats,
  pendingCount,
  pendingItems,
  showPendingDetails,
  loadingDb,
  syncingCloud,
  syncingPull,
  onToggleDbMode,
  onRefreshStats,
  onTogglePendingDetails,
  onSyncFromCloud,
  onPublishToCloud,
  onClearLocalDb,
}) => {
  const isLocalMode = dbMode === 'local';

  return (
    <div className="profile-section">
      <Flex align="center" gap="xs" className="profile-section__header">
        <IconDatabase size="sm" className="profile-section__icon" />
        <Text variant="label-sm" appearance="secondary" uppercase>
          Local Database
        </Text>
      </Flex>

      <Card variant="outlined" className="db-card">
        <Card.Content>
          {/* Database Mode Switch Row */}
          <div
            className="db-settings__mode-card"
            onClick={() => onToggleDbMode(!isLocalMode)}
          >
            <Flex align="center" gap="md">
              <div
                className={clsx(
                  'db-settings__mode-icon-box',
                  isLocalMode
                    ? 'db-settings__mode-icon-box--local'
                    : 'db-settings__mode-icon-box--server',
                )}
              >
                {isLocalMode ? (
                  <IconHardDrive size="lg" />
                ) : (
                  <IconUploadCloud size="lg" />
                )}
              </div>
              <div>
                <Flex align="center" gap="xs">
                  <Text variant="title-sm" weight="bold">
                    {isLocalMode ? 'Local Database' : 'Server Database'}
                  </Text>
                  <Badge
                    sentiment={isLocalMode ? 'warning' : 'positive'}
                    size="sm"
                  >
                    {isLocalMode ? 'OFFLINE' : 'ONLINE'}
                  </Badge>
                </Flex>
                <Text variant="caption" appearance="secondary" as="div">
                  {isLocalMode
                    ? 'Browser IndexedDB storage'
                    : 'Live Cloud Firestore connection'}
                </Text>
              </div>
            </Flex>
            <Switch selected={isLocalMode} onChange={onToggleDbMode} />
          </div>

          {/* Live Stats Header with Refresh */}
          <div className="db-settings__header-row">
            <Text
              variant="label-sm"
              weight="bold"
              uppercase
              appearance="secondary"
              as="span"
            >
              Local Records
            </Text>
            <button
              type="button"
              onClick={onRefreshStats}
              disabled={loadingDb}
              className="db-settings__refresh-btn"
            >
              <Text
                variant="label-sm"
                weight="medium"
                sentiment="accent"
                as="span"
              >
                {loadingDb ? 'Refreshing...' : 'Refresh'}
              </Text>
            </button>
          </div>

          {/* 6-Grid Breakdown Stats */}
          <div className="db-settings__stats-grid">
            <div className="db-settings__stat-item">
              <Text variant="title-md" weight="bold">
                {stats.customers}
              </Text>
              <Text variant="label-sm" appearance="secondary" as="span">
                Customers
              </Text>
            </div>
            <div className="db-settings__stat-item">
              <Text variant="title-md" weight="bold" sentiment="positive">
                {stats.sales}
              </Text>
              <Text variant="label-sm" appearance="secondary" as="span">
                Sales
              </Text>
            </div>
            <div className="db-settings__stat-item">
              <Text variant="title-md" weight="bold" sentiment="positive">
                {stats.payments}
              </Text>
              <Text variant="label-sm" appearance="secondary" as="span">
                Payments
              </Text>
            </div>
            <div className="db-settings__stat-item">
              <Text variant="title-md" weight="bold" sentiment="info">
                {stats.services}
              </Text>
              <Text variant="label-sm" appearance="secondary" as="span">
                Services
              </Text>
            </div>
            <div className="db-settings__stat-item">
              <Text variant="title-md" weight="bold" sentiment="accent">
                {stats.purchases}
              </Text>
              <Text variant="label-sm" appearance="secondary" as="span">
                Purchases
              </Text>
            </div>
            <div className="db-settings__stat-item">
              <Text variant="title-md" weight="bold" sentiment="negative">
                {stats.expenses}
              </Text>
              <Text variant="label-sm" appearance="secondary" as="span">
                Expenses
              </Text>
            </div>
          </div>

          {/* Pending Sync / Delta Status Bar */}
          {isLocalMode && (
            <button
              type="button"
              onClick={onTogglePendingDetails}
              className={clsx(
                'db-settings__pending-bar',
                pendingCount > 0
                  ? 'db-settings__pending-bar--dirty'
                  : 'db-settings__pending-bar--clean',
              )}
            >
              <Text variant="body-sm" weight="medium" as="span">
                {pendingCount > 0
                  ? `⚡ ${pendingCount} modified record${
                      pendingCount === 1 ? '' : 's'
                    } pending publish`
                  : '✅ All changes synced with Cloud Firestore'}
              </Text>
              {pendingCount > 0 && (
                <Badge sentiment="neutral" size="sm">
                  {showPendingDetails ? 'HIDE' : 'VIEW DETAILS'}
                </Badge>
              )}
            </button>
          )}

          {/* Expandable Pending Delta Changes List */}
          {isLocalMode && pendingCount > 0 && showPendingDetails && (
            <div className="db-settings__pending-drawer">
              {pendingItems.map((item, idx) => {
                const d = (item.data || {}) as Record<string, any>;
                const isDelete = item.action === 'DELETE';
                const summaryText = String(
                  d.name ||
                    d.customerName ||
                    d.vendorName ||
                    d.category ||
                    item.path ||
                    '',
                );
                const amountText =
                  d.amount !== undefined
                    ? ` • ₹${Number(d.amount).toLocaleString('en-IN')}`
                    : '';

                return (
                  <div
                    key={item.id || item.path || idx}
                    className="db-settings__pending-item"
                  >
                    <Flex align="center" gap="xs">
                      <Badge
                        sentiment={isDelete ? 'negative' : 'positive'}
                        size="sm"
                      >
                        {item.action}
                      </Badge>
                      <Text variant="body-sm" weight="medium" as="span">
                        {summaryText}
                        {amountText}
                      </Text>
                    </Flex>
                    <Text variant="caption" appearance="secondary" as="span">
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons: 3 core operations */}
          <Grid columns={3} gap="sm" className="db-settings__actions-grid">
            <Button
              variant="tonal"
              onClick={onSyncFromCloud}
              disabled={syncingPull || syncingCloud || loadingDb}
              icon={<IconArrowDownToLine size="md" />}
            >
              {syncingPull ? 'Syncing...' : 'Sync'}
            </Button>
            <Button
              variant="filled"
              onClick={onPublishToCloud}
              disabled={syncingCloud || syncingPull || loadingDb}
              icon={<IconArrowUpRight size="md" />}
            >
              {syncingCloud
                ? 'Publishing...'
                : pendingCount > 0
                  ? `Publish (${pendingCount})`
                  : 'Publish'}
            </Button>
            <Button
              variant="outlined"
              onClick={onClearLocalDb}
              disabled={loadingDb || syncingCloud || syncingPull}
              icon={<IconTrash2 size="md" />}
            >
              {loadingDb ? 'Clearing...' : 'Clear'}
            </Button>
          </Grid>
        </Card.Content>
      </Card>
    </div>
  );
};

export default LocalDatabaseSettingsCard;
