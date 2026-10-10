import React from 'react';
import {
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  Text,
} from '@salt-ds/core';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { closeBottomSheet } from '../../../store/slices/uiSlice';

export const GlobalDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bottomSheet } = useAppSelector((state) => state.ui);

  const handleClose = () => {
    dispatch(closeBottomSheet());
  };

  return (
    <Drawer
      position="bottom"
      open={bottomSheet.open}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DrawerHeader>
        <Text styleAs="h2">
          <b>{bottomSheet.title || 'Details'}</b>
        </Text>
        <DrawerCloseButton onClick={handleClose} />
      </DrawerHeader>
      {bottomSheet.description && (
        <DrawerContent>
          <Text color="secondary">{bottomSheet.description}</Text>
        </DrawerContent>
      )}
    </Drawer>
  );
};

export default GlobalDrawer;
