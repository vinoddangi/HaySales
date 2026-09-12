import { Bell, Home, Layers, User } from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: Home },
  { id: 'explore', label: 'Catalog', path: '/explore', icon: Layers },
  {
    id: 'activity',
    label: 'Activity',
    path: '/activity',
    icon: Bell,
    badge: 2,
  },
  { id: 'profile', label: 'Profile', path: '/profile', icon: User },
];

export const BottomNavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="pb-safe fixed bottom-0 left-0 right-0 z-40 border-t border-m3-outline-variant/30 bg-m3-surface-container/95 backdrop-blur-lg transition-colors">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
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
              className="group flex flex-1 flex-col items-center justify-center py-1 outline-none"
            >
              {/* Active Indicator Pill */}
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-m3-full px-5 py-1 transition-all duration-200',
                  isActive
                    ? 'shadow-xs bg-m3-secondary-container text-m3-on-secondary-container'
                    : 'hover:bg-m3-on-surface/8 text-m3-on-surface-variant',
                )}
              >
                <IconComponent
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    isActive && 'scale-105 stroke-[2.5]',
                  )}
                />

                {item.badge && item.badge > 0 && (
                  <span className="py-0.2 shadow-xs absolute -top-1 right-2 rounded-full bg-m3-error px-1.5 text-[10px] font-bold text-m3-on-error">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'mt-1 text-[11px] font-medium tracking-tight transition-colors duration-150',
                  isActive
                    ? 'font-bold text-m3-on-surface'
                    : 'text-m3-on-surface-variant group-hover:text-m3-on-surface',
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
