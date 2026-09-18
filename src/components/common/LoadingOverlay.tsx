import { Loader2 } from 'lucide-react';
import React from 'react';
import { useAppSelector } from '../../store/hooks';

export const LoadingOverlay: React.FC = () => {
  const { isLoading, loadingMessage } = useAppSelector((state) => state.ui);

  // Also detect if any RTK Query mutation is pending in customersApi
  const isMutationPending = useAppSelector((state) => {
    const mutations = (state as any).customersApi?.mutations;
    if (!mutations) return false;
    return Object.values(mutations).some(
      (mutation: any) => mutation?.status === 'pending',
    );
  });

  const showOverlay = isLoading || isMutationPending;

  if (!showOverlay) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/45 backdrop-blur-[3px] transition-all"
    >
      <div className="flex animate-scale-in flex-col items-center gap-3 rounded-2xl border border-m3-outline-variant/40 bg-m3-surface-container-high/95 p-6 shadow-2xl backdrop-blur-md">
        {/* Animated M3 Spinner */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute h-12 w-12 rounded-full border-4 border-m3-primary/20" />
          <Loader2 className="h-12 w-12 animate-spin text-m3-primary" />
        </div>

        {/* Text */}
        <div className="space-y-0.5 text-center">
          <p className="text-sm font-bold text-m3-on-surface">
            {loadingMessage || 'Processing...'}
          </p>
          <p className="text-[11px] text-m3-on-surface-variant">
            Please wait a moment
          </p>
        </div>
      </div>
    </div>
  );
};
