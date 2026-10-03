import {
  BookOpen,
  History,
  Home,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavItem } from '../navigationTypes';

export const navItems: NavItem[] = [
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

export const useBottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (path: string) => {
    return path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return {
    navItems,
    isPathActive,
    handleNavigate,
  };
};
