import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full border-[#E8E4D9] border-t-[#19344A] animate-spin`}
        role="status"
        aria-label="Chargement"
      />
      {text && (
        <p className="text-xs font-medium text-[#19344A]/70 animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
};
