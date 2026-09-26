import { Construction } from 'lucide-react';
import React from 'react';
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
      <Construction className="placeholder-view__icon" />
      <h2 className="placeholder-view__title">{title}</h2>
      <p className="placeholder-view__subtitle">{subtitle}</p>
    </div>
  );
};

export default PlaceholderView;
