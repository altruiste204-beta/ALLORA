import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Opportunity, OpportunityType, UserProfile, ChurchMember } from '../../types';
import { fetchOpportunities, fetchOpportunitiesPaginated, fetchProfessionalProfiles } from '../../firebase/services/dataService';
import { OpportunityCard } from '../opportunities/OpportunityCard';
import { OpportunityDetailModal } from '../opportunities/OpportunityDetailModal';
import { CreateOpportunityModal } from '../opportunities/CreateOpportunityModal';
import { ProfessionalProfileModal } from '../opportunities/ProfessionalProfileModal';
import { 
  Briefcase, Search, Plus, UserCheck, HeartHandshake, Filter, Tag, 
  MapPin, Users, Sparkles, AlertCircle, RefreshCw, Layers, ArrowRight 
} from 'lucide-react';

interface OpportunitiesViewProps {
  currentUser: any;
  userProfile: UserProfile | null;
  memberships: ChurchMember[];
  onOpenAuth: () => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  currentUser,
  userProfile,
  memberships,
  onOpenAuth
}) => {
  const { t } = useLanguage();

  const CATEGORIES = [
    t.opportunities.categories.all,
    t.opportunities.categories.design,
    t.opportunities.categories.music,
    t.opportunities.categories.tech,
    t.opportunities.categories.accounting,
    t.opportunities.categories.communication,
    t.opportunities.categories.building,
    t.opportunities.categories.social,
    t.opportunities.categories.education
  ];

  const POPULAR_SKILLS = [
    'Vidéaste', 'Graphiste', 'Comptable', 'Développeur', 'Musicien',
    'Sonorisation', 'Chauffeur', 'Community Manager', 'Traducteur'
  ];

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
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
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
      setError(err.message || t.opportunities.error);
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
    if (selectedCategory !== CATEGORIES[0] && opp.category !== selectedCategory) {
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
      <div className="relative overflow-hidden rounded-3xl bg-[#19344A] p-6 sm:p-8 text-white shadow-lg border border-[#67B7E8]/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#67B7E8]/10 backdrop-blur-md text-[#67B7E8] text-xs font-semibold tracking-wide border border-[#67B7E8]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.opportunities.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {t.opportunities.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#FAF9F6]/80 leading-relaxed">
            {t.opportunities.subtitle}
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleOpenCreate('propose')}
              className="px-4 py-2.5 bg-[#67B7E8] text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{t.opportunities.proposeBtn}</span>
            </button>
            <button
              onClick={() => handleOpenCreate('search')}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.opportunities.searchBtn}</span>
            </button>
          </div>
        </div>
        {/* Abstract background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#67B7E8]/5 rounded-full -mr-20 -mt-20 blur-3xl" />
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#19344A] p-2 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
        <div className="flex rounded-xl bg-[#FAF9F6] dark:bg-[#111315]/30 p-1">
          <button
            onClick={() => setActiveMainTab('propose_service')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'propose_service'
                ? 'bg-white dark:bg-[#19344A] text-[#67B7E8] shadow-sm'
                : 'text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeMainTab === 'propose_service' ? 'text-[#67B7E8]' : 'text-[#6F7B85]'}`} />
            <span>{t.opportunities.tabPropose} ({opportunities.filter(o => o.type === 'service' || o.type === 'volunteer').length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('search_need')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'search_need'
                ? 'bg-white dark:bg-[#19344A] text-[#67B7E8] shadow-sm'
                : 'text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white'
            }`}
          >
            <Search className={`w-4 h-4 ${activeMainTab === 'search_need' ? 'text-[#67B7E8]' : 'text-[#6F7B85]'}`} />
            <span>{t.opportunities.tabSearch} ({opportunities.filter(o => o.type === 'skill_request' || o.type === 'job').length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('talents')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'talents'
                ? 'bg-white dark:bg-[#19344A] text-[#67B7E8] shadow-sm'
                : 'text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white'
            }`}
          >
            <Users className={`w-4 h-4 ${activeMainTab === 'talents' ? 'text-[#67B7E8]' : 'text-[#6F7B85]'}`} />
            <span>{t.opportunities.tabTalents} ({talents.length})</span>
          </button>
        </div>

        <button
          onClick={() => handleOpenCreate(activeMainTab === 'search_need' ? 'search' : 'propose')}
          className="px-4 py-2 bg-[#19344A] hover:bg-[#111315] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{activeMainTab === 'search_need' ? t.opportunities.publishNeed : t.opportunities.publishAnnouncement}</span>
        </button>
      </div>

      {/* Search Bar & Quick Skill Chips */}
      <div className="space-y-4 bg-white dark:bg-[#19344A] p-5 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-[#6F7B85] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.opportunities.searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#67B7E8]/10 focus:border-[#67B7E8] bg-[#FAF9F6] dark:bg-[#111315]/30 dark:text-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3.5 text-xs text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white font-bold"
            >
              {t.opportunities.clear}
            </button>
          )}
        </div>

        {/* Popular skill pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[#6F7B85] font-semibold text-[11px] mr-1">{t.opportunities.suggestions}</span>
          {POPULAR_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => setSearchQuery(skill === searchQuery ? '' : skill)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                searchQuery.toLowerCase() === skill.toLowerCase()
                  ? 'bg-[#67B7E8] text-white font-bold shadow-sm'
                  : 'bg-[#FAF9F6] dark:bg-[#111315]/50 hover:bg-[#E8E4D9] dark:hover:bg-[#111315] text-[#19344A] dark:text-[#FAF9F6]/70 border border-[#E8E4D9] dark:border-transparent'
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
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#67B7E8] text-white shadow-sm scale-105'
                    : 'bg-[#FAF9F6] dark:bg-[#111315]/30 hover:bg-[#E8E4D9] dark:hover:bg-[#111315] text-[#19344A] dark:text-[#FAF9F6]/70 border border-[#E8E4D9] dark:border-[#67B7E8]/10'
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
            <div key={i} className="h-48 bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 rounded-2xl animate-pulse p-5" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white dark:bg-[#19344A] rounded-2xl border border-[#19344A]/10 space-y-3">
          <AlertCircle className="w-8 h-8 text-[#67B7E8] mx-auto" />
          <p className="text-sm font-bold text-[#19344A] dark:text-white">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#FAF9F6] dark:bg-[#111315]/50 hover:bg-[#E8E4D9] dark:hover:bg-[#111315] text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t.opportunities.retry}
          </button>
        </div>
      ) : activeMainTab === 'talents' ? (
        /* Talents / Member Profiles Grid */
        filteredTalents.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#19344A] rounded-3xl border border-dashed border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-3">
            <Users className="w-10 h-10 text-[#6F7B85] mx-auto" />
            <h3 className="text-base font-bold text-[#19344A] dark:text-white">{t.opportunities.noTalentsTitle}</h3>
            <p className="text-xs text-[#6F7B85] max-w-md mx-auto">
              {t.opportunities.noTalentsSubtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTalents.map((talent) => (
              <div
                key={talent.userId}
                onClick={() => setSelectedProfile(talent)}
                className="bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#FAF9F6] dark:bg-[#111315]/30 text-[#67B7E8] flex items-center justify-center font-bold text-base overflow-hidden shrink-0 border border-[#E8E4D9] dark:border-[#67B7E8]/20">
                      {talent.photoUrl ? (
                        <img src={talent.photoUrl} alt={talent.displayName} className="w-full h-full object-cover" />
                      ) : (
                        talent.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[#111315] dark:text-white truncate group-hover:text-[#67B7E8] transition-colors">
                        {talent.displayName}
                      </h3>
                      {talent.professionalTitle && (
                        <p className="text-xs font-semibold text-[#67B7E8] truncate">
                          {talent.professionalTitle}
                        </p>
                      )}
                      {talent.location && (
                        <p className="text-[11px] text-[#6F7B85] flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3" /> {talent.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {talent.bio && (
                    <p className="text-xs text-[#6F7B85] line-clamp-2 mb-3 leading-relaxed">
                      {talent.bio}
                    </p>
                  )}

                  {/* Skills tags */}
                  {talent.skills && talent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {talent.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#19344A] dark:text-[#FAF9F6]/70 text-[10px] font-medium border border-[#E8E4D9] dark:border-transparent"
                        >
                          {skill}
                        </span>
                      ))}
                      {talent.skills.length > 4 && (
                        <span className="text-[10px] text-[#6F7B85] font-medium self-center">
                          +{talent.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 flex items-center justify-between text-xs font-bold text-[#67B7E8]">
                  <span>{t.opportunities.viewProfile}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Opportunities List Grid */
        filteredOpportunities.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#19344A] rounded-3xl border border-dashed border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-3">
            <Briefcase className="w-10 h-10 text-[#6F7B85] mx-auto" />
            <h3 className="text-base font-bold text-[#111315] dark:text-white">
              {activeMainTab === 'propose_service'
                ? t.opportunities.noOfferTitle
                : t.opportunities.noSearchTitle}
            </h3>
            <p className="text-xs text-[#6F7B85] max-w-md mx-auto">
              {t.opportunities.noAnnouncementSubtitle}
            </p>
            <button
              onClick={() => handleOpenCreate(activeMainTab === 'search_need' ? 'search' : 'propose')}
              className="px-5 py-2.5 bg-[#67B7E8] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-colors inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t.opportunities.publishFirst}</span>
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
              <div className="flex justify-center pt-6 pb-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:border-[#67B7E8] text-[#19344A] dark:text-white text-xs font-bold rounded-2xl transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  {loadingMore ? (
                    <span>{t.opportunities.loadingMore}</span>
                  ) : (
                    <>
                      <span>{t.opportunities.loadMore}</span>
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
