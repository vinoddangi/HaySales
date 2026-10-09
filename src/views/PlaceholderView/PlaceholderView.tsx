import React from 'react';
import { IconConstruction, Text } from '../../components';
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
      <IconConstruction size="2xl" className="placeholder-view__icon" />
      <Text
        variant="title-md"
        weight="bold"
        as="h2"
        className="placeholder-view__title"
      >
        {title}
      </Text>
      <Text
        variant="body-md"
        appearance="secondary"
        as="p"
        className="placeholder-view__subtitle"
      >
        {subtitle}
      </Text>
    </div>
  );
};

export default PlaceholderView;
