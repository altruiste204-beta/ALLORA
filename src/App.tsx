/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/views/HomeView';
import { ChurchesView } from './components/views/ChurchesView';
import { EventsView } from './components/views/EventsView';
import { ProfileView } from './components/views/ProfileView';
import { NeedsView } from './components/views/NeedsView';
import { ResourcesView } from './components/views/ResourcesView';
import { CommunityView } from './components/views/CommunityView';
import { OpportunitiesView } from './components/views/OpportunitiesView';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { ActionSheetModal } from './components/action/ActionSheetModal';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ActiveTab } from './types';

function MainApp() {
  const { user, profile, memberships, loading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
        <LoadingSpinner size="lg" text="Connexion aux fondations ALLORA..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111315] flex flex-col font-sans selection:bg-[#67B7E8]/30">
      {/* Top Header */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Top Desktop Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenActionSheet={() => setIsActionSheetOpen(true)}
      />

      {/* Global Error Banner (Sober, Accessible) */}
      {error && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#19344A]/30 text-[#19344A] text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-[#19344A]/60 hover:text-[#19344A] cursor-pointer"
              aria-label="Fermer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
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
            onOpenEditProfile={() => setIsProfileOpen(true)}
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
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
