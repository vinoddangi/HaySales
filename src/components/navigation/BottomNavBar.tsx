import {
  ArrowDownLeft,
  BookOpen,
  History,
  Home,
  ShoppingBag,
} from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Text } from '../common/Text';
import { Flex } from '../layout/Flex';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

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
    icon: ArrowDownLeft,
  },
  {
    id: 'activity',
    label: 'Activity',
    path: '/activity',
    icon: History,
  },
  {
    id: 'ledger',
    label: 'Ledger',
    path: '/ledger',
    icon: BookOpen,
  },
];

export const BottomNavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="pb-safe fixed bottom-0 left-0 right-0 z-40 border-t border-m3-outline-variant/30 bg-m3-surface-container/95 backdrop-blur-lg transition-colors">
      <Flex
        align="center"
        justify="around"
        paddingHorizontal="sm"
        className="mx-auto h-16 max-w-lg"
      >
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          const IconComponent = item.icon;

          return (
            <Flex
              key={item.id}
              as="button"
              direction="column"
              align="center"
              justify="center"
              onClick={() => navigate(item.path)}
              className="group flex-1 py-1 outline-none"
            >
              {/* Active Indicator Pill */}
              <Flex
                align="center"
                justify="center"
                paddingHorizontal="lg"
                paddingVertical="xs"
                className={cn(
                  'relative rounded-m3-full transition-all duration-200',
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
              </Flex>

              {/* Label */}
              <Text
                styleAs="caption"
                appearance={isActive ? 'primary' : 'secondary'}
                weight={isActive ? 'bold' : 'medium'}
                className="mt-1"
              >
                {item.label}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </nav>
  );
};
