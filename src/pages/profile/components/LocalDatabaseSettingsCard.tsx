import React from 'react';
import {
  Button,
  Card,
  FlexLayout,
  GridLayout,
  GridItem,
  Pill,
  StackLayout,
  Switch,
  Text,
} from '@salt-ds/core';
import { clsx } from 'clsx';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Database,
  HardDrive,
  Trash2,
  UploadCloud,
} from 'lucide-react';
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
      <FlexLayout align="center" gap={0.5} className="profile-section__header">
        <Database size={16} className="profile-section__icon" />
        <Text styleAs="label">
          <b>LOCAL DATABASE</b>
        </Text>
      </FlexLayout>

      <Card className="db-card">
        <StackLayout gap={2}>
          {/* Database Mode Switch Row */}
          <FlexLayout
            align="center"
            justify="space-between"
            className="db-settings__mode-card"
            onClick={() => onToggleDbMode(!isLocalMode)}
            style={{ cursor: 'pointer' }}
          >
            <FlexLayout align="center" gap={1}>
              <div
                className={clsx(
                  'db-settings__mode-icon-box',
                  isLocalMode
                    ? 'db-settings__mode-icon-box--local'
                    : 'db-settings__mode-icon-box--server',
                )}
              >
                {isLocalMode ? (
                  <HardDrive size={20} />
                ) : (
                  <UploadCloud size={20} />
                )}
              </div>
              <div>
                <FlexLayout align="center" gap={0.5}>
                  <Text>
                    <b>{isLocalMode ? 'Local Database' : 'Server Database'}</b>
                  </Text>
                  <Pill>{isLocalMode ? 'OFFLINE' : 'ONLINE'}</Pill>
                </FlexLayout>
                <Text styleAs="notation" color="secondary">
                  {isLocalMode
                    ? 'Browser IndexedDB storage'
                    : 'Live Cloud Firestore connection'}
                </Text>
              </div>
            </FlexLayout>
            <Switch
              checked={isLocalMode}
              onChange={(e) => onToggleDbMode(e.target.checked)}
            />
          </FlexLayout>

          {/* Live Stats Header with Refresh */}
          <FlexLayout
            justify="space-between"
            align="center"
            className="db-settings__header-row"
          >
            <Text styleAs="label">
              <b>LOCAL RECORDS</b>
            </Text>
            <button
              type="button"
              onClick={onRefreshStats}
              disabled={loadingDb}
              className="db-settings__refresh-btn"
            >
              <Text styleAs="notation">
                <b>{loadingDb ? 'Refreshing...' : 'Refresh'}</b>
              </Text>
            </button>
          </FlexLayout>

          {/* 6-Grid Breakdown Stats */}
          <GridLayout columns={3} gap={1} className="db-settings__stats-grid">
            <GridItem>
              <div className="db-settings__stat-item">
                <Text styleAs="h3">
                  <b>{stats.customers}</b>
                </Text>
                <Text styleAs="notation" color="secondary">
                  Customers
                </Text>
              </div>
            </GridItem>
            <GridItem>
              <div className="db-settings__stat-item">
                <Text styleAs="h3" color="success">
                  <b>{stats.sales}</b>
                </Text>
                <Text styleAs="notation" color="secondary">
                  Sales
                </Text>
              </div>
            </GridItem>
            <GridItem>
              <div className="db-settings__stat-item">
                <Text styleAs="h3" color="success">
                  <b>{stats.payments}</b>
                </Text>
                <Text styleAs="notation" color="secondary">
                  Payments
                </Text>
              </div>
            </GridItem>
            <GridItem>
              <div className="db-settings__stat-item">
                <Text styleAs="h3">
                  <b>{stats.services}</b>
                </Text>
                <Text styleAs="notation" color="secondary">
                  Services
                </Text>
              </div>
            </GridItem>
            <GridItem>
              <div className="db-settings__stat-item">
                <Text styleAs="h3">
                  <b>{stats.purchases}</b>
                </Text>
                <Text styleAs="notation" color="secondary">
                  Purchases
                </Text>
              </div>
            </GridItem>
            <GridItem>
              <div className="db-settings__stat-item">
                <Text styleAs="h3" color="error">
                  <b>{stats.expenses}</b>
                </Text>
                <Text styleAs="notation" color="secondary">
                  Expenses
                </Text>
              </div>
            </GridItem>
          </GridLayout>

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
              <Text styleAs="notation">
                <b>
                  {pendingCount > 0
                    ? `⚡ ${pendingCount} modified record${
                        pendingCount === 1 ? '' : 's'
                      } pending publish`
                    : '✅ All changes synced with Cloud Firestore'}
                </b>
              </Text>
              {pendingCount > 0 && (
                <Pill>{showPendingDetails ? 'HIDE' : 'VIEW DETAILS'}</Pill>
              )}
            </button>
          )}

          {/* Expandable Pending Delta Changes List */}
          {isLocalMode && pendingCount > 0 && showPendingDetails && (
            <div className="db-settings__pending-drawer">
              {pendingItems.map((item, idx) => {
                const d = (item.data || {}) as Record<string, any>;
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
                    <FlexLayout align="center" gap={0.5}>
                      <Pill>{item.action}</Pill>
                      <Text styleAs="notation">
                        <b>
                          {summaryText}
                          {amountText}
                        </b>
                      </Text>
                    </FlexLayout>
                    <Text styleAs="notation" color="secondary">
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
          <GridLayout columns={3} gap={1} className="db-settings__actions-grid">
            <GridItem>
              <Button
                onClick={onSyncFromCloud}
                disabled={syncingPull || syncingCloud || loadingDb}
                style={{ width: '100%', height: '44px' }}
              >
                <FlexLayout align="center" justify="center" gap={0.5}>
                  <ArrowDownToLine size={16} />
                  <span>{syncingPull ? 'Syncing...' : 'Sync'}</span>
                </FlexLayout>
              </Button>
            </GridItem>
            <GridItem>
              <Button
                sentiment="accented"
                onClick={onPublishToCloud}
                disabled={syncingCloud || syncingPull || loadingDb}
                style={{ width: '100%', height: '44px' }}
              >
                <FlexLayout align="center" justify="center" gap={0.5}>
                  <ArrowUpRight size={16} />
                  <span>
                    {syncingCloud
                      ? 'Publishing...'
                      : pendingCount > 0
                        ? `Publish (${pendingCount})`
                        : 'Publish'}
                  </span>
                </FlexLayout>
              </Button>
            </GridItem>
            <GridItem>
              <Button
                onClick={onClearLocalDb}
                disabled={loadingDb || syncingCloud || syncingPull}
                style={{ width: '100%', height: '44px' }}
              >
                <FlexLayout align="center" justify="center" gap={0.5}>
                  <Trash2 size={16} />
                  <span>{loadingDb ? 'Clearing...' : 'Clear'}</span>
                </FlexLayout>
              </Button>
            </GridItem>
          </GridLayout>
        </StackLayout>
      </Card>
    </div>
  );
};

export default LocalDatabaseSettingsCard;
