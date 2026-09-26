import { ShieldCheck, X } from 'lucide-react';
import React from 'react';
import { Button, Flex, TextField } from '../../components';
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
      <Flex direction="column" gap="md" className="login-modal__container">
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
        <Flex
          direction="column"
          align="center"
          gap="xs"
          className="login-modal__header"
        >
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
        </Flex>

        {/* Error Message */}
        {error && <div className="login-modal__error">{error}</div>}

        {/* Step 1: Mobile Number with +91 Start Adornment */}
        {!phoneSubmitted ? (
          <form onSubmit={handleSendCode} className="login-modal__form">
            <Flex direction="column" gap="md">
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

              <Flex.Item className="login-modal__actions">
                <Button
                  type="submit"
                  variant="filled"
                  disabled={loading}
                  onClick={handleSendCode}
                  fullWidth
                >
                  {loading ? 'Processing...' : 'Login'}
                </Button>
              </Flex.Item>
            </Flex>
          </form>
        ) : (
          /* Step 2: 6-Digit PIN Verification */
          <form onSubmit={handleVerifyPin} className="login-modal__form">
            <Flex direction="column" gap="md">
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

              <Flex
                direction="column"
                gap="sm"
                className="login-modal__actions"
              >
                <Button
                  type="submit"
                  variant="filled"
                  disabled={loading}
                  onClick={handleVerifyPin}
                  fullWidth
                >
                  {loading ? 'Verifying PIN...' : 'Verify & Log In'}
                </Button>

                <Flex.Item
                  as="button"
                  type="button"
                  onClick={handleEditNumber}
                  className="login-modal__edit-number-btn"
                >
                  Edit Mobile Number
                </Flex.Item>
              </Flex>
            </Flex>
          </form>
        )}
      </Flex>
    </div>
  );
};

export default LoginModal;
