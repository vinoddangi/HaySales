import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hideSnackbar, SnackbarType } from '../../store/slices/uiSlice';
import { cn } from '../../utils/cn';

export const Snackbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { snackbar } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (snackbar.isOpen) {
      const timer = setTimeout(() => {
        dispatch(hideSnackbar());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.isOpen, dispatch]);

  if (!snackbar.isOpen) return null;

  // Infer notification type if not explicitly passed
  const inferType = (): SnackbarType => {
    if (snackbar.type) return snackbar.type;
    const msg = snackbar.message.toLowerCase();
    if (
      msg.includes('error') ||
      msg.includes('fail') ||
      msg.includes('invalid') ||
      msg.includes('cannot')
    ) {
      return 'error';
    }
    if (
      msg.includes('success') ||
      msg.includes('saved') ||
      msg.includes('updated') ||
      msg.includes('recorded') ||
      msg.includes('applied') ||
      msg.includes('deleted')
    ) {
      return 'success';
    }
    if (msg.includes('warning') || msg.includes('alert')) {
      return 'warning';
    }
    return 'info';
  };

  const currentType = inferType();

  const typeConfig: Record<
    SnackbarType,
    {
      icon: React.ComponentType<{ className?: string }>;
      containerClass: string;
      iconClass: string;
    }
  > = {
    success: {
      icon: CheckCircle2,
      containerClass:
        'bg-emerald-950/95 text-emerald-50 border-emerald-500/40 shadow-emerald-950/30',
      iconClass: 'text-emerald-400',
    },
    error: {
      icon: AlertCircle,
      containerClass:
        'bg-rose-950/95 text-rose-50 border-rose-500/40 shadow-rose-950/30',
      iconClass: 'text-rose-400',
    },
    warning: {
      icon: AlertTriangle,
      containerClass:
        'bg-amber-950/95 text-amber-50 border-amber-500/40 shadow-amber-950/30',
      iconClass: 'text-amber-400',
    },
    info: {
      icon: Info,
      containerClass:
        'bg-m3-inverse-surface/95 text-m3-inverse-on-surface border-m3-outline-variant/30 shadow-black/30',
      iconClass: 'text-m3-inverse-primary',
    },
  };

  const {
    icon: IconComponent,
    containerClass,
    iconClass,
  } = typeConfig[currentType];

  return (
    <aside
      aria-label="Notifications"
      aria-live="assertive"
      className="pointer-events-none fixed left-3 right-3 top-4 z-50 flex animate-slide-down justify-center"
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all',
          containerClass,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <IconComponent className={cn('h-5 w-5 shrink-0', iconClass)} />
          <span className="truncate text-xs font-semibold sm:text-sm">
            {snackbar.message}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {snackbar.actionLabel && (
            <button
              onClick={() => dispatch(hideSnackbar())}
              className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-m3-inverse-primary transition-opacity hover:opacity-80"
            >
              {snackbar.actionLabel}
            </button>
          )}
          <button
            onClick={() => dispatch(hideSnackbar())}
            aria-label="Close notification"
            className="rounded-full p-1 text-current opacity-75 transition-opacity hover:opacity-100 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
