import { Bell, Layers, Shield, Smartphone } from 'lucide-react';
import React from 'react';
import { Card, Switch, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';

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
      <Flex align="center" gap="xs" className="px-1">
        <Smartphone className="h-3.5 w-3.5 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Mobile App Preferences
        </Text>
      </Flex>

      <Card
        variant="outlined"
        className="divide-y divide-m3-outline-variant/30"
      >
        <Flex align="center" justify="between" fullWidth padding="md">
          <Flex align="center" gap="md">
            <Bell className="h-4 w-4 text-m3-on-surface-variant" />
            <div>
              <Text
                styleAs="body-sm"
                appearance="primary"
                weight="bold"
                className="block"
              >
                Push Alerts
              </Text>
              <Text styleAs="caption" appearance="secondary" className="block">
                Freight arrivals and moisture alerts
              </Text>
            </div>
          </Flex>
          <Switch checked={pushEnabled} onChange={onPushChange} />
        </Flex>

        <Flex align="center" justify="between" fullWidth padding="md">
          <Flex align="center" gap="md">
            <Layers className="h-4 w-4 text-m3-on-surface-variant" />
            <div>
              <Text
                styleAs="body-sm"
                appearance="primary"
                weight="bold"
                className="block"
              >
                Offline Queueing
              </Text>
              <Text styleAs="caption" appearance="secondary" className="block">
                Cache orders in offline field mode
              </Text>
            </div>
          </Flex>
          <Switch checked={offlineSync} onChange={onOfflineSyncChange} />
        </Flex>

        <Flex align="center" justify="between" fullWidth padding="md">
          <Flex align="center" gap="md">
            <Shield className="h-4 w-4 text-m3-on-surface-variant" />
            <div>
              <Text
                styleAs="body-sm"
                appearance="primary"
                weight="bold"
                className="block"
              >
                Face ID / Biometrics
              </Text>
              <Text styleAs="caption" appearance="secondary" className="block">
                Authenticate before high-volume orders
              </Text>
            </div>
          </Flex>
          <Switch checked={biometrics} onChange={onBiometricsChange} />
        </Flex>
      </Card>
    </div>
  );
};
