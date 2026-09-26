import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button, TextField } from '../components';
import { auth } from '../store/firebaseConfig';
import { useAppDispatch } from '../store/hooks';
import { showSnackbar } from '../store/slices/uiSlice';
import './LoginModal.css';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (error) setError('');
  };

  const handlePinChange = (val: string) => {
    setPin(val);
    if (error) setError('');
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

  return (
    <div className="login-modal__overlay">
      <div className="login-modal__container">
        <div id="recaptcha-container" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="login-modal__close-btn"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="login-modal__header">
          <img
            src="/favicon.svg"
            alt="HaySales Logo"
            className="login-modal__logo-img"
          />
          <h2 className="login-modal__title">
            {phoneSubmitted ? 'Enter PIN' : 'Secure Sign In'}
          </h2>
          <p className="login-modal__subtitle">
            {phoneSubmitted
              ? `Enter your 6-digit PIN for +91 ${phoneNumber}`
              : 'Confirm access using your phone number.'}
          </p>
        </div>

        {/* Error Message */}
        {error && <div className="login-modal__error">{error}</div>}

        {/* Step 1: Mobile Number with +91 Start Adornment */}
        {!phoneSubmitted ? (
          <form onSubmit={handleSendCode} className="login-modal__form">
            <TextField
              label="Mobile Number"
              placeholder="98765 43210"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              required
              supportingText="10-digit Indian phone number"
              startAdornment={
                <span className="login-modal__country-code">+91</span>
              }
            />

            <div className="login-modal__actions">
              <Button
                type="submit"
                variant="filled"
                disabled={loading}
                onClick={handleSendCode}
              >
                {loading ? 'Processing...' : 'Login'}
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: 6-Digit PIN Verification */
          <form onSubmit={handleVerifyPin} className="login-modal__form">
            <TextField
              label="Login PIN / Code"
              placeholder="Enter 6-digit PIN"
              type="password"
              value={pin}
              onChange={handlePinChange}
              required
              supportingText="Enter your 6-digit login PIN"
              startAdornment={<ShieldCheck className="h-4 w-4" />}
            />

            <div className="login-modal__actions">
              <Button
                type="submit"
                variant="filled"
                disabled={loading}
                onClick={handleVerifyPin}
              >
                {loading ? 'Verifying PIN...' : 'Verify & Log In'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setPhoneSubmitted(false);
                  setPin('');
                  setError('');
                }}
                className="login-modal__edit-number-btn"
              >
                Edit Mobile Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
