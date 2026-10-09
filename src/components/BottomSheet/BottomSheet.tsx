import React from 'react';
import { IconX } from '../Icon';
import { Text } from '../Text';
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
          <Text
            variant="title-sm"
            weight="bold"
            as="h2"
            className="bottom-sheet__title"
          >
            {title}
          </Text>
          <button
            onClick={handleClose}
            className="bottom-sheet__close-btn"
            type="button"
            aria-label="Close"
          >
            <IconX size="lg" />
          </button>
        </div>
        {description && (
          <Text
            variant="body-md"
            appearance="secondary"
            as="p"
            className="bottom-sheet__description"
          >
            {description}
          </Text>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
