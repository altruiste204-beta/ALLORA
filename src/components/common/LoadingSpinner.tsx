import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  variant?: 'dark' | 'light' | 'primary';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  variant = 'primary',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  const spinnerColorMap = {
    primary: 'border-[#E8E4D9] border-t-[#67B7E8]',
    light: 'border-white/20 border-t-white',
    dark: 'border-[#E8E4D9] border-t-[#19344A]',
  };

  const textColorMap = {
    primary: 'text-[#19344A] dark:text-white font-bold',
    light: 'text-white font-extrabold',
    dark: 'text-[#19344A] dark:text-white font-bold',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3.5 p-6 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full ${spinnerColorMap[variant]} animate-spin`}
        role="status"
        aria-label="Chargement"
      />
      {text && (
        <p className={`text-sm sm:text-base tracking-wide text-center animate-pulse ${textColorMap[variant]}`}>
          {text}
        </p>
      )}
    </div>
  );
};
