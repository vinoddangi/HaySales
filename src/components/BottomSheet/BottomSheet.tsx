import { X } from 'lucide-react';
import React from 'react';
import './BottomSheet.css';
import { useBottomSheet } from './useBottomSheet';

export const BottomSheet: React.FC = () => {
  const { isOpen, title, description, handleClose } = useBottomSheet();

  if (!isOpen) return null;

  return (
    <div
      className="bottom-sheet-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__header">
          <h2 className="bottom-sheet__title">{title}</h2>
          <button
            onClick={handleClose}
            className="bottom-sheet__close-btn"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && (
          <p className="bottom-sheet__description">{description}</p>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
