import React, { useEffect, useRef } from 'react';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import clsx from 'clsx';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

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
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleChange = (e: Event) => {
      const target = e.target as any;
      const index = target.activeTabIndex ?? 0;
      if (tabs[index]) {
        onTabChange(index, tabs[index].id);
      }
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [tabs, onTabChange]);

  useEffect(() => {
    if (ref.current && ref.current.activeTabIndex !== activeTabIndex) {
      ref.current.activeTabIndex = activeTabIndex;
    }
  }, [activeTabIndex]);

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
