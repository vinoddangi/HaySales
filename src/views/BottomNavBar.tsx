import clsx from 'clsx';
import {
  BookOpen,
  History,
  Home,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNavBar.css';
import { NavItem } from './navigationTypes';

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: Home,
  },
  {
    id: 'sales',
    label: 'Sales',
    path: '/sales',
    icon: ShoppingBag,
  },
  {
    id: 'purchases',
    label: 'Buy',
    path: '/purchases',
    icon: ShoppingCart,
  },
  {
    id: 'ledger',
    label: 'Ledger',
    path: '/ledger',
    icon: BookOpen,
  },
  {
    id: 'activity',
    label: 'Activity',
    path: '/activity',
    icon: History,
  },
];

export const BottomNavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav-bar">
      <div className="bottom-nav-bar__container">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
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
              <span
                className={clsx(
                  'bottom-nav-bar__label',
                  isActive
                    ? 'bottom-nav-bar__label--active'
                    : 'bottom-nav-bar__label--inactive',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
