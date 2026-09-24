import React, { useState, useEffect } from 'react';
import { ConnectionPattern } from '../common/ConnectionPattern';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { fetchNeeds, fetchResources, fetchEvents, fetchCollaborations } from '../../firebase/services/dataService';
import { Need, Resource, CommunityEvent, Collaboration } from '../../types';
import { i18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';

interface HomeViewProps {
  onOpenActionSheet: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenActionSheet,
  onNavigateTab,
  onOpenAuth,
}) => {
  const { user, notifications } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'needs' | 'resources' | 'events' | 'collaborations'>('needs');

  const [needs, setNeeds] = useState<Need[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [nList, rList, eList, cList] = await Promise.all([
          fetchNeeds().catch(() => []),
          fetchResources().catch(() => []),
          fetchEvents().catch(() => []),
          fetchCollaborations().catch(() => []),
        ]);
        if (isMounted) {
          setNeeds(nList);
          setResources(rList);
          setEvents(eList);
          setCollaborations(cList);
        }
      } catch (err) {
        console.warn('Initial data query note:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered lists
  const queryLower = searchQuery.toLowerCase().trim();
  const filteredNeeds = needs.filter(
    (n) => n.title?.toLowerCase().includes(queryLower) || n.description?.toLowerCase().includes(queryLower) || n.category?.toLowerCase().includes(queryLower)
  );
  const filteredResources = resources.filter(
    (r) => r.title?.toLowerCase().includes(queryLower) || r.description?.toLowerCase().includes(queryLower) || r.category?.toLowerCase().includes(queryLower)
  );
  const filteredEvents = events.filter(
    (e) => e.title?.toLowerCase().includes(queryLower) || e.location?.toLowerCase().includes(queryLower)
  );
  const filteredCollaborations = collaborations.filter(
    (c) => c.title?.toLowerCase().includes(queryLower) || c.description?.toLowerCase().includes(queryLower)
  );

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card with Connection Network Motif */}
      <section className="relative overflow-hidden rounded-3xl bg-[#19344A] text-[#FAF9F6] p-6 sm:p-9 shadow-md">
        {/* Secondary Graphic Motif: nodes + lines + connections */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <ConnectionPattern />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6]/10 border border-[#FAF9F6]/15 text-[11px] font-bold text-[#67B7E8] mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span>ALLORA — Connectés pour servir</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FFFFFF]">
              {i18n.home.greeting}
            </h1>
            {/* Respect rule: NO EMOJIS! ONLY SVGs. Linear SVG greeting symbol */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#67B7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </div>

          <p className="text-sm sm:text-base text-[#FAF9F6]/90 font-medium mb-6 leading-relaxed">
            {i18n.home.searchQuestion}
          </p>

          {/* Global Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#19344A]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={i18n.actions.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFFFF] text-[#111315] text-sm placeholder:text-[#19344A]/50 focus:outline-none focus:ring-2 focus:ring-[#67B7E8] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#19344A]/50 hover:text-[#19344A] cursor-pointer"
                aria-label="Effacer la recherche"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Unread Notifications Alert Banner */}
      {user && notifications.some(n => !n.read) && (
        <div
          onClick={() => onNavigateTab('profile')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#67B7E8] hover:border-[#19344A]/40 transition-all text-xs text-[#19344A] flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#67B7E8] animate-ping" />
            <span className="font-bold">
              Vous avez {notifications.filter(n => !n.read).length} nouvelle(s) notification(s) d'église.
            </span>
          </div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#67B7E8] group-hover:text-[#19344A] transition-colors inline-flex items-center gap-1">
            <span>Consulter</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      )}

      {/* Quick Core Action Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={onOpenActionSheet}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] hover:border-[#19344A]/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center shrink-0 group-hover:bg-[#E8E4D9]/40 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#19344A]">
              {i18n.actions.askHelp}
            </h3>
            <p className="text-xs text-[#19344A]/60 mt-0.5">
              Quelque chose vous manque ?
            </p>
          </div>
        </button>

        <button
          onClick={onOpenActionSheet}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] hover:border-[#19344A]/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center shrink-0 group-hover:bg-[#E8E4D9]/40 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.67l7.65-7.66.77-.78a5.4 5.4 0 0 0 0-7.65z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#19344A]">
              {i18n.actions.shareResource}
            </h3>
            <p className="text-xs text-[#19344A]/60 mt-0.5">
              Partager une ressource
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('opportunities')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] hover:border-[#19344A]/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center shrink-0 group-hover:bg-[#E8E4D9]/40 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#19344A]">
              Opportunités
            </h3>
            <p className="text-xs text-[#19344A]/60 mt-0.5">
              Services & Compétences
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('churches')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] hover:border-[#19344A]/40 text-left transition-all cursor-pointer group shadow-xs hover:shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center shrink-0 group-hover:bg-[#E8E4D9]/40 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10l-6-5-6 5v10" />
              <path d="M12 2v3" />
              <path d="M10.5 3.5h3" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#19344A]">
              {i18n.actions.findChurch}
            </h3>
            <p className="text-xs text-[#19344A]/60 mt-0.5">
              Trouvez votre communauté
            </p>
          </div>
        </button>
      </section>

      {/* Section "Autour de vous" */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#19344A] tracking-tight">
              {i18n.home.aroundYou}
            </h2>
            <p className="text-xs text-[#19344A]/60 mt-0.5">
              Besoins récents, ressources partagées et initiatives communautaires
            </p>
          </div>

          {/* Subtabs Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#E8E4D9]/60 border border-[#E8E4D9] overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('needs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'needs'
                  ? 'bg-[#FFFFFF] text-[#19344A] shadow-2xs'
                  : 'text-[#19344A]/70 hover:text-[#19344A]'
              }`}
            >
              {i18n.home.tabs.needs}
            </button>
            <button
              onClick={() => setActiveSubTab('resources')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'resources'
                  ? 'bg-[#FFFFFF] text-[#19344A] shadow-2xs'
                  : 'text-[#19344A]/70 hover:text-[#19344A]'
              }`}
            >
              {i18n.home.tabs.resources}
            </button>
            <button
              onClick={() => setActiveSubTab('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'events'
                  ? 'bg-[#FFFFFF] text-[#19344A] shadow-2xs'
                  : 'text-[#19344A]/70 hover:text-[#19344A]'
              }`}
            >
              {i18n.home.tabs.events}
            </button>
            <button
              onClick={() => setActiveSubTab('collaborations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'collaborations'
                  ? 'bg-[#FFFFFF] text-[#19344A] shadow-2xs'
                  : 'text-[#19344A]/70 hover:text-[#19344A]'
              }`}
            >
              {i18n.home.tabs.collaborations}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <LoadingSpinner text="Chargement des opportunités communautaires..." />
        ) : (
          <div className="space-y-3">
            {activeSubTab === 'needs' && (
              filteredNeeds.length === 0 ? (
                <EmptyState
                  title={i18n.home.emptyStateTitle}
                  description={i18n.home.emptyStateSubtitle}
                  actionLabel={user ? i18n.actions.askHelp : i18n.actions.signIn}
                  onAction={user ? onOpenActionSheet : onOpenAuth}
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredNeeds.map((need) => (
                    <div key={need.needId} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#19344A]/60 mb-2">
                        <span className="font-semibold uppercase tracking-wider">{need.category}</span>
                        {need.location && <span>{need.location.city}, {need.location.country}</span>}
                      </div>
                      <h4 className="text-sm font-bold text-[#19344A] mb-1">{need.title}</h4>
                      <p className="text-xs text-[#19344A]/70 line-clamp-2">{need.description}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeSubTab === 'resources' && (
              filteredResources.length === 0 ? (
                <EmptyState
                  title="Aucune ressource répertoriée."
                  description="Avez-vous du matériel, une salle ou une compétence à prêter ou à offrir ?"
                  actionLabel={user ? i18n.actions.shareResource : i18n.actions.signIn}
                  onAction={user ? onOpenActionSheet : onOpenAuth}
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.67l7.65-7.66.77-.78a5.4 5.4 0 0 0 0-7.65z" />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredResources.map((res) => (
                    <div key={res.resourceId} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#19344A]/60 mb-2">
                        <span className="font-semibold uppercase tracking-wider">{res.type}</span>
                        {res.location && <span>{res.location.city}, {res.location.country}</span>}
                      </div>
                      <h4 className="text-sm font-bold text-[#19344A] mb-1">{res.title}</h4>
                      <p className="text-xs text-[#19344A]/70 line-clamp-2">{res.description}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeSubTab === 'events' && (
              filteredEvents.length === 0 ? (
                <EmptyState
                  title="Aucun événement programmé."
                  description="Découvrez les rassemblements de service, formations et célébrations des églises locales."
                  actionLabel="Consulter l'espace Événements"
                  onAction={() => onNavigateTab('events')}
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredEvents.map((ev) => (
                    <div key={ev.eventId} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#19344A]/60 mb-2">
                        <span>{new Date(ev.startAt).toLocaleDateString()}</span>
                        <span>{ev.location}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#19344A] mb-1">{ev.title}</h4>
                      <p className="text-xs text-[#19344A]/70 line-clamp-2">{ev.description}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeSubTab === 'collaborations' && (
              filteredCollaborations.length === 0 ? (
                <EmptyState
                  title="Aucune collaboration inter-églises active."
                  description="Construisons quelque chose ensemble : séminaires communs, partage logistique, projets régionaux."
                  actionLabel="En savoir plus sur les collaborations"
                  onAction={onOpenActionSheet}
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredCollaborations.map((collab) => (
                    <div key={collab.collaborationId} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">Collaboration</span>
                      <h4 className="text-sm font-bold text-[#19344A] mt-1 mb-1">{collab.title}</h4>
                      <p className="text-xs text-[#19344A]/70 line-clamp-2">{collab.description}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
};
