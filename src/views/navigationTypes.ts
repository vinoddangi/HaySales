import React from 'react';
import { IconProps } from '../components/Icon';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<IconProps>;
  badge?: number;
}

export interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}
