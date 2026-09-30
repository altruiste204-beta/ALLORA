import React from 'react';
import { WelcomeAuthScreen } from './WelcomeAuthScreen';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden">
        <WelcomeAuthScreen
          isModal={true}
          onCloseModal={onClose}
          initialMode={initialMode}
        />
      </div>
    </div>
  );
};

