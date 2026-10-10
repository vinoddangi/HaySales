import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  badge?: number;
}

export interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}
