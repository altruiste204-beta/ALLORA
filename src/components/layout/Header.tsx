import React from 'react';
import { AlloraLogo } from '../common/AlloraLogo';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onNavigateHome?: () => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAuth, 
  onOpenProfile, 
  onOpenNotifications,
  onNavigateHome,
  isMenuOpen = false,
  onToggleMenu
}) => {
  const { user, profile, notifications, isOnline } = useAuth();
  const { t } = useLanguage();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#111315] border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm transition-colors duration-200">
      <div className="max-w-md md:max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo - clickable to go back to Home */}
        <div 
          onClick={onNavigateHome} 
          className="flex items-center cursor-pointer transition-transform hover:opacity-95 active:scale-98"
          title="ALLORA Accueil"
        >
          <AlloraLogo size="md" showTagline={false} withContainer={false} />
        </div>

        {/* Right Actions: Notifications Bell, Profile Avatar, and Hamburger Menu Button (Tablet / PC) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#6F7B85] text-[10px] font-bold border border-[#E8E4D9] dark:border-transparent" title={t.common.offlineTitle}>
              <span>{t.common.offline}</span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Notification Bell with Real Badge */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-[#19344A] hover:text-[#19344A] dark:hover:text-white transition-colors cursor-pointer"
                aria-label={t.common.notifications}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {/* Real counter badge - shown only when there are unread notifications */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#67B7E8] text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-[#111315] shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Circular User Profile Avatar Frame */}
              {(() => {
                const headerAvatar = (profile && profile.photoUrl !== undefined)
                  ? (profile.photoUrl || '')
                  : (user.photoURL || '');
                return (
                  <button
                    onClick={onOpenProfile}
                    className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:border-[#67B7E8] transition-all cursor-pointer shadow-sm shrink-0"
                    aria-label={t.common.viewProfile}
                  >
                    {headerAvatar ? (
                      <img
                        src={headerAvatar}
                        alt={profile?.displayName || 'Profil'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#67B7E8] text-white flex items-center justify-center text-sm font-black">
                        {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
                      </div>
                    )}
                  </button>
                );
              })()}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#67B7E8] text-white text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-[#67B7E8]/20"
            >
              <span>{t.actions.signIn}</span>
            </button>
          )}

          {/* Hamburger Menu Button - TABLET & PC ONLY (hidden on mobile, visible from md:) */}
          <button
            onClick={onToggleMenu}
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
              isMenuOpen
                ? 'bg-[#67B7E8] text-white border-[#67B7E8] shadow-sm'
                : 'bg-white dark:bg-[#19344A] text-[#19344A] dark:text-[#FAF9F6] border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:border-[#67B7E8] hover:text-[#67B7E8] hover:bg-[#FAF9F6] dark:hover:bg-[#111315]/50'
            }`}
            aria-label="Menu principal de navigation"
            aria-expanded={isMenuOpen}
            title={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
            <span className="text-xs font-black uppercase tracking-wider">
              {isMenuOpen ? 'Fermer' : 'Menu'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
