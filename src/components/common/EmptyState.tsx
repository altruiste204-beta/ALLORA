import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Rien ici pour le moment.',
  description = 'Peut-être que vous serez la première personne à partager quelque chose.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[#FFFFFF] dark:bg-[#19344A] border border-[#E8E4D9]/80 dark:border-[#67B7E8]/10 shadow-xs max-w-md mx-auto my-6">
      <div className="w-16 h-16 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-center justify-center mb-4 text-[#67B7E8]">
        {icon || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-bold text-[#19344A] dark:text-white mb-2 tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-[#19344A]/70 dark:text-[#FAF9F6]/70 leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#19344A] dark:bg-[#67B7E8] text-[#FFFFFF] text-sm font-semibold hover:bg-[#111315] dark:hover:bg-[#67B7E8] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
