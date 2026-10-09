import {
  IconBookOpen,
  IconHistory,
  IconHome,
  IconShoppingBag,
  IconShoppingCart,
} from '../../components/Icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavItem } from '../navigationTypes';

export const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: IconHome,
  },
  {
    id: 'sales',
    label: 'Sales',
    path: '/sales',
    icon: IconShoppingBag,
  },
  {
    id: 'purchases',
    label: 'Buy',
    path: '/purchases',
    icon: IconShoppingCart,
  },
  {
    id: 'ledger',
    label: 'Ledger',
    path: '/ledger',
    icon: IconBookOpen,
  },
  {
    id: 'activity',
    label: 'Activity',
    path: '/activity',
    icon: IconHistory,
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
