import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchNeeds, fetchResources, fetchEvents, fetchChurches, fetchUserMemberships } from '../../firebase/services/dataService';
import { Need, Resource, CommunityEvent, Church, ChurchMember, ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

// Asset images
import heroBannerImg1 from '../../assets/images/allora_hero_landscape_1790246440074.jpg';
import heroBannerImg2 from '../../assets/images/allora_welcome_hero_1790244085401.jpg';
import heroBannerImg3 from '../../assets/images/allora_community_landscape_1790282534868.jpg';

const HERO_IMAGES = [heroBannerImg1, heroBannerImg2, heroBannerImg3];

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'resource' | 'event';
  category?: string;
  isPopular?: boolean;
}

// Popular curated resources and events for church & community sharing
const POPULAR_SUGGESTIONS: SearchSuggestion[] = [
  // Ressources populaires
  { id: 'pop-r1', title: 'Système de sonorisation & micros', type: 'resource', category: 'Audio', isPopular: true },
  { id: 'pop-r2', title: 'Vidéoprojecteur HD & écran géant', type: 'resource', category: 'Multimédia', isPopular: true },
  { id: 'pop-r3', title: 'Microphones sans fil HF', type: 'resource', category: 'Audio', isPopular: true },
  { id: 'pop-r4', title: 'Instruments de musique (guitare, piano)', type: 'resource', category: 'Musique', isPopular: true },
  { id: 'pop-r5', title: 'Minibus / Véhicule de transport', type: 'resource', category: 'Transport', isPopular: true },
  { id: 'pop-r6', title: 'Chaises et tables de réception', type: 'resource', category: 'Mobilier', isPopular: true },
  { id: 'pop-r7', title: 'Caméra de streaming live & régie', type: 'resource', category: 'Média', isPopular: true },
  { id: 'pop-r8', title: 'Salle polyvalente / Répétition', type: 'resource', category: 'Locaux', isPopular: true },
  // Événements populaires
  { id: 'pop-e1', title: 'Concert de louange & adoration', type: 'event', category: 'Musique', isPopular: true },
  { id: 'pop-e2', title: 'Soirée de prière & jeûne communautaire', type: 'event', category: 'Spiritualité', isPopular: true },
  { id: 'pop-e3', title: 'Conférence annuelle des ministères', type: 'event', category: 'Conférence', isPopular: true },
  { id: 'pop-e4', title: 'Formation technique sonorisation & vidéo', type: 'event', category: 'Formation', isPopular: true },
  { id: 'pop-e5', title: 'Rassemblement jeunesse & activités', type: 'event', category: 'Jeunesse', isPopular: true },
  { id: 'pop-e6', title: 'Séminaire de formation & discipulat', type: 'event', category: 'Enseignement', isPopular: true },
  { id: 'pop-e7', title: 'Culte d’actions de grâce inter-églises', type: 'event', category: 'Culte', isPopular: true },
  { id: 'pop-e8', title: 'Partage fraternel & agape', type: 'event', category: 'Communauté', isPopular: true },
];

interface HomeViewProps {
  onOpenActionSheet: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
}

// Format relative time in French/English
function formatTimeAgo(dateString: string | undefined, t: any): string {
  const isFr = t.home.urgent === 'Urgent';
  if (!dateString) return isFr ? 'Récemment' : 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return isFr ? "À l'instant" : "Just now";
  if (diffInMinutes < 60) return isFr ? `Il y a ${diffInMinutes}min` : `${diffInMinutes}min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return isFr ? `Il y a ${diffInHours}h` : `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return isFr ? 'Hier' : 'Yesterday';
  if (diffInDays < 30) return isFr ? `Il y a ${diffInDays}j` : `${diffInDays}d ago`;
  return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
}

// Format event date
function formatEventDate(startAt: string | undefined, endAt: string | undefined, t: any): string {
  const isFr = t.home.urgent === 'Urgent';
  if (!startAt) return isFr ? 'Date à confirmer' : 'Date to be confirmed';
  const d = new Date(startAt);
  const dateStr = d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  
  if (endAt) {
    const end = new Date(endAt);
    const endTimeStr = end.toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr} - ${endTimeStr}`;
  }
  return `${dateStr} • ${timeStr}`;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenActionSheet,
  onNavigateTab,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();

  const [needs, setNeeds] = useState<Need[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [userMemberships, setUserMemberships] = useState<ChurchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchFilter, setActiveSearchFilter] = useState<'all' | 'needs' | 'resources' | 'events'>('all');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Carousel effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      setLoading(true);
      try {
        const [nList, rList, eList, cList] = await Promise.all([
          fetchNeeds().catch(() => []),
          fetchResources().catch(() => []),
          fetchEvents().catch(() => []),
          fetchChurches().catch(() => []),
        ]);

        let mList: ChurchMember[] = [];
        if (user?.uid) {
          mList = await fetchUserMemberships(user.uid).catch(() => []);
        }

        if (isMounted) {
          setNeeds(nList);
          setResources(rList);
          setEvents(eList);
          setChurches(cList);
          setUserMemberships(mList);
        }
      } catch (err) {
        console.warn('Real data loading note:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRealData();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Real user information
  const userFirstName = profile?.displayName
    ? profile.displayName.split(' ')[0]
    : user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email
    ? user.email.split('@')[0]
    : '';

  // Church label formatted cleanly from real memberships or user profile
  const churchNameDisplay = (() => {
    const approved = userMemberships.find(m => m.status === 'approved');
    if (approved?.churchName) {
      return approved.churchName;
    }
    if (profile?.location) {
      return profile.location;
    }
    if (churches.length > 0) {
      return churches[0].name;
    }
    return 'ALLORA Réseau';
  })();

  // Exact live counts from Firestore
  const connectedChurchesCount = churches.length;
  const activeNeedsCount = needs.filter(n => n.status === 'open' || n.status === 'partially_fulfilled').length;
  const availableResourcesCount = resources.filter(r => r.status === 'available').length;
  const upcomingEventsCount = events.filter(e => e.status !== 'cancelled').length;

  // Helper to format LocationDetails or string cleanly for search & display
  const formatLocStr = (loc: any): string => {
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    return [loc.zone, loc.city, loc.country].filter(Boolean).join(', ');
  };

  // Live search normalized query
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete dynamic suggestions (resources + events)
  const autocompleteSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!normalizedQuery) return [];

    // Live resources from Firestore
    const liveResItems: SearchSuggestion[] = resources
      .filter(r => r.status === 'available')
      .map(r => ({
        id: r.resourceId,
        title: r.title,
        type: 'resource',
        category: r.category,
        isPopular: false
      }));

    // Live events from Firestore
    const liveEventItems: SearchSuggestion[] = events
      .filter(e => e.status !== 'cancelled')
      .map(e => ({
        id: e.eventId,
        title: e.title,
        type: 'event',
        category: e.category,
        isPopular: false
      }));

    // Combined pool: live items + curated popular suggestions
    const pool: SearchSuggestion[] = [...liveResItems, ...liveEventItems, ...POPULAR_SUGGESTIONS];

    // Deduplicate by title (case insensitive)
    const seenTitles = new Set<string>();
    const matches: SearchSuggestion[] = [];

    for (const item of pool) {
      const titleKey = item.title.trim().toLowerCase();
      if (seenTitles.has(titleKey)) continue;

      const titleMatches = titleKey.includes(normalizedQuery);
      const catMatches = item.category?.toLowerCase().includes(normalizedQuery);

      if (titleMatches || catMatches) {
        seenTitles.add(titleKey);
        matches.push(item);
      }
    }

    // Sort: Exact prefix first, then word prefix, then popularity
    return matches.sort((a, b) => {
      const aKey = a.title.toLowerCase();
      const bKey = b.title.toLowerCase();
      const aStarts = aKey.startsWith(normalizedQuery) ? 1 : 0;
      const bStarts = bKey.startsWith(normalizedQuery) ? 1 : 0;
      if (bStarts !== aStarts) return bStarts - aStarts;

      // Live items before static ones
      const aLive = a.isPopular ? 0 : 1;
      const bLive = b.isPopular ? 0 : 1;
      return bLive - aLive;
    }).slice(0, 7);
  }, [normalizedQuery, resources, events]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title);
    setIsAutocompleteOpen(false);
    setSelectedSuggestionIndex(-1);
    if (suggestion.type === 'resource') {
      setActiveSearchFilter('resources');
    } else if (suggestion.type === 'event') {
      setActiveSearchFilter('events');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isAutocompleteOpen || autocompleteSuggestions.length === 0) {
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < autocompleteSuggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(autocompleteSuggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsAutocompleteOpen(false);
    }
  };

  // Helper to highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim();
    const index = text.toLowerCase().indexOf(q.toLowerCase());
    if (index === -1) return text;
    const before = text.slice(0, index);
    const match = text.slice(index, index + q.length);
    const after = text.slice(index + q.length);
    return (
      <>
        {before}
        <span className="text-[#67B7E8] font-black underline decoration-2 decoration-[#67B7E8]/40">{match}</span>
        {after}
      </>
    );
  };

  // Live search filtering across needs, resources, and events
  const matchingNeeds = normalizedQuery
    ? needs.filter(n =>
        n.title?.toLowerCase().includes(normalizedQuery) ||
        n.description?.toLowerCase().includes(normalizedQuery) ||
        n.category?.toLowerCase().includes(normalizedQuery) ||
        formatLocStr(n.location).toLowerCase().includes(normalizedQuery) ||
        n.churchName?.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const matchingResources = normalizedQuery
    ? resources.filter(r =>
        r.title?.toLowerCase().includes(normalizedQuery) ||
        r.description?.toLowerCase().includes(normalizedQuery) ||
        r.category?.toLowerCase().includes(normalizedQuery) ||
        formatLocStr(r.location).toLowerCase().includes(normalizedQuery) ||
        r.churchName?.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const matchingEvents = normalizedQuery
    ? events.filter(e =>
        e.title?.toLowerCase().includes(normalizedQuery) ||
        e.description?.toLowerCase().includes(normalizedQuery) ||
        e.category?.toLowerCase().includes(normalizedQuery) ||
        formatLocStr(e.location).toLowerCase().includes(normalizedQuery) ||
        e.churchName?.toLowerCase().includes(normalizedQuery) ||
        e.organizerName?.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const totalResultsCount = matchingNeeds.length + matchingResources.length + matchingEvents.length;

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text={t.profile.loading} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md md:max-w-4xl mx-auto w-full pb-8">
      {/* 0. Barre de recherche communautaire en haut de page */}
      <section ref={searchContainerRef} className="relative z-30">
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-[#6F7B85] dark:text-[#FAF9F6]/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsAutocompleteOpen(true);
              setSelectedSuggestionIndex(-1);
            }}
            onFocus={() => {
              setIsAutocompleteOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              language === 'fr'
                ? 'Rechercher une ressource, un événement, un besoin...'
                : language === 'sw'
                ? 'Tafuta rasilimali, tukio, hitaji...'
                : 'Search resources, events, needs...'
            }
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/15 text-sm text-[#111315] dark:text-[#FAF9F6] placeholder-[#6F7B85]/60 dark:placeholder-[#FAF9F6]/40 shadow-xs focus:outline-none focus:border-[#67B7E8] focus:ring-2 focus:ring-[#67B7E8]/20 transition-all font-medium"
            aria-label="Rechercher des ressources, des événements ou des besoins"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsAutocompleteOpen(false);
                setSelectedSuggestionIndex(-1);
              }}
              className="absolute right-3 p-1.5 rounded-full text-[#6F7B85] hover:text-[#111315] dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-[#111315] transition-all cursor-pointer"
              aria-label="Effacer la recherche"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* Dropdown d'auto-complétion intelligente */}
          {isAutocompleteOpen && autocompleteSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#19344A] rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/25 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-[#E8E4D9]/60 dark:divide-[#67B7E8]/10">
              <div className="px-3.5 py-2 bg-[#FAF9F6] dark:bg-[#111315]/50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#6F7B85] dark:text-[#FAF9F6]/60 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#67B7E8]">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                  {language === 'fr' ? 'Suggestions d’auto-complétion' : 'Auto-complete Suggestions'}
                </span>
                <span className="text-[9px] text-[#6F7B85]/70 dark:text-[#FAF9F6]/40 hidden sm:inline">
                  {language === 'fr' ? 'Utilisez ↑ ↓ puis Entrée' : 'Use ↑ ↓ then Enter'}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto py-1">
                {autocompleteSuggestions.map((item, idx) => {
                  const isSelected = selectedSuggestionIndex === idx;
                  const isResource = item.type === 'resource';
                  return (
                    <button
                      key={`${item.type}-${item.id}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#EAF6FD] dark:bg-[#1D334D]'
                          : 'hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isResource
                            ? 'bg-[#EAF7F0] text-[#22A06B] dark:bg-[#22A06B]/20'
                            : 'bg-[#EAF6FD] text-[#67B7E8] dark:bg-[#67B7E8]/20'
                        }`}>
                          {isResource ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
                              <path d="M3.27 6.96 12 12.01l8.73-5.05" />
                              <path d="M12 22.08V12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111315] dark:text-white truncate">
                            {highlightMatch(item.title, searchQuery)}
                          </p>
                          {item.category && (
                            <p className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate">
                              {item.category}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isResource
                            ? 'bg-[#EAF7F0] text-[#22A06B] dark:bg-[#22A06B]/20'
                            : 'bg-[#EAF6FD] text-[#67B7E8] dark:bg-[#67B7E8]/20'
                        }`}>
                          {isResource
                            ? (language === 'fr' ? 'Ressource' : 'Resource')
                            : (language === 'fr' ? 'Événement' : 'Event')}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#6F7B85] dark:text-[#FAF9F6]/40">
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Suggestions populaires en accès direct lorsque le champ est vide */}
        {!searchQuery && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] uppercase font-black tracking-wider text-[#6F7B85] dark:text-[#FAF9F6]/50 shrink-0">
              {language === 'fr' ? 'Populaires :' : 'Popular:'}
            </span>
            {['Sonorisation', 'Vidéoprojecteur', 'Concert de louange', 'Veillée de prière', 'Microphones', 'Minibus / Transport', 'Formation audio'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSearchQuery(item);
                  setIsAutocompleteOpen(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/15 text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/80 hover:border-[#67B7E8] hover:text-[#67B7E8] dark:hover:text-[#67B7E8] transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Panneau de résultats de recherche */}
        {normalizedQuery.length > 0 && (
          <div className="mt-2.5 p-4 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 shadow-xl space-y-4 animate-in fade-in slide-from-top-2 duration-200">
            {/* Filtres par catégorie */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setActiveSearchFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeSearchFilter === 'all'
                    ? 'bg-[#19344A] text-white dark:bg-[#67B7E8]'
                    : 'bg-[#FAF9F6] dark:bg-[#111315]/60 text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white'
                }`}
              >
                {language === 'fr' ? 'Tout' : 'All'} ({totalResultsCount})
              </button>
              <button
                onClick={() => setActiveSearchFilter('resources')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeSearchFilter === 'resources'
                    ? 'bg-[#22A06B] text-white'
                    : 'bg-[#EAF7F0] dark:bg-[#22A06B]/15 text-[#22A06B] hover:opacity-90'
                }`}
              >
                <span>{t.home.tabs.resources}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">{matchingResources.length}</span>
              </button>
              <button
                onClick={() => setActiveSearchFilter('events')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeSearchFilter === 'events'
                    ? 'bg-[#67B7E8] text-white'
                    : 'bg-[#EAF6FD] dark:bg-[#67B7E8]/15 text-[#67B7E8] hover:opacity-90'
                }`}
              >
                <span>{t.home.tabs.events}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">{matchingEvents.length}</span>
              </button>
              <button
                onClick={() => setActiveSearchFilter('needs')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeSearchFilter === 'needs'
                    ? 'bg-[#F59E0B] text-white'
                    : 'bg-[#FFF4DD] dark:bg-[#F59E0B]/15 text-[#F59E0B] hover:opacity-90'
                }`}
              >
                <span>{t.home.tabs.needs}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">{matchingNeeds.length}</span>
              </button>
            </div>

            {totalResultsCount === 0 ? (
              <div className="py-6 text-center space-y-1.5">
                <p className="text-xs font-bold text-[#19344A] dark:text-white">
                  {language === 'fr'
                    ? `Aucun résultat pour « ${searchQuery} »`
                    : `No results for "${searchQuery}"`}
                </p>
                <p className="text-[11px] text-[#6F7B85] dark:text-[#FAF9F6]/60">
                  {language === 'fr'
                    ? 'Essayez avec un autre mot-clé (ex: transport, prière, audio, culte...)'
                    : 'Try another keyword (e.g. transport, prayer, audio, service...)'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {/* Ressources */}
                {(activeSearchFilter === 'all' || activeSearchFilter === 'resources') && matchingResources.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#22A06B] px-1">
                      {t.home.tabs.resources} ({matchingResources.length})
                    </div>
                    {matchingResources.slice(0, 5).map(res => (
                      <div
                        key={res.resourceId}
                        onClick={() => {
                          setSearchQuery('');
                          onNavigateTab('resources');
                        }}
                        className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9]/60 dark:border-[#67B7E8]/10 hover:border-[#22A06B] flex items-center justify-between gap-3 cursor-pointer transition-all group"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#19344A] dark:text-white group-hover:text-[#22A06B] transition-colors truncate">
                            {res.title}
                          </div>
                          <div className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate">
                            {res.category} {formatLocStr(res.location) ? `• ${formatLocStr(res.location)}` : ''}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#EAF7F0] text-[#22A06B] uppercase shrink-0">
                          {language === 'fr' ? 'Ressource' : 'Resource'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Événements */}
                {(activeSearchFilter === 'all' || activeSearchFilter === 'events') && matchingEvents.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#67B7E8] px-1">
                      {t.home.tabs.events} ({matchingEvents.length})
                    </div>
                    {matchingEvents.slice(0, 5).map(ev => (
                      <div
                        key={ev.eventId}
                        onClick={() => {
                          setSearchQuery('');
                          onNavigateTab('events');
                        }}
                        className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9]/60 dark:border-[#67B7E8]/10 hover:border-[#67B7E8] flex items-center justify-between gap-3 cursor-pointer transition-all group"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#19344A] dark:text-white group-hover:text-[#67B7E8] transition-colors truncate">
                            {ev.title}
                          </div>
                          <div className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate">
                            {ev.location || ev.churchName || ''}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#EAF6FD] text-[#67B7E8] uppercase shrink-0">
                          {language === 'fr' ? 'Événement' : 'Event'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Besoins */}
                {(activeSearchFilter === 'all' || activeSearchFilter === 'needs') && matchingNeeds.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B] px-1">
                      {t.home.tabs.needs} ({matchingNeeds.length})
                    </div>
                    {matchingNeeds.slice(0, 5).map(nd => (
                      <div
                        key={nd.needId}
                        onClick={() => {
                          setSearchQuery('');
                          onNavigateTab('needs');
                        }}
                        className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9]/60 dark:border-[#67B7E8]/10 hover:border-[#F59E0B] flex items-center justify-between gap-3 cursor-pointer transition-all group"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#19344A] dark:text-white group-hover:text-[#F59E0B] transition-colors truncate">
                            {nd.title}
                          </div>
                          <div className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate">
                            {nd.category} {formatLocStr(nd.location) ? `• ${formatLocStr(nd.location)}` : ''}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#FFF4DD] text-[#F59E0B] uppercase shrink-0">
                          {language === 'fr' ? 'Besoin' : 'Need'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 1. Hero Scenic Card with Cross & Mountain Landscape */}
      <section className="relative overflow-hidden rounded-3xl shadow-md border border-[#E8E4D9]/60 aspect-[16/9] min-h-[220px] max-h-[300px] flex flex-col justify-between p-6 text-white group">
        {/* Background photos with crossfade */}
        {HERO_IMAGES.map((img, idx) => (
          <img
            key={img}
            src={img}
            alt={`ALLORA Landscape ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
              idx === currentImageIndex ? 'opacity-100 scale-[1.02]' : 'opacity-0 scale-100'
            }`}
          />
        ))}
        
        {/* Gradient dark overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

        {/* Content Top: Greeting & Blessing */}
        <div className="relative z-10 space-y-1.5 max-w-sm sm:max-w-md">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {userFirstName ? `${t.home.greeting}, ${userFirstName} !` : t.home.welcome}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium leading-snug drop-shadow-sm">
            {t.home.blessing}
          </p>
        </div>

        {/* Content Bottom: Church Pill Location & Carousel Dots */}
        <div className="relative z-10 flex items-center justify-between pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90 shrink-0">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate max-w-[200px] sm:max-w-[280px]">
              {churchNameDisplay}
            </span>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center gap-1.5 pr-1">
            {HERO_IMAGES.map((_, idx) => (
              <span 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? 'w-4 bg-white shadow-xs' : 'w-1.5 bg-white/40'
                }`} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Stat Metric Cards (4 Columns) - Strictly live counts */}
      <section className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Églises connectées */}
        <button
          onClick={() => onNavigateTab('churches')}
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-2xs hover:border-[#67B7E8] dark:hover:border-[#67B7E8] hover:shadow-xs transition-all cursor-pointer text-center group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#DCEFFA] dark:bg-[#19344A]/50 text-[#19344A] dark:text-[#67B7E8] flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className="text-base sm:text-xl font-extrabold text-[#111315] dark:text-[#FAF9F6] leading-tight">
            {connectedChurchesCount}
          </span>
          <span className="text-[10px] sm:text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60 font-medium leading-tight mt-0.5 whitespace-pre-line">
            {t.home.connectedChurches.replace(' ', '\n')}
          </span>
        </button>

        {/* Besoins actifs */}
        <button
          onClick={() => onNavigateTab('needs')}
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#FFF4DD] dark:bg-[#19344A] border border-[#F59E0B]/20 dark:border-[#67B7E8]/10 shadow-2xs hover:border-[#F59E0B] dark:hover:border-[#67B7E8] hover:shadow-xs transition-all cursor-pointer text-center group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-[#19344A]/50 text-[#F59E0B] flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform border border-[#F59E0B]/20">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <span className="text-base sm:text-xl font-extrabold text-[#111315] dark:text-[#FAF9F6] leading-tight">
            {activeNeedsCount}
          </span>
          <span className="text-[10px] sm:text-xs text-[#F59E0B] dark:text-[#FAF9F6]/60 font-bold leading-tight mt-0.5 whitespace-pre-line">
            {t.home.activeNeeds.replace(' ', '\n')}
          </span>
        </button>

        {/* Ressources disponibles */}
        <button
          onClick={() => onNavigateTab('resources')}
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-2xs hover:border-[#67B7E8] dark:hover:border-[#67B7E8] hover:shadow-xs transition-all cursor-pointer text-center group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#E8E4D9]/20 dark:bg-[#19344A]/50 text-[#6F7B85] dark:text-[#FAF9F6]/70 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
              <path d="M3.27 6.96 12 12.01l8.73-5.05" />
              <path d="M12 22.08V12" />
            </svg>
          </div>
          <span className="text-base sm:text-xl font-extrabold text-[#111315] dark:text-[#FAF9F6] leading-tight">
            {availableResourcesCount}
          </span>
          <span className="text-[10px] sm:text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60 font-medium leading-tight mt-0.5 whitespace-pre-line">
            {t.home.availableResources.replace(' ', '\n')}
          </span>
        </button>

        {/* Événements à venir */}
        <button
          onClick={() => onNavigateTab('events')}
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#EAF7F0] dark:bg-[#19344A]/40 border border-[#22A06B]/20 dark:border-[#67B7E8]/10 shadow-2xs hover:border-[#22A06B] dark:hover:border-[#67B7E8] hover:shadow-xs transition-all cursor-pointer text-center group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-[#19344A]/50 text-[#22A06B] flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform border border-[#22A06B]/20">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className="text-base sm:text-xl font-extrabold text-[#19344A] dark:text-[#FAF9F6] leading-tight">
            {upcomingEventsCount}
          </span>
          <span className="text-[10px] sm:text-xs text-[#22A06B] dark:text-[#FAF9F6]/60 font-bold leading-tight mt-0.5 whitespace-pre-line">
            {t.home.upcomingEvents.replace(' ', '\n')}
          </span>
        </button>
      </section>

      {/* 3. Actions rapides (4 Bright Colored Action Cards) */}
      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-[#19344A] dark:text-white tracking-tight">
          {t.home.quickActions}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Publier un besoin (Bright Blue) */}
          <button
            onClick={onOpenActionSheet}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#67B7E8] dark:bg-blue-600 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-center group shadow-sm shadow-blue-500/20"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="text-xs font-bold leading-snug whitespace-pre-line text-white">
              {t.actions.askHelp.replace(' ', '\n')}
            </span>
          </button>

          {/* Proposer une ressource (Palette Blue) */}
          <button
            onClick={onOpenActionSheet}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:bg-[#E8E4D9] dark:hover:bg-[#19344A]/60 active:scale-[0.98] transition-all cursor-pointer text-center group shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#67B7E8]/10 dark:bg-white/10 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67B7E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
                <path d="M3.27 6.96 12 12.01l8.73-5.05" />
                <path d="M12 22.08V12" />
              </svg>
            </div>
            <span className="text-xs font-bold leading-snug whitespace-pre-line text-[#19344A] dark:text-[#FAF9F6]">
              {t.actions.shareResource.replace(' ', '\n')}
            </span>
          </button>

          {/* Créer une collaboration (Palette Navy) */}
          <button
            onClick={onOpenActionSheet}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#19344A] dark:bg-[#19344A] border border-white/10 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-center group shadow-md"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="text-xs font-bold leading-snug whitespace-pre-line text-white">
              {t.actions.createCollab.replace(' ', '\n')}
            </span>
          </button>

          {/* Créer un événement (Palette Light Blue) */}
          <button
            onClick={onOpenActionSheet}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#DCEFFA] dark:bg-blue-900 border border-[#67B7E8]/30 hover:bg-[#67B7E8]/20 transition-all cursor-pointer text-center group shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67B7E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="text-xs font-bold leading-snug whitespace-pre-line text-[#19344A] dark:text-white">
              {t.actions.createEvent.replace(' ', '\n')}
            </span>
          </button>
        </div>
      </section>

      {/* 4. Besoins récents (Recent Needs from Firestore) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#19344A] dark:text-white tracking-tight">
            {t.home.recentNeeds}
          </h2>
          <button
            onClick={() => onNavigateTab('needs')}
            className="text-xs font-bold text-[#67B7E8] dark:text-[#67B7E8] hover:underline cursor-pointer"
          >
            {t.home.viewAll}
          </button>
        </div>

        <div className="space-y-3">
          {needs.length > 0 ? (
            needs.slice(0, 3).map((need) => {
              const isUrgent = need.urgency === 'urgent' || need.urgency === 'high';
              const locationStr = need.location?.city
                ? `${need.location.city}${need.location.country ? `, ${need.location.country}` : ''}`
                : need.location?.zone || t.profile.defaultLocation;

              return (
                <div
                  key={need.needId}
                  onClick={() => onNavigateTab('needs')}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9]/80 dark:border-[#67B7E8]/10 hover:border-[#67B7E8] dark:hover:border-[#67B7E8] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                >
                  {/* Thumbnail / Icon Badge */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#FAF9F6] dark:bg-[#19344A]/40 flex items-center justify-center border border-[#E8E4D9] dark:border-white/10">
                    {need.imageUrl ? (
                      <img
                        src={need.imageUrl}
                        alt={need.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-[#DCEFFA]/30 dark:bg-blue-950/30 text-[#67B7E8]`}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111315] dark:text-white truncate group-hover:text-[#67B7E8] transition-colors">
                      {need.title}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60 mt-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#6F7B85] dark:text-[#FAF9F6]/60">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="truncate">{locationStr}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {isUrgent ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FDECEE] text-[#DC3545] border border-[#DC3545]/20 text-[11px] font-bold">
                          {t.home.urgent}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EAF6FD] text-[#67B7E8] border border-[#67B7E8]/20 text-[11px] font-bold">
                          {need.status === 'partially_fulfilled' ? t.home.partial : t.home.ongoing}
                        </span>
                      )}

                      <span className="text-[11px] text-[#6F7B85] dark:text-[#FAF9F6]/50">
                        {formatTimeAgo(need.createdAt, t)}
                      </span>
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <div className="text-[#19344A]/30 dark:text-[#FAF9F6]/30 group-hover:text-[#67B7E8] dark:group-hover:text-[#DCEFFA] group-hover:translate-x-0.5 transition-all pl-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9]/80 dark:border-[#67B7E8]/10 text-center space-y-2 shadow-2xs">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">{t.home.noNeeds}</p>
              <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70">{t.home.noNeedsSubtitle}</p>
              <button
                onClick={onOpenActionSheet}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#67B7E8] dark:bg-blue-600 text-white text-xs font-bold hover:bg-[#67B7E8] dark:hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                <span>{t.actions.askHelp}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. Événements à venir (Upcoming Events from Firestore) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#19344A] dark:text-white tracking-tight">
            {t.home.upcomingEvents}
          </h2>
          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs font-bold text-[#67B7E8] dark:text-[#67B7E8] hover:underline cursor-pointer"
          >
            {t.home.viewAll}
          </button>
        </div>

        <div className="space-y-3">
          {events.length > 0 ? (
            events.slice(0, 2).map((event) => (
              <div
                key={event.eventId}
                onClick={() => onNavigateTab('events')}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9]/80 dark:border-[#67B7E8]/10 hover:border-[#67B7E8] dark:hover:border-[#67B7E8] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                {/* Thumbnail / Date Box */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#FAF9F6] dark:bg-[#19344A]/40 flex items-center justify-center">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FAF9F6] dark:bg-blue-950/30 text-[#67B7E8] dark:text-[#67B7E8] flex flex-col items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#19344A] dark:text-white truncate group-hover:text-[#67B7E8] transition-colors">
                    {event.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#19344A]/60 dark:text-[#FAF9F6]/60 mt-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#19344A]/60 dark:text-[#FAF9F6]/60">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                    <span className="truncate">{formatEventDate(event.startAt, event.endAt, t)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#19344A]/60 dark:text-[#FAF9F6]/60 mt-0.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#19344A]/60 dark:text-[#FAF9F6]/60">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="truncate">{event.location || (language === 'fr' ? 'Lieu à préciser' : 'Location to be specified')}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      event.status === 'published' 
                        ? 'bg-[#EAF7F0] text-[#22A06B] border-[#22A06B]/20' 
                        : 'bg-[#FAF9F6] text-[#6F7B85] border-[#E8E4D9]'
                    }`}>
                      {event.status === 'published' ? (language === 'fr' ? 'Inscription ouverte' : 'Registration open') : event.status}
                    </span>

                    {event.capacity && (
                      <span className="text-[11px] text-[#19344A]/50 dark:text-[#FAF9F6]/50 font-medium flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>Max {event.capacity} pers.</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="text-[#19344A]/30 dark:text-[#FAF9F6]/30 group-hover:text-[#67B7E8] dark:group-hover:text-[#DCEFFA] group-hover:translate-x-0.5 transition-all pl-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9]/80 dark:border-[#67B7E8]/10 text-center space-y-2 shadow-2xs">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">{t.home.noEvents}</p>
              <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70">{t.home.noEventsSubtitle}</p>
              <button
                onClick={onOpenActionSheet}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#67B7E8] dark:bg-blue-600 text-white text-xs font-bold hover:bg-[#67B7E8] dark:hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                <span>{t.actions.createEvent}</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

