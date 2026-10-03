import React, { useEffect, useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface UseTabsOptions {
  tabs: TabItem[];
  activeTabIndex: number;
  onTabChange: (_index: number, _tabId: string) => void;
}

export const useTabs = ({
  tabs,
  activeTabIndex,
  onTabChange,
}: UseTabsOptions) => {
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

  return { ref };
};
