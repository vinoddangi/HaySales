import React from 'react';
import {
  Button,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { ShieldCheck, X } from 'lucide-react';
import './LoginModal.css';
import { useLoginModal } from './useLoginModal';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
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
  } = useLoginModal({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="login-modal__overlay">
      <StackLayout
        direction="column"
        gap={2}
        className="login-modal__container"
      >
        <div id="recaptcha-container" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="login-modal__close-btn"
          type="button"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <StackLayout
          direction="column"
          align="center"
          gap={1}
          className="login-modal__header"
        >
          <img
            src="/favicon.svg"
            alt="HaySales Logo"
            className="login-modal__logo-img"
          />
          <Text styleAs="h2" className="login-modal__title">
            <b>{phoneSubmitted ? 'Enter PIN' : 'Secure Sign In'}</b>
          </Text>
          <Text color="secondary" className="login-modal__subtitle">
            {phoneSubmitted
              ? `Enter your 6-digit PIN for +91 ${phoneNumber}`
              : 'Confirm access using your phone number.'}
          </Text>
        </StackLayout>

        {/* Error Message */}
        {error && <div className="login-modal__error">{error}</div>}

        {/* Step 1: Mobile Number with +91 Start Adornment */}
        {!phoneSubmitted ? (
          <form onSubmit={handleSendCode} className="login-modal__form">
            <StackLayout direction="column" gap={2}>
              <FormField necessity="required">
                <FormFieldLabel>Mobile Number</FormFieldLabel>
                <Input
                  placeholder="98765 43210"
                  inputProps={{ type: 'tel' }}
                  value={phoneNumber}
                  onChange={(e) =>
                    handlePhoneChange((e.target as HTMLInputElement).value)
                  }
                  startAdornment={
                    <span className="login-modal__country-code">+91</span>
                  }
                />
                <FormFieldHelperText>
                  10-digit Indian phone number
                </FormFieldHelperText>
              </FormField>

              <div className="login-modal__actions">
                <Button
                  type="submit"
                  variant="cta"
                  disabled={loading}
                  onClick={handleSendCode}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Processing...' : 'Login'}
                </Button>
              </div>
            </StackLayout>
          </form>
        ) : (
          /* Step 2: 6-Digit PIN Verification */
          <form onSubmit={handleVerifyPin} className="login-modal__form">
            <StackLayout direction="column" gap={2}>
              <FormField necessity="required">
                <FormFieldLabel>Login PIN / Code</FormFieldLabel>
                <Input
                  placeholder="Enter 6-digit PIN"
                  inputProps={{ type: 'password' }}
                  value={pin}
                  onChange={(e) =>
                    handlePinChange((e.target as HTMLInputElement).value)
                  }
                  startAdornment={<ShieldCheck size={18} />}
                />
                <FormFieldHelperText>
                  Enter your 6-digit login PIN
                </FormFieldHelperText>
              </FormField>

              <StackLayout
                direction="column"
                gap={1}
                className="login-modal__actions"
              >
                <Button
                  type="submit"
                  variant="cta"
                  disabled={loading}
                  onClick={handleVerifyPin}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Verifying PIN...' : 'Verify & Log In'}
                </Button>

                <button
                  type="button"
                  onClick={handleEditNumber}
                  className="login-modal__edit-number-btn"
                >
                  Edit Mobile Number
                </button>
              </StackLayout>
            </StackLayout>
          </form>
        )}
      </StackLayout>
    </div>
  );
};

export default LoginModal;
