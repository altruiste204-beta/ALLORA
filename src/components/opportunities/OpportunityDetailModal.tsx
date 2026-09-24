import React, { useState, useEffect } from 'react';
import { Opportunity, OpportunityResponse, OpportunityResponseStatus, UserProfile } from '../../types';
import { 
  fetchOpportunityResponses, 
  updateOpportunityResponseStatus, 
  updateOpportunity, 
  deleteOpportunity 
} from '../../firebase/services/dataService';
import { RespondOpportunityModal } from './RespondOpportunityModal';
import { 
  X, Briefcase, HeartHandshake, UserCheck, Search, MapPin, Calendar, 
  Building2, User, Tag, Mail, Phone, Clock, CheckCircle2, XCircle, 
  Trash2, AlertCircle, MessageSquarePlus, Share2, Check, Lock, Globe 
} from 'lucide-react';

interface OpportunityDetailModalProps {
  opportunity: Opportunity;
  currentUser: any;
  userProfile: UserProfile | null;
  onClose: () => void;
  onOpportunityUpdated: () => void;
  onOpenAuth: () => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  currentUser,
  userProfile,
  onClose,
  onOpportunityUpdated,
  onOpenAuth
}) => {
  const [responses, setResponses] = useState<OpportunityResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAuthor = currentUser?.uid === opportunity.authorId;

  const loadResponses = async () => {
    if (!isAuthor) return;
    setLoadingResponses(true);
    try {
      const list = await fetchOpportunityResponses(opportunity.opportunityId);
      setResponses(list);
    } catch (err) {
      console.warn('Error loading responses:', err);
    } finally {
      setLoadingResponses(false);
    }
  };

  useEffect(() => {
    if (isAuthor) {
      loadResponses();
    }
  }, [opportunity.opportunityId, isAuthor]);

  const handleResponseStatusChange = async (responseId: string, status: OpportunityResponseStatus, responderId: string) => {
    try {
      await updateOpportunityResponseStatus(responseId, status, responderId, opportunity.title);
      setActionSuccess(`Réponse marquée comme ${status === 'accepted' ? 'acceptée' : 'déclinée'}.`);
      await loadResponses();
      onOpportunityUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleChangeOpportunityStatus = async (newStatus: Opportunity['status']) => {
    if (!currentUser) return;
    setUpdatingStatus(true);
    setActionError(null);
    try {
      await updateOpportunity(opportunity.opportunityId, { status: newStatus }, currentUser.uid);
      setActionSuccess(`Statut mis à jour : ${newStatus}.`);
      onOpportunityUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Impossible de mettre à jour le statut.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;
    setDeleting(true);
    try {
      await deleteOpportunity(opportunity.opportunityId, currentUser.uid);
      onOpportunityUpdated();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la suppression.');
      setDeleting(false);
    }
  };

  const getTypeLabel = (type: Opportunity['type']) => {
    switch (type) {
      case 'service': return { label: 'Service proposé', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'job': return { label: 'Emploi / Mission', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'volunteer': return { label: 'Bénévolat', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'skill_request': return { label: 'Recherche de compétence', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const typeConfig = getTypeLabel(opportunity.type);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeConfig.bg}`}>
                  {typeConfig.label}
                </span>
                <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {opportunity.category}
                </span>
                {opportunity.visibility === 'church' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                    <Lock className="w-3 h-3" /> Membres église
                  </span>
                )}
                {opportunity.visibility === 'public' && (
                  <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-gray-900 leading-snug">
                {opportunity.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {actionSuccess && (
              <div className="p-3.5 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2 border border-green-100">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Author / Church Card */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base overflow-hidden">
                  {opportunity.authorPhotoUrl ? (
                    <img src={opportunity.authorPhotoUrl} alt="Auteur" className="w-full h-full object-cover" />
                  ) : (
                    opportunity.authorName ? opportunity.authorName.charAt(0).toUpperCase() : <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {opportunity.authorName || 'Membre de la communauté'}
                  </h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    {opportunity.churchName && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Building2 className="w-3.5 h-3.5" />
                        {opportunity.churchName}
                      </span>
                    )}
                    {opportunity.authorTitle && <span>• {opportunity.authorTitle}</span>}
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-400">
                Publié le {new Date(opportunity.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>

            {/* Location & Availability Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-100">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Lieu / Modalité</span>
                  <span className="font-semibold text-gray-800">{opportunity.location || 'Non spécifié'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-100">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Disponibilité / Timing</span>
                  <span className="font-semibold text-gray-800">{opportunity.availability || 'À convenir'}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                {opportunity.description}
              </p>
            </div>

            {/* Skills required / offered */}
            {opportunity.skills && opportunity.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Compétences & Domaines clés
                </h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author Responses Management Section */}
            {isAuthor && (
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4 text-primary" />
                    Propositions reçues ({responses.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChangeOpportunityStatus(opportunity.status === 'open' ? 'closed' : 'open')}
                      disabled={updatingStatus}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      {opportunity.status === 'open' ? 'Clôturer l\'annonce' : 'Rouvrir'}
                    </button>
                    {opportunity.status === 'open' && (
                      <button
                        onClick={() => handleChangeOpportunityStatus('filled')}
                        disabled={updatingStatus}
                        className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Marquer pourvue
                      </button>
                    )}
                  </div>
                </div>

                {loadingResponses ? (
                  <div className="text-center py-6 text-xs text-gray-400">Chargement des propositions...</div>
                ) : responses.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
                    Aucune proposition reçue pour le moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {responses.map((resp) => (
                      <div
                        key={resp.responseId}
                        className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                              {resp.responderName ? resp.responderName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900">{resp.responderName}</div>
                              {resp.responderTitle && (
                                <div className="text-[11px] text-gray-500">{resp.responderTitle}</div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              resp.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : resp.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {resp.status === 'accepted'
                              ? 'Acceptée'
                              : resp.status === 'rejected'
                              ? 'Déclinée'
                              : 'En attente'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                          {resp.message}
                        </p>

                        {/* Responder Skills */}
                        {resp.skills && resp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {resp.skills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded-md font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Secure Contact Info */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                          {resp.contactEmail && (
                            <a
                              href={`mailto:${resp.contactEmail}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {resp.contactEmail}
                            </a>
                          )}
                          {resp.contactPhone && (
                            <a
                              href={`tel:${resp.contactPhone}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {resp.contactPhone}
                            </a>
                          )}
                        </div>

                        {/* Status Change Buttons for Author */}
                        {resp.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleResponseStatusChange(resp.responseId, 'accepted', resp.responderId)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Accepter
                            </button>
                            <button
                              onClick={() => handleResponseStatusChange(resp.responseId, 'rejected', resp.responderId)}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs rounded-lg transition-colors"
                            >
                              Décliner
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-100 flex items-center justify-between sticky bottom-0 bg-white">
            {isAuthor ? (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Suppression...' : 'Supprimer l\'annonce'}</span>
              </button>
            ) : (
              <div className="text-xs text-gray-500">
                {opportunity.status !== 'open' ? (
                  <span className="text-amber-600 font-medium">Cette annonce n'accepte plus de propositions.</span>
                ) : (
                  <span>Prêt à collaborer ? Cliquez ci-contre.</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Fermer
              </button>

              {!isAuthor && opportunity.status === 'open' && (
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onOpenAuth();
                    } else {
                      setShowRespondModal(true);
                    }
                  }}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>
                    {opportunity.type === 'service' ? 'Contacter / Demander' : 'Proposer mes services'}
                  </span>
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
            setActionSuccess('Votre proposition a bien été envoyée à l\'auteur !');
          }}
        />
      )}
    </>
  );
};
