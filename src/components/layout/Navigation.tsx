import React from 'react';
import { 
  Home, 
  Church, 
  Calendar, 
  Briefcase, 
  Users, 
  HeartHandshake, 
  Share2, 
  Layers, 
  User, 
  Bell, 
  Plus, 
  X, 
  HelpCircle, 
  Info, 
  FileText, 
  Shield, 
  LogIn, 
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AlloraLogo } from '../common/AlloraLogo';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenActionSheet: () => void;
  isMenuOpen: boolean;
  onCloseMenu: () => void;
  onToggleMenu: () => void;
  onOpenAuth: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenActionSheet,
  isMenuOpen,
  onCloseMenu,
  onToggleMenu,
  onOpenAuth,
}) => {
  const { user, profile, notifications, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const mobileNavItems: { tab: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: 'home', label: t.nav.home, icon: Home },
    { tab: 'churches', label: t.nav.churches, icon: Church },
    { tab: 'opportunities', label: t.nav.opportunities, icon: Briefcase },
    { tab: 'community', label: t.nav.community, icon: Users },
    { tab: 'profile', label: t.nav.profile, icon: User },
  ];

  const drawerSections = [
    {
      title: 'Navigation principale',
      items: [
        { tab: 'home' as ActiveTab, label: t.nav.home, icon: Home },
        { tab: 'churches' as ActiveTab, label: t.nav.churches, icon: Church },
        { tab: 'events' as ActiveTab, label: t.nav.events, icon: Calendar },
        { tab: 'opportunities' as ActiveTab, label: t.nav.opportunities, icon: Briefcase, badge: 'Nouveau' },
        { tab: 'community' as ActiveTab, label: t.nav.community, icon: Users },
      ],
    },
    {
      title: 'Entraide & Ressources',
      items: [
        { tab: 'needs' as ActiveTab, label: t.nav.needs, icon: HeartHandshake },
        { tab: 'resources' as ActiveTab, label: t.nav.resources, icon: Share2 },
        { tab: 'collaborations' as ActiveTab, label: 'Collaborations', icon: Layers },
      ],
    },
    {
      title: 'Mon Espace',
      items: [
        { tab: 'profile' as ActiveTab, label: t.nav.profile, icon: User },
        { 
          tab: 'notifications' as ActiveTab, 
          label: t.nav.notifications, 
          icon: Bell, 
          badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : undefined 
        },
      ],
    },
    {
      title: 'Informations & Support',
      items: [
        { tab: 'a-propos' as ActiveTab, label: 'À propos', icon: Info },
        { tab: 'aide' as ActiveTab, label: 'Aide & Guides', icon: HelpCircle },
        { tab: 'faq' as ActiveTab, label: 'FAQ', icon: HelpCircle },
        { tab: 'mentions-legales' as ActiveTab, label: 'Mentions Légales', icon: FileText },
        { tab: 'cgu' as ActiveTab, label: 'CGU', icon: Shield },
        { tab: 'confidentialite' as ActiveTab, label: 'Confidentialité', icon: Shield },
      ],
    },
  ];

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Sticky at bottom on md:hidden) */}
      {/* ---------------------------------------------------- */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-[#111315]/95 backdrop-blur-md border-t border-[#E8E4D9] dark:border-[#67B7E8]/15 px-2 pb-[env(safe-area-inset-bottom,0px)] pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors"
        aria-label="Navigation principale mobile"
      >
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          {/* First 2 items */}
          {mobileNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onTabChange(item.tab)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#67B7E8] font-bold'
                    : 'text-[#6F7B85] dark:text-[#FAF9F6]/60 hover:text-[#19344A] dark:hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#67B7E8]/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Central Action Button (+) */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              onClick={onOpenActionSheet}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#19344A] via-[#1E4362] to-[#67B7E8] text-white flex items-center justify-center shadow-lg shadow-[#67B7E8]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-[#111315]"
              aria-label={t.nav.createAction}
              title={t.nav.createAction}
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Remaining 3 items */}
          {mobileNavItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onTabChange(item.tab)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#67B7E8] font-bold'
                    : 'text-[#6F7B85] dark:text-[#FAF9F6]/60 hover:text-[#19344A] dark:hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#67B7E8]/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---------------------------------------------------- */}
      {/* RESPONSIVE HAMBURGER DRAWER (Tablet & Desktop Flyout) */}
      {/* ---------------------------------------------------- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMenu}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="relative ml-auto w-full max-w-sm sm:max-w-md bg-white dark:bg-[#111315] shadow-2xl h-full flex flex-col border-l border-[#E8E4D9] dark:border-[#67B7E8]/20 z-10 overflow-hidden"
            aria-label="Menu latéral de navigation"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E4D9] dark:border-[#67B7E8]/15 flex items-center justify-between bg-[#FAF9F6] dark:bg-[#19344A]/40">
              <div 
                onClick={() => {
                  onTabChange('home');
                  onCloseMenu();
                }}
                className="cursor-pointer"
              >
                <AlloraLogo size="sm" showTagline={true} withContainer={false} />
              </div>
              <button
                onClick={onCloseMenu}
                className="p-2 rounded-xl text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User status card in drawer */}
            <div className="p-4 border-b border-[#E8E4D9] dark:border-[#67B7E8]/15 bg-white dark:bg-[#111315]">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#67B7E8]/30 shrink-0 bg-[#67B7E8] text-white flex items-center justify-center font-bold">
                    {profile?.photoUrl || user.photoURL ? (
                      <img 
                        src={profile?.photoUrl || user.photoURL || ''} 
                        alt={profile?.displayName || 'User'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{profile?.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#19344A] dark:text-white truncate">
                      {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onTabChange('profile');
                      onCloseMenu();
                    }}
                    className="p-1.5 text-xs text-[#67B7E8] hover:underline font-bold"
                  >
                    Voir
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#19344A] dark:text-white">Bienvenue sur ALLORA</p>
                    <p className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60">Connectez-vous pour participer</p>
                  </div>
                  <button
                    onClick={() => {
                      onCloseMenu();
                      onOpenAuth();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#67B7E8] text-white text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-[#67B7E8]/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.actions.signIn}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Action button in Drawer */}
            <div className="p-4 pb-2">
              <button
                onClick={() => {
                  onCloseMenu();
                  onOpenActionSheet();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#19344A] to-[#67B7E8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.nav.createAction}</span>
              </button>
            </div>

            {/* Nav list - scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {drawerSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#6F7B85] dark:text-[#FAF9F6]/40 px-2 mb-1.5">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => {
                          onTabChange(item.tab);
                          onCloseMenu();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#67B7E8]/15 text-[#19344A] dark:text-white font-bold border-l-4 border-[#67B7E8]'
                            : 'text-[#19344A] dark:text-[#FAF9F6]/80 hover:bg-[#FAF9F6] dark:hover:bg-[#19344A]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#67B7E8]' : 'text-[#6F7B85] dark:text-[#FAF9F6]/60'}`} />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#67B7E8] text-white text-[9px] font-black">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-[#6F7B85]/40" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer Footer: Language & Theme switch, Sign Out */}
            <div className="p-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/15 bg-[#FAF9F6] dark:bg-[#19344A]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {/* Language Switch */}
                <button
                  onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315] text-[#19344A] dark:text-[#FAF9F6] text-[11px] font-bold flex items-center gap-1.5 hover:border-[#67B7E8] cursor-pointer"
                  title="Changer de langue"
                >
                  <Globe className="w-3.5 h-3.5 text-[#67B7E8]" />
                  <span>{language.toUpperCase()}</span>
                </button>

                {/* Dark Mode Switch */}
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-1.5 rounded-lg border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315] text-[#19344A] dark:text-[#FAF9F6] hover:border-[#67B7E8] cursor-pointer"
                  title="Basculer le mode sombre"
                  aria-label="Basculer le thème"
                >
                  {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-[#19344A]" />
                  )}
                </button>
              </div>

              {user && (
                <button
                  onClick={async () => {
                    await signOut();
                    onCloseMenu();
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.actions.signOut}</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
