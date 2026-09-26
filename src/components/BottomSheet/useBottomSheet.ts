import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeBottomSheet } from '../../store/slices/uiSlice';

export const useBottomSheet = () => {
  const dispatch = useAppDispatch();
  const { bottomSheet } = useAppSelector((state) => state.ui);

  const handleClose = () => {
    dispatch(closeBottomSheet());
  };

  return {
    isOpen: bottomSheet.open,
    title: bottomSheet.title || 'Details',
    description: bottomSheet.description,
    handleClose,
  };
};
