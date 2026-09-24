import React from 'react';
import { AlloraLogo } from '../common/AlloraLogo';
import { useAuth } from '../../context/AuthContext';
import { i18n } from '../../i18n';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenProfile }) => {
  const { user, profile, isOnline } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E4D9]/80 transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <AlloraLogo size="md" />
          <div className="hidden sm:flex flex-col border-l border-[#E8E4D9] pl-3 py-0.5">
            <span className="text-xs font-semibold text-[#19344A]/80 tracking-wide">
              {i18n.brand.tagline}
            </span>
          </div>
        </div>

        {/* Right Actions: Network Indicator & User Profile / Login */}
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8E4D9] text-[#19344A] text-xs font-medium" title="Mode hors ligne">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
              <span>Hors-ligne</span>
            </div>
          )}

          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8E4D9] bg-[#FFFFFF] hover:border-[#19344A]/40 transition-all cursor-pointer group"
              aria-label="Voir mon profil"
            >
              <div className="w-7 h-7 rounded-full bg-[#19344A] text-[#FAF9F6] flex items-center justify-center text-xs font-bold shrink-0">
                {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-[#19344A] max-w-[120px] truncate">
                {profile?.displayName || user.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#19344A] text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>{i18n.actions.signIn}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
