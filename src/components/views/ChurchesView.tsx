import React, { useState, useEffect } from 'react';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { fetchChurches } from '../../firebase/services/dataService';
import { useAuth } from '../../context/AuthContext';
import { Church } from '../../types';
import { CreateChurchModal } from '../churches/CreateChurchModal';
import { JoinChurchModal } from '../churches/JoinChurchModal';
import { ChurchDetailModal } from '../churches/ChurchDetailModal';

interface ChurchesViewProps {
  onOpenAuth: () => void;
}

export const ChurchesView: React.FC<ChurchesViewProps> = ({ onOpenAuth }) => {
  const { user, memberships } = useAuth();
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
      <div className="rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E4D9] text-[11px] font-semibold text-[#19344A]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 20V10l-6-5-6 5v10" />
                <path d="M12 2v3" />
              </svg>
              <span>Communautés d'églises</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#19344A] tracking-tight">
              Trouvez votre communauté
            </h1>
            <p className="text-xs sm:text-sm text-[#19344A]/70 max-w-xl">
              Découvrez les églises connectées d'ALLORA, partagez avec les membres, et coordonnez les collaborations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handleOpenJoin}
              className="px-4 py-2 rounded-xl border border-[#E8E4D9] hover:border-[#19344A]/40 text-xs font-semibold text-[#19344A] bg-[#FFFFFF] transition-all cursor-pointer shadow-2xs"
            >
              Rejoindre par code
            </button>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#19344A] text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] transition-all cursor-pointer shadow-xs"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Référencer mon église</span>
            </button>
          </div>
        </div>

        {/* Global search entry bar */}
        <div className="mt-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#19344A]/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une église par nom, ville, pays ou dénomination..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9]/80 text-xs sm:text-sm text-[#111315] placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A] transition-all"
          />
        </div>
      </div>

      {/* Grid of churches */}
      {loading ? (
        <LoadingSpinner text="Recherche des communautés locales..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucune église trouvée."
          description="Essayez une autre ville, un autre pays ou un autre nom, ou référencez votre propre église."
          actionLabel="Créer une fiche d'église"
          onAction={handleOpenCreate}
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="1.8">
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
                className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E4D9] hover:border-[#19344A]/40 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#19344A]/60">
                      {church.city}, {church.country}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {isMyChurch && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#67B7E8] text-[9px] font-bold text-[#19344A] uppercase tracking-wide">
                          Ma communauté
                        </span>
                      )}
                      {church.verificationStatus === 'verified' && (
                        <span className="w-5 h-5 rounded-full bg-[#FAF9F6] border border-[#67B7E8] flex items-center justify-center text-[#19344A]" title="Église vérifiée">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#19344A] leading-snug group-hover:text-[#111315] transition-colors">
                      {church.name}
                    </h3>
                    {church.denomination && (
                      <p className="text-[11px] text-[#19344A]/60 italic mt-0.5">{church.denomination}</p>
                    )}
                  </div>

                  {church.description && (
                    <p className="text-xs text-[#19344A]/70 line-clamp-2 leading-relaxed">
                      {church.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E4D9]/40 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#19344A]/50">
                    {church.foundedYear ? `Depuis ${church.foundedYear}` : 'Communauté active'}
                  </span>
                  <span className="text-xs font-bold text-[#19344A] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>Consulter</span>
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
