import React, { useState, useEffect } from 'react';
import { ActiveTab } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AlloraLogo } from '../common/AlloraLogo';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenActionSheet: () => void;
  isMenuOpen: boolean;
  onCloseMenu: () => void;
  onToggleMenu: () => void;
  onOpenAuth?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenActionSheet,
  isMenuOpen,
  onCloseMenu,
  onToggleMenu: _onToggleMenu,
  onOpenAuth,
}) => {
  const { t } = useLanguage();
  const { user, profile, memberships, notifications, signOut } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const approvedChurches = memberships.filter(m => m.status === 'approved');

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        onCloseMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, onCloseMenu]);

  // Close drawer automatically if window resized to mobile (< 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isMenuOpen) {
        onCloseMenu();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen, onCloseMenu]);

  // Prevent background scrolling on desktop/tablet when menu drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // All 9 navigation destinations available in ALLORA with utility-based color accents
  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: t.nav.home,
      description: 'Fil d’actualités & synthèse',
      color: 'bg-[#EAF6FD] dark:bg-[#67B7E8]/15',
      iconColor: 'text-[#67B7E8]',
      activeColor: 'bg-[#67B7E8] text-white',
      badgeColor: 'bg-[#67B7E8]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'churches' as ActiveTab,
      label: t.nav.churches,
      description: 'Communautés locales & annuaire',
      color: 'bg-[#DCEFFA] dark:bg-[#19344A]',
      iconColor: 'text-[#19344A] dark:text-[#67B7E8]',
      activeColor: 'bg-[#19344A] text-white dark:bg-[#67B7E8]',
      badgeColor: 'bg-[#19344A]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10l-6-5-6 5v10" />
          <path d="M12 2v3" />
          <path d="M10.5 3.5h3" />
          <path d="M10 20v-5h4v5" />
        </svg>
      )
    },
    {
      id: 'needs' as ActiveTab,
      label: t.nav.needs,
      description: 'Entraide fraternelle & requêtes',
      color: 'bg-[#FFF4DD] dark:bg-[#F59E0B]/15',
      iconColor: 'text-[#F59E0B]',
      activeColor: 'bg-[#F59E0B] text-white',
      badgeColor: 'bg-[#F59E0B]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      )
    },
    {
      id: 'resources' as ActiveTab,
      label: t.nav.resources,
      description: 'Prêts, matériels & dons offerts',
      color: 'bg-[#EAF7F0] dark:bg-[#22A06B]/15',
      iconColor: 'text-[#22A06B]',
      activeColor: 'bg-[#22A06B] text-white',
      badgeColor: 'bg-[#22A06B]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      )
    },
    {
      id: 'events' as ActiveTab,
      label: t.nav.events,
      description: 'Rencontres, cultes & ateliers',
      color: 'bg-[#EAF6FD] dark:bg-[#67B7E8]/15',
      iconColor: 'text-[#67B7E8]',
      activeColor: 'bg-[#67B7E8] text-white',
      badgeColor: 'bg-[#67B7E8]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: 'opportunities' as ActiveTab,
      label: t.nav.opportunities,
      description: 'Services, compétences & missions',
      color: 'bg-[#E0F2FE] dark:bg-[#0284C7]/15',
      iconColor: 'text-[#0284C7] dark:text-[#67B7E8]',
      activeColor: 'bg-[#0284C7] text-white',
      badgeColor: 'bg-[#0284C7]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: 'community' as ActiveTab,
      label: t.nav.community,
      description: 'Discussions & collaborations',
      color: 'bg-[#EAF6FD] dark:bg-[#67B7E8]/15',
      iconColor: 'text-[#67B7E8]',
      activeColor: 'bg-[#67B7E8] text-white',
      badgeColor: 'bg-[#67B7E8]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'notifications' as ActiveTab,
      label: t.nav.notifications,
      description: 'Alertes & réponses récentes',
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      color: 'bg-[#FFF4DD] dark:bg-[#F59E0B]/15',
      iconColor: 'text-[#F59E0B]',
      activeColor: 'bg-[#F59E0B] text-white',
      badgeColor: 'bg-[#F59E0B]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* ============================================================== */}
      {/* 1. MOBILE BOTTOM NAVIGATION (Intact, exactly preserved)        */}
      {/* ============================================================== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111315] border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 px-3 py-2 flex items-center justify-between shadow-lg safe-area-pb"
        aria-label="Navigation principale mobile"
      >
        {/* 1. Accueil */}
        <button
          onClick={() => {
            setShowMoreMenu(false);
            onTabChange('home');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#67B7E8]'
              : 'text-[#6F7B85] dark:text-[#FAF9F6]/50 hover:text-[#19344A] dark:hover:text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'home' ? '#67B7E8' : 'none'} stroke={activeTab === 'home' ? '#67B7E8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className={`text-[10px] mt-1 tracking-widest uppercase font-black ${activeTab === 'home' ? 'opacity-100' : 'opacity-60'}`}>{t.nav.home}</span>
        </button>

        {/* 2. Églises */}
        <button
          onClick={() => {
            setShowMoreMenu(false);
            onTabChange('churches');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'churches'
              ? 'text-[#67B7E8]'
              : 'text-[#6F7B85] dark:text-[#FAF9F6]/50 hover:text-[#19344A] dark:hover:text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'churches' ? '#67B7E8' : 'none'} stroke={activeTab === 'churches' ? '#67B7E8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10l-6-5-6 5v10" />
            <path d="M12 2v3" />
            <path d="M10.5 3.5h3" />
            <path d="M10 20v-5h4v5" />
          </svg>
          <span className={`text-[10px] mt-1 tracking-widest uppercase font-black ${activeTab === 'churches' ? 'opacity-100' : 'opacity-60'}`}>{t.nav.churches}</span>
        </button>

        {/* 3. Besoins */}
        <button
          onClick={() => {
            setShowMoreMenu(false);
            onTabChange('needs');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'needs'
              ? 'text-[#67B7E8]'
              : 'text-[#6F7B85] dark:text-[#FAF9F6]/50 hover:text-[#19344A] dark:hover:text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'needs' ? '#67B7E8' : 'none'} stroke={activeTab === 'needs' ? '#67B7E8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span className={`text-[10px] mt-1 tracking-widest uppercase font-black ${activeTab === 'needs' ? 'opacity-100' : 'opacity-60'}`}>{t.nav.needs}</span>
        </button>

        {/* 4. Ressources */}
        <button
          onClick={() => {
            setShowMoreMenu(false);
            onTabChange('resources');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'resources'
              ? 'text-[#67B7E8]'
              : 'text-[#6F7B85] dark:text-[#FAF9F6]/50 hover:text-[#19344A] dark:hover:text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'resources' ? '#67B7E8' : 'none'} stroke={activeTab === 'resources' ? '#67B7E8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
            <path d="M3.27 6.96 12 12.01l8.73-5.05" />
            <path d="M12 22.08V12" />
          </svg>
          <span className={`text-[10px] mt-1 tracking-widest uppercase font-black ${activeTab === 'resources' ? 'opacity-100' : 'opacity-60'}`}>{t.nav.resources}</span>
        </button>

        {/* 5. Plus (Grid 4-dots Menu) */}
        <div className="flex-1 relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`w-full flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              ['events', 'community', 'opportunities'].includes(activeTab) || showMoreMenu
                ? 'text-[#67B7E8]'
                : 'text-[#6F7B85] dark:text-[#FAF9F6]/50 hover:text-[#19344A] dark:hover:text-white'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={(['events', 'community', 'opportunities'].includes(activeTab) || showMoreMenu) ? '#67B7E8' : 'none'} stroke={(['events', 'community', 'opportunities'].includes(activeTab) || showMoreMenu) ? '#67B7E8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className={`text-[10px] mt-1 tracking-widest uppercase font-black ${(['events', 'community', 'opportunities'].includes(activeTab) || showMoreMenu) ? 'opacity-100' : 'opacity-60'}`}>{t.nav.more}</span>
          </button>

          {/* More Menu Popup Modal */}
          {showMoreMenu && (
            <div className="absolute bottom-16 right-0 w-52 bg-white dark:bg-[#19344A] rounded-2xl shadow-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 p-2 space-y-1 animate-in fade-in slide-from-bottom-3 duration-150 z-50">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onTabChange('events');
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'events' ? 'bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#67B7E8]' : 'text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-[#111315]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{t.nav.events}</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onTabChange('opportunities');
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'opportunities' ? 'bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#67B7E8]' : 'text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-[#111315]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>{t.nav.opportunities}</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onTabChange('community');
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'community' ? 'bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#67B7E8]' : 'text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-[#111315]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{t.nav.community}</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ============================================================== */}
      {/* 2. FLOATING ACTION '+' BUTTON                                  */}
      {/* ============================================================== */}
      <div className="fixed bottom-20 md:bottom-8 right-5 z-40">
        <button
          onClick={onOpenActionSheet}
          className="w-14 h-14 rounded-full bg-[#67B7E8] hover:bg-[#52a3d4] text-white shadow-xl shadow-[#67B7E8]/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center border-4 border-white dark:border-[#111315]"
          aria-label={t.nav.createAction}
          title={t.nav.createAction || 'Publier / Créer une action'}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. TABLETTE & PC : MENU HAMBURGER DRAWER (Slide-Over Panel)     */}
      {/* ============================================================== */}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMenu}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[340px] sm:max-w-[380px] bg-white dark:bg-[#19344A] border-l border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-2xl z-50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out select-none ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Menu de navigation ALLORA"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header of Drawer */}
        <div className="p-4 border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 flex items-center justify-between shrink-0 bg-[#FAF9F6]/50 dark:bg-[#111315]/30">
          <div className="flex items-center gap-2">
            <AlloraLogo size="sm" showTagline={false} withContainer={false} />
            <span className="text-xs font-black uppercase tracking-wider text-[#19344A] dark:text-white">
              Navigation
            </span>
          </div>

          <button
            onClick={onCloseMenu}
            className="p-2 rounded-xl text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-[#111315] hover:text-[#19344A] dark:hover:text-white border border-transparent hover:border-[#E8E4D9] dark:hover:border-[#67B7E8]/20 transition-all cursor-pointer"
            aria-label="Fermer le menu"
            title="Fermer le menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User Profile Mini Banner (if authenticated) */}
        {user ? (
          <div 
            onClick={() => {
              onTabChange('profile');
              onCloseMenu();
            }}
            className="mx-4 mt-3.5 p-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/10 flex items-center justify-between gap-3 hover:border-[#67B7E8] transition-all cursor-pointer group shrink-0"
            title="Accéder à mon profil"
          >
            <div className="flex items-center gap-3 min-w-0">
              {profile?.photoUrl || user.photoURL ? (
                <img
                  src={profile?.photoUrl || user.photoURL || ''}
                  alt={profile?.displayName || 'Avatar'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#67B7E8]/30 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#67B7E8] text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                  {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-black text-[#19344A] dark:text-white truncate group-hover:text-[#67B7E8] transition-colors">
                  {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate">
                  {approvedChurches.length > 0 ? approvedChurches[0].churchName : (profile?.professionalTitle || 'Membre ALLORA')}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#67B7E8] uppercase tracking-wider shrink-0 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>{t.nav.profile}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </div>
        ) : (
          onOpenAuth && (
            <div className="mx-4 mt-3.5 p-3 rounded-2xl bg-[#EAF6FD] dark:bg-[#111315]/50 border border-[#67B7E8]/20 flex items-center justify-between gap-3 shrink-0">
              <div>
                <div className="text-xs font-black text-[#19344A] dark:text-white">Bienvenue sur ALLORA</div>
                <div className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60">Rejoignez le réseau d'entraide</div>
              </div>
              <button
                onClick={() => {
                  onCloseMenu();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#67B7E8] text-white text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                {t.actions.signIn}
              </button>
            </div>
          )
        )}

        {/* Quick Action Shortcut */}
        <div className="px-4 mt-3 shrink-0">
          <button
            onClick={() => {
              onCloseMenu();
              onOpenActionSheet();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#67B7E8] hover:bg-[#52a3d4] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t.nav.createAction || 'Publier / Proposer'}</span>
          </button>
        </div>

        {/* Scrollable Navigation Destination Links */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 min-h-0">
          <div className="px-2 pb-1 text-[9px] font-black uppercase tracking-widest text-[#6F7B85] dark:text-[#FAF9F6]/40">
            Rubriques de l'application
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMenu();
                }}
                className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#EAF6FD] dark:bg-[#67B7E8]/15 border border-[#67B7E8]/40 shadow-xs'
                    : 'bg-transparent hover:bg-[#FAF9F6] dark:hover:bg-[#111315]/50 border border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border border-[#E8E4D9]/60 dark:border-[#67B7E8]/10 ${
                      isActive
                        ? `${item.activeColor || 'bg-[#67B7E8] text-white'} shadow-sm border-transparent`
                        : `${item.color} ${item.iconColor} group-hover:scale-105`
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-xs font-black truncate transition-colors ${
                        isActive
                          ? 'text-[#19344A] dark:text-white'
                          : 'text-[#6F7B85] dark:text-[#FAF9F6]/80 group-hover:text-[#19344A] dark:group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10px] text-[#6F7B85]/70 dark:text-[#FAF9F6]/50 truncate font-medium">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== undefined && (
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full ${item.badgeColor || 'bg-[#67B7E8]'} text-white text-[9px] font-black flex items-center justify-center shadow-xs`}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#67B7E8]" />
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-[#6F7B85]/40 dark:text-[#FAF9F6]/30 group-hover:text-[#67B7E8] group-hover:translate-x-0.5 transition-all"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawer Bottom Footer */}
        <div className="p-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 shrink-0 bg-[#FAF9F6]/30 dark:bg-[#111315]/20 space-y-2.5">
          {user && (
            <button
              onClick={async () => {
                onCloseMenu();
                await signOut();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-white hover:border-[#67B7E8]/40 hover:bg-[#FAF9F6] dark:hover:bg-[#111315]/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{t.actions.signOut}</span>
            </button>
          )}

          <div className="text-center text-[10px] font-bold text-[#6F7B85] dark:text-[#FAF9F6]/40 uppercase tracking-widest flex items-center justify-center gap-1">
            <span className="font-['Oswald'] text-xs font-bold text-[#19344A] dark:text-white tracking-wider">ALLORA</span>
            <span>•</span>
            <span>{t.brand.tagline}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

