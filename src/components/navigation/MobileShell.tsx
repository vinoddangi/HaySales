import { Monitor, Moon, Palette, Smartphone, Sun } from 'lucide-react';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setColorScheme,
  setThemeMode,
  togglePreviewFrame,
} from '../../store/slices/themeSlice';
import { ColorScheme } from '../../types';
import { cn } from '../../utils/cn';
import { BottomSheet } from '../common/BottomSheet';
import { Snackbar } from '../common/Snackbar';
import { BottomNavBar } from './BottomNavBar';
import { TopAppBar } from './TopAppBar';

export const MobileShell: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { mode, scheme, previewFrame } = useAppSelector((state) => state.theme);

  // Determine page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'HaySales Dashboard';
    if (path === '/sales') return 'New Sales Register'; // Added!
    if (path === '/ledger') return 'Customer Dues Ledger'; // Added!
    if (path === '/explore') return 'Hay & Forage Catalog';
    if (path === '/activity') return 'Activity & Orders';
    if (path === '/customer') return 'Customer Details';
    if (path === '/profile') return 'Profile & Settings';
    if (path.startsWith('/item/')) return 'Item Details';
    return 'HaySales Mobile';
  };

  const isDetailPage = location.pathname.startsWith('/item/');
  const schemes: ColorScheme[] = ['purple', 'green', 'blue', 'orange', 'rose'];

  return (
    <div className="flex min-h-screen flex-col items-center justify-start overflow-x-hidden bg-neutral-900 font-sans text-m3-on-surface">
      {/* Desktop Toolbar (Hidden on actual mobile screens) */}
      <div className="sticky top-0 z-50 hidden w-full max-w-5xl items-center justify-between border-b border-neutral-700/60 bg-neutral-800 px-4 py-2.5 text-xs text-neutral-200 shadow-md md:flex">
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-semibold tracking-wide text-white">
            React M3 Mobile Skeleton
          </span>
          <span className="rounded bg-neutral-700 px-2 py-0.5 text-[10px] text-neutral-300">
            Vite + RTK + Tailwind
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900/60 px-2.5 py-1">
            <Palette className="mr-1 h-3.5 w-3.5 text-neutral-400" />
            {schemes.map((s) => (
              <button
                key={s}
                onClick={() => dispatch(setColorScheme(s))}
                className={cn(
                  'h-4 w-4 rounded-full transition-transform',
                  s === 'purple' && 'bg-purple-600',
                  s === 'green' && 'bg-emerald-600',
                  s === 'blue' && 'bg-blue-600',
                  s === 'orange' && 'bg-amber-600',
                  s === 'rose' && 'bg-rose-600',
                  scheme === s
                    ? 'scale-110 ring-2 ring-white'
                    : 'opacity-60 hover:opacity-100',
                )}
                title={`M3 Theme: ${s}`}
              />
            ))}
          </div>

          <button
            onClick={() =>
              dispatch(setThemeMode(mode === 'dark' ? 'light' : 'dark'))
            }
            className="flex items-center gap-1.5 rounded-md bg-neutral-700 px-2.5 py-1 text-neutral-200 transition-colors hover:bg-neutral-600"
          >
            {mode === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-blue-300" />
            )}
            <span>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={() => dispatch(togglePreviewFrame())}
            className="flex items-center gap-1.5 rounded-md bg-neutral-700 px-2.5 py-1 text-neutral-200 transition-colors hover:bg-neutral-600"
          >
            {previewFrame ? (
              <Monitor className="h-3.5 w-3.5" />
            ) : (
              <Smartphone className="h-3.5 w-3.5" />
            )}
            <span>{previewFrame ? 'Full Screen' : 'Device Frame'}</span>
          </button>
        </div>
      </div>

      {/* Main Mobile App Container (Height fixed to h-screen and md:h-[860px] to prevent scroll cutoff) */}
      <div
        className={cn(
          'relative flex h-screen w-full flex-col bg-m3-surface transition-all duration-300',
          previewFrame
            ? 'md:my-6 md:h-[860px] md:max-w-[420px] md:overflow-hidden md:rounded-[44px] md:border-[8px] md:border-neutral-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'
            : 'max-w-md shadow-2xl',
        )}
      >
        {previewFrame && (
          <div className="hidden w-full items-center justify-center bg-m3-surface pb-1 pt-2 md:flex">
            <div className="flex h-4 w-24 items-center justify-center rounded-full bg-neutral-900">
              <div className="mr-2 h-3 w-3 rounded-full bg-neutral-800" />
              <div className="h-1 w-8 rounded-full bg-neutral-800" />
            </div>
          </div>
        )}

        <TopAppBar title={getPageTitle()} showBack={isDetailPage} />

        <main className="flex-1 overflow-y-auto overscroll-contain pb-20">
          <Outlet />
        </main>

        <BottomNavBar />
        <BottomSheet />
        <Snackbar />
      </div>
    </div>
  );
};
