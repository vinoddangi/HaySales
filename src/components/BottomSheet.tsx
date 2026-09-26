import { X } from 'lucide-react';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeBottomSheet } from '../store/slices/uiSlice';
import './BottomSheet.css';

export const BottomSheet: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bottomSheet } = useAppSelector((state) => state.ui);

  if (!bottomSheet.open) return null;

  return (
    <div
      className="bottom-sheet-backdrop"
      onClick={() => dispatch(closeBottomSheet())}
      role="dialog"
      aria-modal="true"
    >
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__header">
          <h2 className="bottom-sheet__title">
            {bottomSheet.title || 'Details'}
          </h2>
          <button
            onClick={() => dispatch(closeBottomSheet())}
            className="bottom-sheet__close-btn"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {bottomSheet.description && (
          <p className="bottom-sheet__description">{bottomSheet.description}</p>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
