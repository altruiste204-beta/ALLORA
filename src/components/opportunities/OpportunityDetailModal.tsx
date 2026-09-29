import React, { useState, useEffect } from 'react';
import { Opportunity, OpportunityResponse, UserProfile } from '../../types';
import { 
  fetchOpportunityResponses, 
  updateOpportunity, 
  deleteOpportunity, 
  updateOpportunityResponseStatus 
} from '../../supabase/services/dataService';
import { RespondOpportunityModal } from './RespondOpportunityModal';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  MapPin, 
  Church, 
  Calendar, 
  Clock, 
  Tag, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  Share2, 
  UserCheck 
} from 'lucide-react';

interface OpportunityDetailModalProps {
  opportunity: Opportunity;
  currentUser: any;
  userProfile: UserProfile | null;
  onClose: () => void;
  onOpportunityUpdated?: () => void;
  onOpenAuth: () => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  currentUser,
  userProfile,
  onClose,
  onOpportunityUpdated,
  onOpenAuth,
}) => {
  const { t } = useLanguage();
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [responses, setResponses] = useState<OpportunityResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUser && (currentUser.uid === opportunity.authorId || currentUser.id === opportunity.authorId);
  const isOffer = opportunity.type === 'service' || opportunity.type === 'volunteer';

  useEffect(() => {
    if (isOwner) {
      loadResponses();
    }
  }, [opportunity.opportunityId, isOwner]);

  const loadResponses = async () => {
    try {
      setLoadingResponses(true);
      const data = await fetchOpportunityResponses(opportunity.opportunityId);
      setResponses(data);
    } catch (err: any) {
      console.warn('Error loading opportunity responses:', err);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) return;
    try {
      setActionLoading(true);
      await deleteOpportunity(opportunity.opportunityId);
      if (onOpportunityUpdated) onOpportunityUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setActionLoading(true);
      const newStatus = opportunity.status === 'open' ? 'closed' : 'open';
      await updateOpportunity(opportunity.opportunityId, { status: newStatus });
      if (onOpportunityUpdated) onOpportunityUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la mise à jour.');
      setActionLoading(false);
    }
  };

  const handleUpdateResponseStatus = async (responseId: string, status: any) => {
    try {
      await updateOpportunityResponseStatus(responseId, status);
      loadResponses();
    } catch (err: any) {
      console.error('Error updating response status:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-start justify-between gap-4 bg-[#FAF9F6] dark:bg-[#111315]/40">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isOffer
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-[#67B7E8]/15 text-[#19344A] dark:text-[#67B7E8] border border-[#67B7E8]/30'
                  }`}
                >
                  {isOffer ? t.opportunities.tabPropose : t.opportunities.tabSearch}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#111315]/50 text-[#6F7B85] dark:text-[#FAF9F6]/70 text-[10px] font-bold border border-[#E8E4D9] dark:border-transparent">
                  {opportunity.category}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    opportunity.status === 'open'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {opportunity.status === 'open' ? 'Ouverte' : 'Clôturée'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#19344A] dark:text-white">
                {opportunity.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Author card */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#111315]/40 border border-[#E8E4D9] dark:border-[#67B7E8]/10">
              {opportunity.authorPhotoUrl ? (
                <img
                  src={opportunity.authorPhotoUrl}
                  alt={opportunity.authorName || 'Auteur'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#67B7E8]/30 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#67B7E8] text-white flex items-center justify-center text-sm font-black shrink-0">
                  {opportunity.authorName ? opportunity.authorName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#19344A] dark:text-white truncate">
                  {opportunity.authorName || 'Membre ALLORA'}
                </p>
                {opportunity.authorTitle && (
                  <p className="text-[11px] text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate">
                    {opportunity.authorTitle}
                  </p>
                )}
                {opportunity.churchName && (
                  <div className="flex items-center gap-1 text-[11px] text-[#67B7E8] mt-0.5 truncate">
                    <Church className="w-3 h-3" />
                    <span>{opportunity.churchName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {opportunity.location && (
                <div className="p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 bg-white dark:bg-[#111315]/20 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#67B7E8] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-[#6F7B85]">Lieu</p>
                    <p className="text-xs font-bold text-[#19344A] dark:text-white truncate">{opportunity.location}</p>
                  </div>
                </div>
              )}

              {opportunity.availability && (
                <div className="p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 bg-white dark:bg-[#111315]/20 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#67B7E8] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-[#6F7B85]">Disponibilité</p>
                    <p className="text-xs font-bold text-[#19344A] dark:text-white truncate">{opportunity.availability}</p>
                  </div>
                </div>
              )}

              {opportunity.compensation && (
                <div className="p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 bg-white dark:bg-[#111315]/20 flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-[#67B7E8] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-[#6F7B85]">Modalité</p>
                    <p className="text-xs font-bold text-[#19344A] dark:text-white truncate">{opportunity.compensation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-[#19344A] dark:text-white mb-2">Description</h4>
              <p className="text-xs sm:text-sm text-[#19344A] dark:text-[#FAF9F6]/85 whitespace-pre-line leading-relaxed">
                {opportunity.description}
              </p>
            </div>

            {/* Skills */}
            {opportunity.skills && opportunity.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[#19344A] dark:text-white mb-2">Compétences associées</h4>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-[#67B7E8]/15 text-[#19344A] dark:text-white text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner: List of received responses */}
            {isOwner && (
              <div className="pt-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#19344A] dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#67B7E8]" />
                    <span>Réponses et propositions ({responses.length})</span>
                  </h4>
                </div>

                {loadingResponses ? (
                  <p className="text-xs text-[#6F7B85]">Chargement des réponses...</p>
                ) : responses.length === 0 ? (
                  <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60 italic">
                    Aucune proposition reçue pour l'instant.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {responses.map((resp) => (
                      <div
                        key={resp.responseId}
                        className="p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#111315]/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {resp.responderPhotoUrl ? (
                              <img src={resp.responderPhotoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#67B7E8] text-white flex items-center justify-center text-xs font-black">
                                {resp.responderName?.charAt(0).toUpperCase() || 'R'}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-[#19344A] dark:text-white">{resp.responderName}</p>
                              {resp.responderTitle && <p className="text-[10px] text-[#6F7B85]">{resp.responderTitle}</p>}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            resp.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            resp.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {resp.status}
                          </span>
                        </div>

                        <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/80 leading-relaxed">
                          {resp.message}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E8E4D9]/60 dark:border-white/5 text-[11px]">
                          <div className="flex items-center gap-3 text-[#6F7B85]">
                            {resp.contactEmail && (
                              <a href={`mailto:${resp.contactEmail}`} className="flex items-center gap-1 hover:text-[#67B7E8]">
                                <Mail className="w-3 h-3" />
                                <span>{resp.contactEmail}</span>
                              </a>
                            )}
                            {resp.contactPhone && (
                              <a href={`tel:${resp.contactPhone}`} className="flex items-center gap-1 hover:text-[#67B7E8]">
                                <Phone className="w-3 h-3" />
                                <span>{resp.contactPhone}</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {resp.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateResponseStatus(resp.responseId, 'accepted')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600"
                                >
                                  Accepter
                                </button>
                                <button
                                  onClick={() => handleUpdateResponseStatus(resp.responseId, 'rejected')}
                                  className="px-2.5 py-1 rounded-lg bg-red-100 text-red-600 text-[10px] font-bold hover:bg-red-200"
                                >
                                  Refuser
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#111315]/40 flex items-center justify-between gap-3">
            {isOwner ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#19344A] dark:text-white hover:border-[#67B7E8] cursor-pointer"
                >
                  {opportunity.status === 'open' ? 'Clôturer l\'annonce' : 'Rouvrir l\'annonce'}
                </button>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#6F7B85] hover:bg-black/5 cursor-pointer"
              >
                Fermer
              </button>

              {!isOwner && (
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onOpenAuth();
                    } else {
                      setShowRespondModal(true);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-[#67B7E8] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#67B7E8]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Répondre à l'annonce</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRespondModal && (
        <RespondOpportunityModal
          opportunity={opportunity}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setShowRespondModal(false)}
          onSuccess={() => {
            setShowRespondModal(false);
            if (onOpportunityUpdated) onOpportunityUpdated();
          }}
        />
      )}
    </>
  );
};
