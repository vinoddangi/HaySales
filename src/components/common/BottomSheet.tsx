import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeBottomSheet } from '../../store/slices/uiSlice';
import { cn } from '../../utils/cn';

export interface BottomSheetProps {
  children?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { bottomSheet } = useAppSelector((state) => state.ui);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bottomSheet.isOpen) {
        dispatch(closeBottomSheet());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bottomSheet.isOpen, dispatch]);

  if (!bottomSheet.isOpen) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={() => dispatch(closeBottomSheet())}
      />

      {/* Sheet Container */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-t-m3-xl border-t border-m3-outline-variant/30 bg-m3-surface-container-low shadow-m3-4',
          'pb-safe z-10 flex max-h-[85vh] animate-slide-up flex-col',
        )}
      >
        {/* Drag Handle */}
        <div className="flex w-full items-center justify-center pb-2 pt-3">
          <div className="h-1 w-8 rounded-full bg-m3-outline-variant" />
        </div>

        {/* Header */}
        {(bottomSheet.title || bottomSheet.description) && (
          <div className="flex items-start justify-between border-b border-m3-outline-variant/20 px-6 pb-3 pt-1">
            <div>
              {bottomSheet.title && (
                <h3 className="text-lg font-bold text-m3-on-surface">
                  {bottomSheet.title}
                </h3>
              )}
              {bottomSheet.description && (
                <p className="mt-0.5 text-xs text-m3-on-surface-variant">
                  {bottomSheet.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dispatch(closeBottomSheet())}
              className="-mr-2 rounded-full p-1.5 text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-highest"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
};
