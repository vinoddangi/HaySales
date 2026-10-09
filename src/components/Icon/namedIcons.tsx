import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Construction,
  CreditCard,
  Database,
  DollarSign,
  Edit3,
  FileSearch,
  FileText,
  Filter,
  HardDrive,
  History,
  Home,
  IndianRupee,
  Landmark,
  Layers,
  LayoutGrid,
  Monitor,
  Moon,
  Package,
  PackagePlus,
  Palette,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
  Truck,
  Type,
  UploadCloud,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { IconProps } from './Icon';
import { resolveIconPixelSize } from './useIcon';

export interface NamedIconProps extends Omit<IconProps, 'children'> {}

/**
 * Higher-order component to generate dedicated named M3 Icon components.
 * Directly renders Lucide SVG icons with full stroke preservation and zero Shadow DOM interference.
 */
export function createLucideIcon(
  LucideComponent: LucideIcon,
  displayName?: string,
) {
  const Component: React.FC<NamedIconProps> = ({
    size = 'md',
    sentiment,
    color,
    strokeWidth = 2,
    className,
    style,
    ...props
  }) => {
    const pixelSize = resolveIconPixelSize(size);
    const sentimentClass = sentiment ? `hs-icon--${sentiment}` : undefined;
    const resolvedClass = clsx(
      'hs-icon',
      typeof size === 'string' && `hs-icon--${size}`,
      sentimentClass,
      className,
    );

    return (
      <LucideComponent
        size={pixelSize}
        strokeWidth={strokeWidth}
        color={color}
        className={resolvedClass}
        style={{
          ...(color ? { color } : {}),
          ...style,
        }}
        {...props}
      />
    );
  };

  if (displayName) {
    Component.displayName = displayName;
  }
  return Component;
}

export const IconAlertTriangle = createLucideIcon(
  AlertTriangle,
  'IconAlertTriangle',
);
export const IconArrowDownLeft = createLucideIcon(
  ArrowDownLeft,
  'IconArrowDownLeft',
);
export const IconArrowDownToLine = createLucideIcon(
  ArrowDownToLine,
  'IconArrowDownToLine',
);
export const IconArrowLeft = createLucideIcon(ArrowLeft, 'IconArrowLeft');
export const IconArrowUpRight = createLucideIcon(
  ArrowUpRight,
  'IconArrowUpRight',
);
export const IconBanknote = createLucideIcon(Banknote, 'IconBanknote');
export const IconBookOpen = createLucideIcon(BookOpen, 'IconBookOpen');
export const IconCalendar = createLucideIcon(Calendar, 'IconCalendar');
export const IconCheckCircle2 = createLucideIcon(
  CheckCircle2,
  'IconCheckCircle2',
);
export const IconChevronDown = createLucideIcon(ChevronDown, 'IconChevronDown');
export const IconChevronLeft = createLucideIcon(ChevronLeft, 'IconChevronLeft');
export const IconChevronRight = createLucideIcon(
  ChevronRight,
  'IconChevronRight',
);
export const IconCoins = createLucideIcon(Coins, 'IconCoins');
export const IconConstruction = createLucideIcon(
  Construction,
  'IconConstruction',
);
export const IconCreditCard = createLucideIcon(CreditCard, 'IconCreditCard');
export const IconDatabase = createLucideIcon(Database, 'IconDatabase');
export const IconDollarSign = createLucideIcon(DollarSign, 'IconDollarSign');
export const IconEdit3 = createLucideIcon(Edit3, 'IconEdit3');
export const IconFileSearch = createLucideIcon(FileSearch, 'IconFileSearch');
export const IconFileText = createLucideIcon(FileText, 'IconFileText');
export const IconFilter = createLucideIcon(Filter, 'IconFilter');
export const IconHardDrive = createLucideIcon(HardDrive, 'IconHardDrive');
export const IconHistory = createLucideIcon(History, 'IconHistory');
export const IconHome = createLucideIcon(Home, 'IconHome');
export const IconIndianRupee = createLucideIcon(IndianRupee, 'IconIndianRupee');
export const IconLandmark = createLucideIcon(Landmark, 'IconLandmark');
export const IconLayers = createLucideIcon(Layers, 'IconLayers');
export const IconLayoutGrid = createLucideIcon(LayoutGrid, 'IconLayoutGrid');
export const IconMonitor = createLucideIcon(Monitor, 'IconMonitor');
export const IconMoon = createLucideIcon(Moon, 'IconMoon');
export const IconPackage = createLucideIcon(Package, 'IconPackage');
export const IconPackagePlus = createLucideIcon(PackagePlus, 'IconPackagePlus');
export const IconPalette = createLucideIcon(Palette, 'IconPalette');
export const IconPlus = createLucideIcon(Plus, 'IconPlus');
export const IconReceipt = createLucideIcon(Receipt, 'IconReceipt');
export const IconRotateCcw = createLucideIcon(RotateCcw, 'IconRotateCcw');
export const IconSearch = createLucideIcon(Search, 'IconSearch');
export const IconShieldCheck = createLucideIcon(ShieldCheck, 'IconShieldCheck');
export const IconShoppingBag = createLucideIcon(ShoppingBag, 'IconShoppingBag');
export const IconShoppingCart = createLucideIcon(
  ShoppingCart,
  'IconShoppingCart',
);
export const IconSmartphone = createLucideIcon(Smartphone, 'IconSmartphone');
export const IconSparkles = createLucideIcon(Sparkles, 'IconSparkles');
export const IconSun = createLucideIcon(Sun, 'IconSun');
export const IconTrash2 = createLucideIcon(Trash2, 'IconTrash2');
export const IconTrendingUp = createLucideIcon(TrendingUp, 'IconTrendingUp');
export const IconTruck = createLucideIcon(Truck, 'IconTruck');
export const IconType = createLucideIcon(Type, 'IconType');
export const IconUploadCloud = createLucideIcon(UploadCloud, 'IconUploadCloud');
export const IconUserCheck = createLucideIcon(UserCheck, 'IconUserCheck');
export const IconUsers = createLucideIcon(Users, 'IconUsers');
export const IconWallet = createLucideIcon(Wallet, 'IconWallet');
export const IconWrench = createLucideIcon(Wrench, 'IconWrench');
export const IconX = createLucideIcon(X, 'IconX');
