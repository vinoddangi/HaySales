import {
  ConfirmationResult,
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = getAuth();
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (isOpen && !recaptchaRef.current) {
      try {
        recaptchaRef.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
          },
        );
      } catch (err) {
        console.error('reCAPTCHA initialization failed', err);
      }
    }
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, [isOpen, auth]);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!recaptchaRef.current) return;

    try {
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaRef.current,
      );
      setConfirmationResult(confirmation);
      setPhoneSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error processing phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(pin);
      onClose(); // Sign-in complete!
    } catch {
      setError('Incorrect PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-m3-outline-variant bg-m3-surface p-6 shadow-2xl">
        <div id="recaptcha-container"></div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-m3-surface-container-high"
        >
          <X className="h-5 w-5 text-m3-on-surface-variant" />
        </button>

        <div className="mb-6 space-y-2 text-center">
          <img
            src="/favicon.svg"
            alt="HaySales Logo"
            className="mx-auto h-12 w-12 rounded-2xl shadow-md"
          />
          <h2 className="text-sm font-bold text-m3-on-surface">
            Secure Sign In
          </h2>
          <p className="text-xs text-m3-on-surface-variant">
            {!phoneSubmitted
              ? 'Confirm access using your phone number.'
              : 'Enter your 6-digit login PIN.'}
          </p>
        </div>

        {error && (
          <p className="mb-4 text-center text-xs text-red-500">{error}</p>
        )}

        {!phoneSubmitted ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-m3-outline bg-m3-surface px-4 py-2.5 text-xs text-m3-on-surface"
              required
            />
            <Button
              type="submit"
              variant="filled"
              className="w-full text-xs"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter 6-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-lg border border-m3-outline bg-m3-surface px-4 py-2.5 text-center text-xs tracking-widest text-m3-on-surface"
              maxLength={6}
              required
            />
            <Button
              type="submit"
              variant="filled"
              className="w-full text-xs"
              disabled={loading}
            >
              {loading ? 'Verifying PIN...' : 'Verify & Log In'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
