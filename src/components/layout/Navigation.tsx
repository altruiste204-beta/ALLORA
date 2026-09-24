import React from 'react';
import { ActiveTab } from '../../types';
import { i18n } from '../../i18n';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenActionSheet: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenActionSheet,
}) => {
  return (
    <>
      {/* Mobile Bottom Navigation Bar (Fixed) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E8E4D9] px-2 py-1.5 flex items-center justify-around shadow-lg safe-area-pb"
        aria-label="Navigation principale mobile"
      >
        {/* Accueil */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#19344A] font-bold'
              : 'text-[#19344A]/50 hover:text-[#19344A]/80'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'home' ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] mt-1 tracking-tight">{i18n.nav.home}</span>
        </button>

        {/* Églises */}
        <button
          onClick={() => onTabChange('churches')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'churches'
              ? 'text-[#19344A] font-bold'
              : 'text-[#19344A]/50 hover:text-[#19344A]/80'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'churches' ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10l-6-5-6 5v10" />
            <path d="M12 2v3" />
            <path d="M10.5 3.5h3" />
            <path d="M10 20v-5h4v5" />
          </svg>
          <span className="text-[10px] mt-1 tracking-tight">{i18n.nav.churches}</span>
        </button>

        {/* Communauté */}
        <button
          onClick={() => onTabChange('community')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'community'
              ? 'text-[#19344A] font-bold'
              : 'text-[#19344A]/50 hover:text-[#19344A]/80'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'community' ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[9px] mt-1 tracking-tight">Communauté</span>
        </button>

        {/* Opportunités */}
        <button
          onClick={() => onTabChange('opportunities')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'opportunities'
              ? 'text-[#19344A] font-bold'
              : 'text-[#19344A]/50 hover:text-[#19344A]/80'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'opportunities' ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span className="text-[9px] mt-1 tracking-tight">Opportunités</span>
        </button>

        {/* Central Action "+" Button */}
        <button
          onClick={onOpenActionSheet}
          className="relative -top-2 flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#19344A] text-[#FAF9F6] shadow-md hover:bg-[#111315] active:scale-95 transition-all cursor-pointer border-3 border-[#FAF9F6]"
          aria-label="Ajouter une action"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Événements */}
        <button
          onClick={() => onTabChange('events')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'text-[#19344A] font-bold'
              : 'text-[#19344A]/50 hover:text-[#19344A]/80'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'events' ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[10px] mt-1 tracking-tight">{i18n.nav.events}</span>
        </button>

        {/* Profil */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#19344A] font-bold'
              : 'text-[#19344A]/50 hover:text-[#19344A]/80'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'profile' ? '2.4' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] mt-1 tracking-tight">{i18n.nav.profile}</span>
        </button>
      </nav>

      {/* Desktop Navigation Tabs (Horizontal Top/Sub-Header) */}
      <div className="hidden md:flex justify-center border-b border-[#E8E4D9]/80 bg-[#FAF9F6]">
        <div className="flex items-center gap-1 py-2 max-w-4xl w-full px-6">
          <button
            onClick={() => onTabChange('home')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'home'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span>{i18n.nav.home}</span>
          </button>

          <button
            onClick={() => onTabChange('churches')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'churches'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10l-6-5-6 5v10" />
              <path d="M12 2v3" />
            </svg>
            <span>{i18n.nav.churches}</span>
          </button>
          
          <button
            onClick={() => onTabChange('community')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'community'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Communauté</span>
          </button>

          <button
            onClick={() => onTabChange('opportunities')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'opportunities'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>Opportunités</span>
          </button>

          <button
            onClick={() => onTabChange('events')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
            <span>{i18n.nav.events}</span>
          </button>

          <button
            onClick={() => onTabChange('needs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'needs'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Besoins</span>
          </button>

          <button
            onClick={() => onTabChange('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'resources'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span>Ressources</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#19344A] text-[#FFFFFF] shadow-xs'
                : 'text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#E8E4D9]/40'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{i18n.nav.profile}</span>
          </button>

          <div className="ml-auto">
            <button
              onClick={onOpenActionSheet}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#67B7E8] text-[#19344A] text-xs font-bold hover:bg-[#67B7E8]/90 transition-all cursor-pointer shadow-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{i18n.nav.create}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
