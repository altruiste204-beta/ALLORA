import React, { useState, useEffect } from 'react';
import { Opportunity, OpportunityType, UserProfile, ChurchMember } from '../../types';
import { fetchOpportunities, fetchOpportunitiesPaginated, fetchProfessionalProfiles } from '../../firebase/services/dataService';
import { OpportunityCard } from '../opportunities/OpportunityCard';
import { OpportunityDetailModal } from '../opportunities/OpportunityDetailModal';
import { CreateOpportunityModal } from '../opportunities/CreateOpportunityModal';
import { ProfessionalProfileModal } from '../opportunities/ProfessionalProfileModal';
import { 
  Briefcase, Search, Plus, UserCheck, HeartHandshake, Filter, Tag, 
  MapPin, Users, Sparkles, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';

interface OpportunitiesViewProps {
  currentUser: any;
  userProfile: UserProfile | null;
  memberships: ChurchMember[];
  onOpenAuth: () => void;
}

const CATEGORIES = [
  'Toutes',
  'Graphisme & Vidéo',
  'Musique & Culte',
  'Tech & Informatique',
  'Gestion & Comptabilité',
  'Communication & Rédaction',
  'Bâtiment & Logistique',
  'Social & Entraide',
  'Enseignement & Formation'
];

const POPULAR_SKILLS = [
  'Vidéaste', 'Graphiste', 'Comptable', 'Développeur', 'Musicien',
  'Sonorisation', 'Chauffeur', 'Community Manager', 'Traducteur'
];

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  currentUser,
  userProfile,
  memberships,
  onOpenAuth
}) => {
  // Main view mode: 'search_need' (Je recherche) vs 'propose_service' (Je propose) vs 'talents' (Membres & Talents)
  const [activeMainTab, setActiveMainTab] = useState<'search_need' | 'propose_service' | 'talents'>('propose_service');
  
  // Data state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [talents, setTalents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInitialMode, setCreateInitialMode] = useState<'propose' | 'search'>('propose');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [oppsRes, profs] = await Promise.all([
        fetchOpportunitiesPaginated(18),
        fetchProfessionalProfiles()
      ]);
      setOpportunities(oppsRes.items);
      setLastDoc(oppsRes.lastDoc);
      setHasMore(oppsRes.hasMore);
      setTalents(profs);
    } catch (err: any) {
      console.error('Error loading opportunities:', err);
      setError(err.message || 'Erreur lors du chargement des opportunités.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const oppsRes = await fetchOpportunitiesPaginated(18, lastDoc);
      setOpportunities(prev => [...prev, ...oppsRes.items]);
      setLastDoc(oppsRes.lastDoc);
      setHasMore(oppsRes.hasMore);
    } catch (err: any) {
      console.error('Error loading more opportunities:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    // Visibility check: private is only visible to author
    if (opp.visibility === 'private' && opp.authorId !== currentUser?.uid) {
      return false;
    }

    // Main Tab segregation:
    // 'propose_service': Service proposals and volunteers offering help (type: service, volunteer)
    // 'search_need': Needs, skill requests and job offers (type: skill_request, job)
    if (activeMainTab === 'propose_service') {
      if (opp.type !== 'service' && opp.type !== 'volunteer') return false;
    } else if (activeMainTab === 'search_need') {
      if (opp.type !== 'skill_request' && opp.type !== 'job') return false;
    }

    // Type filter
    if (typeFilter !== 'all' && opp.type !== typeFilter) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'Toutes' && opp.category !== selectedCategory) {
      return false;
    }

    // Search query (matches title, description, skills, location, author/church name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchDesc = opp.description.toLowerCase().includes(q);
      const matchSkills = opp.skills && opp.skills.some(s => s.toLowerCase().includes(q));
      const matchLoc = opp.location && opp.location.toLowerCase().includes(q);
      const matchAuthor = (opp.authorName && opp.authorName.toLowerCase().includes(q)) || 
                          (opp.churchName && opp.churchName.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSkills && !matchLoc && !matchAuthor) {
        return false;
      }
    }

    return true;
  });

  // Filtered Talents / Members
  const filteredTalents = talents.filter((talent) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName = talent.displayName.toLowerCase().includes(q);
    const matchTitle = talent.professionalTitle && talent.professionalTitle.toLowerCase().includes(q);
    const matchSkills = talent.skills && talent.skills.some(s => s.toLowerCase().includes(q));
    const matchServices = talent.servicesOffered && talent.servicesOffered.some(s => s.toLowerCase().includes(q));
    const matchLoc = talent.location && talent.location.toLowerCase().includes(q);
    return matchName || matchTitle || matchSkills || matchServices || matchLoc;
  });

  const handleOpenCreate = (mode: 'propose' | 'search') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setCreateInitialMode(mode);
    setShowCreateModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-900 via-teal-900 to-primary p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold tracking-wide border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coopération & Talents Chrétiens</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Opportunités & Compétences
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Mettez vos compétences professionnelles au service des églises et de la communauté, trouvez des collaborateurs chrétiens et répondez aux besoins de talents.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleOpenCreate('propose')}
              className="px-4 py-2.5 bg-white text-emerald-950 font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Proposer mes services</span>
            </button>
            <button
              onClick={() => handleOpenCreate('search')}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Rechercher une compétence</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveMainTab('propose_service')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'propose_service'
                ? 'bg-white text-primary shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Je propose ({opportunities.filter(o => o.type === 'service' || o.type === 'volunteer').length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('search_need')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'search_need'
                ? 'bg-white text-primary shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4 text-amber-600" />
            <span>Je recherche ({opportunities.filter(o => o.type === 'skill_request' || o.type === 'job').length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('talents')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'talents'
                ? 'bg-white text-primary shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 text-primary" />
            <span>Talents ({talents.length})</span>
          </button>
        </div>

        <button
          onClick={() => handleOpenCreate(activeMainTab === 'search_need' ? 'search' : 'propose')}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{activeMainTab === 'search_need' ? 'Publier un besoin' : 'Publier une annonce'}</span>
        </button>
      </div>

      {/* Search Bar & Quick Skill Chips */}
      <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par compétence (ex: vidéaste, comptable, développeur, musicien, chauffeur)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Popular skill pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-gray-400 font-semibold text-[11px] mr-1">Suggestions rapides :</span>
          {POPULAR_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => setSearchQuery(skill === searchQuery ? '' : skill)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                searchQuery.toLowerCase() === skill.toLowerCase()
                  ? 'bg-primary text-white font-bold'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Category Horizontal Bar */}
        {activeMainTab !== 'talents' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white border border-gray-100 rounded-2xl animate-pulse p-5" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-100 space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-gray-800">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      ) : activeMainTab === 'talents' ? (
        /* Talents / Member Profiles Grid */
        filteredTalents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">Aucun profil de talent trouvé</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Complétez votre profil en indiquant vos compétences et les services que vous proposez pour apparaître ici !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTalents.map((talent) => (
              <div
                key={talent.userId}
                onClick={() => setSelectedProfile(talent)}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base overflow-hidden shrink-0 border border-primary/20">
                      {talent.photoUrl ? (
                        <img src={talent.photoUrl} alt={talent.displayName} className="w-full h-full object-cover" />
                      ) : (
                        talent.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                        {talent.displayName}
                      </h3>
                      {talent.professionalTitle && (
                        <p className="text-xs font-semibold text-emerald-700 truncate">
                          {talent.professionalTitle}
                        </p>
                      )}
                      {talent.location && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3" /> {talent.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {talent.bio && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                      {talent.bio}
                    </p>
                  )}

                  {/* Skills tags */}
                  {talent.skills && talent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {talent.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {talent.skills.length > 4 && (
                        <span className="text-[10px] text-gray-400 font-medium self-center">
                          +{talent.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Voir le profil & contacter</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Opportunities List Grid */
        filteredOpportunities.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">
              {activeMainTab === 'propose_service'
                ? 'Aucun service proposé pour le moment'
                : 'Aucune recherche de compétence active'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Soyez le premier à publier une annonce dans cette catégorie pour connecter la communauté !
            </p>
            <button
              onClick={() => handleOpenCreate(activeMainTab === 'search_need' ? 'search' : 'propose')}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publier la première annonce</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.opportunityId}
                  opportunity={opportunity}
                  isOwner={currentUser?.uid === opportunity.authorId}
                  onClick={() => setSelectedOpportunity(opportunity)}
                />
              ))}
            </div>

            {/* Pagination Load More */}
            {hasMore && !loading && (
              <div className="flex justify-center pt-4 pb-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white border border-gray-200 hover:border-primary text-gray-800 text-xs font-bold rounded-2xl transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  {loadingMore ? (
                    <span>Chargement...</span>
                  ) : (
                    <>
                      <span>Afficher plus d'annonces</span>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )
      )}

      {/* Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setSelectedOpportunity(null)}
          onOpportunityUpdated={() => {
            loadData();
          }}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOpportunityModal
          currentUser={currentUser}
          userProfile={userProfile}
          memberships={memberships}
          initialMode={createInitialMode}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* Professional Profile Modal */}
      {selectedProfile && (
        <ProfessionalProfileModal
          profile={selectedProfile}
          currentUser={currentUser}
          currentProfile={userProfile}
          onClose={() => setSelectedProfile(null)}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
};
