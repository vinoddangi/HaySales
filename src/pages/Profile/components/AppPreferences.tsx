import { Bell, Layers, Shield, Smartphone } from 'lucide-react';
import React from 'react';
import { Card } from '../../../components/common/Card';
import { Switch } from '../../../components/common/Switch';

export interface AppPreferencesProps {
  pushEnabled: boolean;
  offlineSync: boolean;
  biometrics: boolean;
  onPushChange: (_enabled: boolean) => void;
  onOfflineSyncChange: (_enabled: boolean) => void;
  onBiometricsChange: (_enabled: boolean) => void;
}

export const AppPreferences: React.FC<AppPreferencesProps> = ({
  pushEnabled,
  offlineSync,
  biometrics,
  onPushChange,
  onOfflineSyncChange,
  onBiometricsChange,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
        <Smartphone className="h-3.5 w-3.5 text-m3-primary" />
        <span>Mobile App Preferences</span>
      </h3>

      <Card
        variant="outlined"
        className="divide-y divide-m3-outline-variant/30"
      >
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-m3-on-surface-variant" />
            <div>
              <div className="text-xs font-bold text-m3-on-surface">
                Push Alerts
              </div>
              <div className="text-[10px] text-m3-on-surface-variant">
                Freight arrivals and moisture alerts
              </div>
            </div>
          </div>
          <Switch checked={pushEnabled} onChange={onPushChange} />
        </div>

        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            <Layers className="h-4 w-4 text-m3-on-surface-variant" />
            <div>
              <div className="text-xs font-bold text-m3-on-surface">
                Offline Queueing
              </div>
              <div className="text-[10px] text-m3-on-surface-variant">
                Cache orders in offline field mode
              </div>
            </div>
          </div>
          <Switch checked={offlineSync} onChange={onOfflineSyncChange} />
        </div>

        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-m3-on-surface-variant" />
            <div>
              <div className="text-xs font-bold text-m3-on-surface">
                Face ID / Biometrics
              </div>
              <div className="text-[10px] text-m3-on-surface-variant">
                Authenticate before high-volume orders
              </div>
            </div>
          </div>
          <Switch checked={biometrics} onChange={onBiometricsChange} />
        </div>
      </Card>
    </div>
  );
};
