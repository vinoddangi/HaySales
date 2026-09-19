import { ChevronRight, Code2 } from 'lucide-react';
import React from 'react';
import { Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { APP_VERSION } from '../../../utils/version';

export interface ArchitectureInfoProps {
  onOpenOverview: () => void;
}

export const ArchitectureInfo: React.FC<ArchitectureInfoProps> = ({
  onOpenOverview,
}) => {
  return (
    <div className="space-y-2">
      <Flex align="center" gap="xs" className="px-1">
        <Code2 className="h-3.5 w-3.5 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Skeleton Architecture
        </Text>
      </Flex>

      <Card
        variant="filled"
        clickable
        onClick={onOpenOverview}
        className="flex items-center justify-between bg-m3-surface-container-high p-3.5"
      >
        <Flex align="center" gap="md">
          <img
            src="/favicon.svg"
            alt="HaySales Logo"
            className="shadow-xs h-9 w-9 shrink-0 rounded-xl"
          />
          <div className="space-y-0.5">
            <Text
              styleAs="body-sm"
              appearance="primary"
              weight="bold"
              className="block"
            >
              HaySales M3 Progressive Web App
            </Text>
            <Text styleAs="caption" appearance="secondary" className="block">
              Version {APP_VERSION} • Mobile-first PWA ready
            </Text>
          </div>
        </Flex>
        <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
      </Card>
    </div>
  );
};
