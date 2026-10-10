import React from 'react';
import { Text } from '@salt-ds/core';
import { Construction } from 'lucide-react';
import './PlaceholderView.css';

export interface PlaceholderViewProps {
  title: string;
  subtitle?: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  subtitle = 'This module will be built on your explicit instruction.',
}) => {
  return (
    <div className="placeholder-view">
      <Construction size={48} className="placeholder-view__icon" />
      <Text styleAs="h2" className="placeholder-view__title">
        <b>{title}</b>
      </Text>
      <Text color="secondary" className="placeholder-view__subtitle">
        {subtitle}
      </Text>
    </div>
  );
};

export default PlaceholderView;
