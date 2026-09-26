import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../../store/firebaseConfig';
import { useAppDispatch } from '../../store/hooks';
import { showSnackbar } from '../../store/slices/uiSlice';

export interface UseLoginModalOptions {
  isOpen: boolean;
  onClose: () => void;
}

export const useLoginModal = ({ isOpen, onClose }: UseLoginModalOptions) => {
  const dispatch = useAppDispatch();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  // Initialize invisible reCAPTCHA on modal open
  useEffect(() => {
    if (isOpen && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved
            },
          },
        );
      } catch (err) {
        console.error('reCAPTCHA init error:', err);
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore cleanup error
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, [isOpen]);

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (error) setError('');
  };

  const handlePinChange = (val: string) => {
    setPin(val);
    if (error) setError('');
  };

  const handleEditNumber = () => {
    setPhoneSubmitted(false);
    setPin('');
    setError('');
  };

  const handleSendCode = async (
    e?: React.FormEvent | React.MouseEvent<HTMLElement>,
  ) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const raw = phoneNumber.trim().replace(/\D/g, '');
    if (!raw || raw.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          { size: 'invisible' },
        );
      }

      // Automatically prepend +91 country code
      const fullPhoneNumber =
        raw.startsWith('91') && raw.length > 10 ? `+${raw}` : `+91${raw}`;

      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifierRef.current,
      );

      setConfirmationResult(confirmation);
      setPhoneSubmitted(true);
      dispatch(
        showSnackbar({ message: `Verification code sent to +91 ${raw}` }),
      );
    } catch (err: any) {
      console.error('Send verification code error:', err);
      setError(
        err?.message ||
          'Failed to send verification code. Please check your mobile number.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (
    e?: React.FormEvent | React.MouseEvent<HTMLElement>,
  ) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!confirmationResult) return;
    const cleanedPin = pin.trim();
    if (!cleanedPin || cleanedPin.length < 6) {
      setError('Please enter your complete 6-digit login PIN / OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(cleanedPin);
      dispatch(showSnackbar({ message: 'Signed in successfully!' }));
      onClose();
    } catch (err: any) {
      console.error('Verify PIN error:', err);
      setError('Incorrect PIN / verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    phoneNumber,
    pin,
    phoneSubmitted,
    loading,
    error,
    handlePhoneChange,
    handlePinChange,
    handleEditNumber,
    handleSendCode,
    handleVerifyPin,
  };
};
