import {
  Bell,
  ChevronRight,
  Code2,
  Layers,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Switch } from '../components/common/Switch';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setColorScheme, setThemeMode } from '../store/slices/themeSlice';
import { openBottomSheet, showSnackbar } from '../store/slices/uiSlice';
import { ColorScheme } from '../types';
import { cn } from '../utils/cn';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { mode, scheme } = useAppSelector((state) => state.theme);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const colorPalettes: { key: ColorScheme; name: string; bgClass: string }[] = [
    { key: 'green', name: 'Agriculture Green', bgClass: 'bg-emerald-600' },
    { key: 'purple', name: 'Material Baseline', bgClass: 'bg-purple-600' },
    { key: 'blue', name: 'Ocean Blue', bgClass: 'bg-blue-600' },
    { key: 'orange', name: 'Harvest Amber', bgClass: 'bg-amber-600' },
    { key: 'rose', name: 'Crimson Rose', bgClass: 'bg-rose-600' },
  ];

  const isDark = mode === 'dark';

  return (
    <div className="animate-fade-in space-y-4 p-4 pb-12">
      {/* Profile Header Card */}
      <Card
        variant="filled"
        className="flex items-center gap-4 bg-m3-surface-container p-4"
      >
        <div className="shadow-xs flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-m3-primary-container text-lg font-bold text-m3-on-primary-container">
          <User className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-m3-on-surface">
            Vinod Dangi
          </h2>
          <p className="truncate text-xs text-m3-on-surface-variant">
            vinod@haysales.ag
          </p>
          <div className="mt-1 inline-flex items-center gap-1 rounded bg-m3-primary/10 px-2 py-0.5 text-[10px] font-semibold text-m3-primary">
            <Sparkles className="h-3 w-3" />
            <span>Farm Enterprise Manager</span>
          </div>
        </div>
      </Card>

      {/* Material 3 Appearance Section */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
          <Palette className="h-3.5 w-3.5 text-m3-primary" />
          <span>Material 3 Appearance</span>
        </h3>

        <Card variant="outlined" className="space-y-4 p-4">
          {/* Dark Mode Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-m3-surface-container-high p-2 text-m3-on-surface">
                {isDark ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-m3-on-surface">
                  Dark Theme
                </div>
                <div className="text-[11px] text-m3-on-surface-variant">
                  {isDark ? 'Dark mode enabled' : 'Light mode active'}
                </div>
              </div>
            </div>
            <Switch
              checked={isDark}
              onChange={(val) => {
                dispatch(setThemeMode(val ? 'dark' : 'light'));
                dispatch(
                  showSnackbar({
                    message: `Switched to ${val ? 'Dark' : 'Light'} Mode`,
                  }),
                );
              }}
            />
          </div>

          <div className="border-t border-m3-outline-variant/30 pt-3">
            <span className="mb-2 block text-xs font-bold text-m3-on-surface">
              Dynamic M3 Palette Accent
            </span>
            <div className="grid grid-cols-5 gap-2">
              {colorPalettes.map((pal) => (
                <button
                  key={pal.key}
                  type="button"
                  onClick={() => {
                    dispatch(setColorScheme(pal.key));
                    dispatch(
                      showSnackbar({ message: `Applied ${pal.name} Theme` }),
                    );
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-m3-md p-1.5 transition-all',
                    scheme === pal.key
                      ? 'bg-m3-surface-container-highest ring-2 ring-m3-primary'
                      : 'opacity-75 hover:bg-m3-surface-container-high',
                  )}
                >
                  <div
                    className={cn(
                      'shadow-xs h-7 w-7 rounded-full',
                      pal.bgClass,
                    )}
                  />
                  <span className="line-clamp-1 text-center text-[9px] font-medium text-m3-on-surface">
                    {pal.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* App Preferences */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
          <Smartphone className="h-3.5 w-3.5 text-m3-primary" />
          <span>Mobile App Preferences</span>
        </h3>

        <Card
          variant="outlined"
          className="divide-y divide-m3-outline-variant/30"
        >
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-m3-on-surface-variant" />
              <div>
                <div className="text-xs font-bold text-m3-on-surface">
                  Push Alerts
                </div>
                <div className="text-[10px] text-m3-on-surface-variant">
                  Freight arrivals and moisture alerts
                </div>
              </div>
            </div>
            <Switch checked={pushEnabled} onChange={setPushEnabled} />
          </div>

          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-m3-on-surface-variant" />
              <div>
                <div className="text-xs font-bold text-m3-on-surface">
                  Offline Queueing
                </div>
                <div className="text-[10px] text-m3-on-surface-variant">
                  Cache orders in offline field mode
                </div>
              </div>
            </div>
            <Switch checked={offlineSync} onChange={setOfflineSync} />
          </div>

          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-m3-on-surface-variant" />
              <div>
                <div className="text-xs font-bold text-m3-on-surface">
                  Face ID / Biometrics
                </div>
                <div className="text-[10px] text-m3-on-surface-variant">
                  Authenticate before high-volume orders
                </div>
              </div>
            </div>
            <Switch checked={biometrics} onChange={setBiometrics} />
          </div>
        </Card>
      </div>

      {/* Tech Stack Info */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
          <Code2 className="h-3.5 w-3.5 text-m3-primary" />
          <span>Skeleton Architecture</span>
        </h3>

        <Card
          variant="filled"
          clickable
          onClick={() =>
            dispatch(
              openBottomSheet({
                title: 'Architecture Overview',
                description:
                  'Vite 6 + React 19 + Tailwind CSS + Material 3 Tokens + Redux Toolkit + React Router v7.',
              }),
            )
          }
          className="flex items-center justify-between bg-m3-surface-container-high p-3.5"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-m3-on-surface">
              React + Vite + Tailwind + M3 + RTK
            </div>
            <div className="text-[10px] text-m3-on-surface-variant">
              Version 1.0.0 • Mobile-first PWA ready
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
        </Card>
      </div>

      <div className="pt-2">
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            dispatch(showSnackbar({ message: 'Logged out successfully' }))
          }
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};
