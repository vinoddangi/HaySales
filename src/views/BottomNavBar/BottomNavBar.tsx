import clsx from 'clsx';
import React from 'react';
import { FlexLayout, Text } from '@salt-ds/core';
import './BottomNavBar.css';
import { useBottomNavBar } from './useBottomNavBar';

export const BottomNavBar: React.FC = () => {
  const { navItems, isPathActive, handleNavigate } = useBottomNavBar();

  return (
    <nav className="bottom-nav-bar">
      <FlexLayout
        direction="row"
        align="center"
        justify="space-around"
        className="bottom-nav-bar__container"
      >
        {navItems.map((item) => {
          const isActive = isPathActive(item.path);
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className="bottom-nav-bar__item"
              type="button"
            >
              {/* Active Indicator Pill */}
              <div
                className={clsx(
                  'bottom-nav-bar__pill',
                  isActive
                    ? 'bottom-nav-bar__pill--active'
                    : 'bottom-nav-bar__pill--inactive',
                )}
              >
                <IconComponent
                  size={22}
                  className={clsx(
                    'bottom-nav-bar__icon',
                    isActive && 'bottom-nav-bar__icon--active',
                  )}
                />

                {item.badge && item.badge > 0 && (
                  <span className="bottom-nav-bar__badge">{item.badge}</span>
                )}
              </div>

              {/* Label */}
              <Text
                styleAs="label"
                className={clsx(
                  'bottom-nav-bar__label',
                  isActive
                    ? 'bottom-nav-bar__label--active'
                    : 'bottom-nav-bar__label--inactive',
                )}
              >
                {item.label}
              </Text>
            </button>
          );
        })}
      </FlexLayout>
    </nav>
  );
};

export default BottomNavBar;
