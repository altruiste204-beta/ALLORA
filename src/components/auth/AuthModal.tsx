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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <div className="relative w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-[36px] overflow-hidden shadow-2xl bg-[#19344A]">
        <WelcomeAuthScreen
          isModal={true}
          onCloseModal={onClose}
          initialMode={initialMode}
        />
      </div>
    </div>
  );
};

