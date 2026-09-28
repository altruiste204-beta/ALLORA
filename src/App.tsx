/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { AlloraLogo } from './components/common/AlloraLogo';
import { HomeView } from './components/views/HomeView';
import { ChurchesView } from './components/views/ChurchesView';
import { EventsView } from './components/views/EventsView';
import { ProfileView } from './components/views/ProfileView';
import { NeedsView } from './components/views/NeedsView';
import { ResourcesView } from './components/views/ResourcesView';
import { CommunityView } from './components/views/CommunityView';
import { OpportunitiesView } from './components/views/OpportunitiesView';
import { NotificationsView } from './components/views/NotificationsView';
import { AboutView } from './components/views/AboutView';
import { AideView } from './components/views/AideView';
import { FaqView } from './components/views/FaqView';
import { MentionsLegalesView } from './components/views/MentionsLegalesView';
import { CguView } from './components/views/CguView';
import { ConfidentialiteView } from './components/views/ConfidentialiteView';
import { AuthModal } from './components/auth/AuthModal';
import { WelcomeAuthScreen } from './components/auth/WelcomeAuthScreen';
import { ActionSheetModal } from './components/action/ActionSheetModal';
import { AppLoadingScreen } from './components/common/AppLoadingScreen';
import { ActiveTab } from './types';

function MainApp() {
  const { user, profile, memberships, loading, error, clearError, isAccountDeactivated, reactivateCurrentUser, signOut } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  // Splash & animated site loading state before pages are displayed
  const [isInitialSplash, setIsInitialSplash] = useState(true);
  const [showSplashOverlay, setShowSplashOverlay] = useState(true);

  useEffect(() => {
    // Keep animated splash visible for at least 1500ms so animation is smoothly displayed
    const timer = setTimeout(() => {
      setIsInitialSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const isActuallyLoading = loading || isInitialSplash;

  return (
    <>
      {/* Animated Site Loading Screen before pages are displayed */}
      {showSplashOverlay && (
        <AppLoadingScreen
          isExiting={!isActuallyLoading}
          onFinish={() => setShowSplashOverlay(false)}
        />
      )}

      {/* If user is not authenticated, display the Welcome Auth Screen with fixed background & footer */}
      {!user ? (
        <WelcomeAuthScreen />
      ) : isAccountDeactivated ? (
        <div className="min-h-screen bg-gradient-to-br from-[#19344A] via-[#19344A] to-[#19344A] flex flex-col items-center justify-center p-6 text-white selection:bg-[#67B7E8]/30">
          <div className="max-w-md w-full bg-white dark:bg-[#19344A] rounded-3xl p-8 text-center shadow-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF9F6] dark:bg-blue-950/40 text-[#67B7E8] dark:text-[#67B7E8] mx-auto flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#19344A] dark:text-white mb-2">{t.common.deactivatedTitle}</h2>
              <p className="text-xs text-[#19344A]/70 dark:text-[#FAF9F6]/70 leading-relaxed font-medium">
                {t.common.deactivatedDesc}
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                onClick={async () => {
                  setReactivating(true);
                  try {
                    await reactivateCurrentUser();
                  } finally {
                    setReactivating(false);
                  }
                }}
                disabled={reactivating}
                className="w-full py-3.5 rounded-2xl bg-[#67B7E8] hover:bg-[#67B7E8] text-white text-xs font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {reactivating ? t.common.reactivating : t.common.reactivateBtn}
              </button>
              <button
                onClick={() => signOut()}
                className="w-full py-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#19344A]/40 text-[#19344A] dark:text-[#FAF9F6] text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#19344A] transition-colors cursor-pointer"
              >
                {t.actions.signOut}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#E8E4D9] dark:bg-gradient-to-b dark:from-[#19344A] dark:to-[#19344A] text-[#19344A] dark:text-[#FAF9F6] flex flex-col font-sans selection:bg-[#67B7E8]/30 transition-colors duration-200">
      {/* Top Header - clicking profile card opens Profile view directly */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => {
          setActiveTab('profile');
          setIsNavMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNotifications={() => {
          setActiveTab('notifications');
          setIsNavMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateHome={() => {
          setActiveTab('home');
          setIsNavMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isMenuOpen={isNavMenuOpen}
        onToggleMenu={() => setIsNavMenuOpen((prev) => !prev)}
      />

      {/* Navigation (Mobile navBottom + Tablet/PC Responsive Hamburger Drawer) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsNavMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenActionSheet={() => {
          setIsNavMenuOpen(false);
          setIsActionSheetOpen(true);
        }}
        isMenuOpen={isNavMenuOpen}
        onCloseMenu={() => setIsNavMenuOpen(false)}
        onToggleMenu={() => setIsNavMenuOpen((prev) => !prev)}
        onOpenAuth={() => {
          setIsNavMenuOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Offline Banner */}
      {!navigator.onLine && (
        <div className="bg-[#67B7E8] text-white text-xs font-bold py-2 px-4 text-center">
          {t.common.offlineNotice}
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#19344A] flex items-start justify-between gap-3 text-[#19344A] text-xs">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-[#19344A] font-bold hover:underline cursor-pointer"
            >
              {t.actions.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'home' && (
          <HomeView
            onOpenActionSheet={() => setIsActionSheetOpen(true)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'churches' && (
          <ChurchesView onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {activeTab === 'events' && (
          <EventsView
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenActionSheet={() => setIsActionSheetOpen(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            onOpenAuth={() => setIsAuthOpen(true)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'needs' && (
          <NeedsView onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {activeTab === 'resources' && (
          <ResourcesView onOpenAuth={() => setIsAuthOpen(true)} />
        )}
        
        {activeTab === 'community' && (
          <CommunityView />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesView
            currentUser={user}
            userProfile={profile}
            memberships={memberships}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsView />
        )}

        {activeTab === 'a-propos' && (
          <AboutView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'aide' && (
          <AideView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'faq' && (
          <FaqView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'mentions-legales' && (
          <MentionsLegalesView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'cgu' && (
          <CguView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'confidentialite' && (
          <ConfidentialiteView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
      </main>

      {/* Footer */}
      <Footer variant="light" />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ActionSheetModal
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onSelectAction={(actionKey) => {
          if (actionKey === 'ask_help') {
            setActiveTab('needs');
          } else if (actionKey === 'share_resource') {
            setActiveTab('resources');
          } else if (actionKey === 'create_event') {
            setActiveTab('events');
          } else if (actionKey === 'publish_opportunity') {
            setActiveTab('opportunities');
          } else if (actionKey === 'publish_community') {
            setActiveTab('community');
          }
        }}
      />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
