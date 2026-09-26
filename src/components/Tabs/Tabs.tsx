import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import '@material/web/tabs/tabs.js';
import clsx from 'clsx';
import React from 'react';
import './Tabs.css';
import { TabItem, useTabs } from './useTabs';

export type { TabItem };

export interface TabsProps {
  tabs: TabItem[];
  activeTabIndex: number;
  onTabChange: (_index: number, _tabId: string) => void;
  type?: 'primary' | 'secondary';
  className?: string;
}

/**
 * React component wrapping Google Material Design 3 Tabs Web Components
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabIndex,
  onTabChange,
  type = 'primary',
  className = '',
}) => {
  const { ref } = useTabs({ tabs, activeTabIndex, onTabChange });

  const TabComponent =
    type === 'secondary' ? 'md-secondary-tab' : 'md-primary-tab';

  return (
    <md-tabs
      ref={ref}
      activeTabIndex={activeTabIndex}
      className={clsx('hs-tabs', className)}
    >
      {tabs.map((tab, idx) => (
        <TabComponent key={tab.id} active={idx === activeTabIndex}>
          {tab.icon && <span slot="icon">{tab.icon}</span>}
          {tab.label}
        </TabComponent>
      ))}
    </md-tabs>
  );
};

export default Tabs;
