import React from 'react';
import { TextAppearance, TextSentiment, TextWeight } from '../Text';

export interface SummaryBoxItem {
  key?: string;
  label: React.ReactNode;
  value: React.ReactNode;
  sentiment?: TextSentiment;
  appearance?: TextAppearance;
  labelAppearance?: TextAppearance;
  valueSentiment?: TextSentiment;
  valueAppearance?: TextAppearance;
  bold?: boolean;
  weight?: TextWeight;
}

export interface UseSummaryBoxOptions {
  items?: SummaryBoxItem[];
}

export interface UseSummaryBoxReturn {
  items?: SummaryBoxItem[];
}

export function useSummaryBox(
  options: UseSummaryBoxOptions = {},
): UseSummaryBoxReturn {
  const { items } = options;
  return {
    items,
  };
}

export default useSummaryBox;
