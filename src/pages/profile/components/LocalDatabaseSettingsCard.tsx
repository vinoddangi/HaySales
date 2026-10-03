import clsx from 'clsx';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Database,
  HardDrive,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import React from 'react';
import { Button, Card, Flex, Grid, Switch, Text } from '../../../components';
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
        <Database className="profile-section__icon" />
        <Text styleAs="label" appearance="secondary" uppercase>
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
                  <HardDrive className="h-5 w-5" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}
              </div>
              <div>
                <Flex align="center" gap="xs">
                  <span className="theme-settings__title">
                    {isLocalMode ? 'Local Database' : 'Server Database'}
                  </span>
                  <span
                    className={clsx(
                      'db-settings__mode-badge',
                      isLocalMode
                        ? 'db-settings__mode-badge--local'
                        : 'db-settings__mode-badge--server',
                    )}
                  >
                    {isLocalMode ? 'OFFLINE' : 'ONLINE'}
                  </span>
                </Flex>
                <div className="theme-settings__subtitle">
                  {isLocalMode
                    ? 'Browser IndexedDB storage'
                    : 'Live Cloud Firestore connection'}
                </div>
              </div>
            </Flex>
            <Switch selected={isLocalMode} onChange={onToggleDbMode} />
          </div>

          {/* Live Stats Header with Refresh */}
          <div className="db-settings__header-row">
            <span className="db-settings__header-title">Local Records</span>
            <button
              type="button"
              onClick={onRefreshStats}
              disabled={loadingDb}
              className="db-settings__refresh-btn"
            >
              <span>{loadingDb ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* 6-Grid Breakdown Stats */}
          <div className="db-settings__stats-grid">
            <div className="db-settings__stat-item">
              <span className="db-settings__stat-value">{stats.customers}</span>
              <span className="db-settings__stat-label">Customers</span>
            </div>
            <div className="db-settings__stat-item">
              <span className="db-settings__stat-value db-settings__stat-value--sales">
                {stats.sales}
              </span>
              <span className="db-settings__stat-label">Sales</span>
            </div>
            <div className="db-settings__stat-item">
              <span className="db-settings__stat-value db-settings__stat-value--payments">
                {stats.payments}
              </span>
              <span className="db-settings__stat-label">Payments</span>
            </div>
            <div className="db-settings__stat-item">
              <span className="db-settings__stat-value db-settings__stat-value--services">
                {stats.services}
              </span>
              <span className="db-settings__stat-label">Services</span>
            </div>
            <div className="db-settings__stat-item">
              <span className="db-settings__stat-value db-settings__stat-value--purchases">
                {stats.purchases}
              </span>
              <span className="db-settings__stat-label">Purchases</span>
            </div>
            <div className="db-settings__stat-item">
              <span className="db-settings__stat-value db-settings__stat-value--expenses">
                {stats.expenses}
              </span>
              <span className="db-settings__stat-label">Expenses</span>
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
              <span className="db-settings__pending-text">
                {pendingCount > 0
                  ? `⚡ ${pendingCount} modified record${
                      pendingCount === 1 ? '' : 's'
                    } pending publish`
                  : '✅ All changes synced with Cloud Firestore'}
              </span>
              {pendingCount > 0 && (
                <span className="db-settings__pending-badge">
                  {showPendingDetails ? 'HIDE' : 'VIEW DETAILS'}
                </span>
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
                      <span
                        className={clsx(
                          'db-settings__pending-tag',
                          isDelete
                            ? 'db-settings__pending-tag--delete'
                            : 'db-settings__pending-tag--set',
                        )}
                      >
                        {item.action}
                      </span>
                      <span className="db-settings__pending-summary">
                        {summaryText}
                        {amountText}
                      </span>
                    </Flex>
                    <span className="db-settings__pending-time">
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
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
              icon={<ArrowDownToLine className="h-4 w-4" />}
            >
              {syncingPull ? 'Syncing...' : 'Sync'}
            </Button>
            <Button
              variant="filled"
              onClick={onPublishToCloud}
              disabled={syncingCloud || syncingPull || loadingDb}
              icon={<ArrowUpRight className="h-4 w-4" />}
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
              icon={<Trash2 className="h-4 w-4" />}
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
