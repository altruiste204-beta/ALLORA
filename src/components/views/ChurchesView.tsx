import React, { useState, useEffect } from 'react';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { fetchChurches } from '../../firebase/services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Church } from '../../types';
import { CreateChurchModal } from '../churches/CreateChurchModal';
import { JoinChurchModal } from '../churches/JoinChurchModal';
import { ChurchDetailModal } from '../churches/ChurchDetailModal';

interface ChurchesViewProps {
  onOpenAuth: () => void;
}

export const ChurchesView: React.FC<ChurchesViewProps> = ({ onOpenAuth }) => {
  const { user, memberships } = useAuth();
  const { t } = useLanguage();
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await fetchChurches();
      setChurches(list);
    } catch (err) {
      console.warn('Churches fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = churches.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.denomination?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    if (!user) {
      onOpenAuth();
    } else {
      setIsCreateOpen(true);
    }
  };

  const handleOpenJoin = () => {
    if (!user) {
      onOpenAuth();
    } else {
      setIsJoinOpen(true);
    }
  };

  const handleChurchCreated = (newId: string) => {
    loadData();
    // Fetch and open the newly created church detail
    const newChurch = churches.find(c => c.churchId === newId);
    if (newChurch) setSelectedChurch(newChurch);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header Box */}
      <div className="rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 20V10l-6-5-6 5v10" />
                <path d="M12 2v3" />
              </svg>
              <span>{t.churches.badge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#19344A] dark:text-white tracking-tight">
              {t.churches.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#19344A]/70 dark:text-[#FAF9F6]/70 max-w-xl">
              {t.churches.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handleOpenJoin}
              className="px-4 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:border-[#19344A]/40 dark:hover:border-[#67B7E8]/40 text-xs font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 bg-white dark:bg-[#1D334D] transition-all cursor-pointer shadow-2xs"
            >
              {t.churches.joinByCode}
            </button>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#19344A] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-[#111315] dark:hover:bg-[#67B7E8] transition-all cursor-pointer shadow-xs"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{t.churches.referenceBtn}</span>
            </button>
          </div>
        </div>

        {/* Global search entry bar */}
        <div className="mt-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#19344A]/50 dark:text-[#FAF9F6]/70">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.churches.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9]/80 dark:border-[#67B7E8]/20 text-xs sm:text-sm text-[#111315] dark:text-[#FAF9F6]/70 placeholder:text-[#19344A]/40 dark:placeholder:text-[#19344A] focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
          />
        </div>
      </div>

      {/* Grid of churches */}
      {loading ? (
        <LoadingSpinner text={t.churches.loading} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t.churches.emptyTitle}
          description={t.churches.emptySubtitle}
          actionLabel={t.churches.emptyAction}
          onAction={handleOpenCreate}
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[#19344A] dark:text-white">
              <path d="M18 20V10l-6-5-6 5v10" />
              <path d="M12 2v3" />
            </svg>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((church) => {
            const isMyChurch = memberships.some(m => m.churchId === church.churchId && m.status === 'approved');
            
            return (
              <div
                key={church.churchId}
                onClick={() => setSelectedChurch(church)}
                className="p-5 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 hover:border-[#19344A]/40 dark:hover:border-[#67B7E8]/40 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#19344A]/60 dark:text-[#FAF9F6]/70">
                      {church.city}, {church.country}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {isMyChurch && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EAF7F0] border border-[#22A06B]/30 text-[9px] font-bold text-[#22A06B] uppercase tracking-wide">
                          {t.churches.myCommunity}
                        </span>
                      )}
                      {church.verificationStatus === 'verified' && (
                        <span className="w-5 h-5 rounded-full bg-[#EAF7F0] border border-[#22A06B]/30 flex items-center justify-center text-[#22A06B]" title={t.churches.verified}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#19344A] dark:text-white leading-snug group-hover:text-[#111315] dark:group-hover:text-[#67B7E8] transition-colors">
                      {church.name}
                    </h3>
                    {church.denomination && (
                      <p className="text-[11px] text-[#19344A]/60 dark:text-[#FAF9F6]/70 italic mt-0.5">{church.denomination}</p>
                    )}
                  </div>

                  {church.description && (
                    <p className="text-xs text-[#19344A]/70 dark:text-[#FAF9F6]/70 line-clamp-2 leading-relaxed">
                      {church.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E4D9]/40 dark:border-[#67B7E8]/10 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#19344A]/50 dark:text-[#FAF9F6]/70">
                    {church.foundedYear ? `${t.churches.since} ${church.foundedYear}` : t.churches.activeCommunity}
                  </span>
                  <span className="text-xs font-bold text-[#19344A] dark:text-[#67B7E8] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>{t.churches.viewBtn}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Church Modal */}
      <CreateChurchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleChurchCreated}
      />

      {/* Join Church Modal */}
      <JoinChurchModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={(id) => {
          const match = churches.find(c => c.churchId === id);
          if (match) setSelectedChurch(match);
          loadData();
        }}
      />

      {/* Church Detail Modal */}
      {selectedChurch && (
        <ChurchDetailModal
          isOpen={!!selectedChurch}
          onClose={() => setSelectedChurch(null)}
          church={selectedChurch}
          onStateChange={loadData}
        />
      )}
    </div>
  );
};
