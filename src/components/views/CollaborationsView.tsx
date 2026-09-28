import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Collaboration, CollaborationStatus, ActiveTab } from '../../types';
import { fetchCollaborations, updateCollaborationStatus } from '../../supabase/services/dataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface CollaborationsViewProps {
  onOpenAuth: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const CollaborationsView: React.FC<CollaborationsViewProps> = ({ onOpenAuth, onNavigateTab }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | CollaborationStatus>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCollaborations(100, user.uid);
      setCollaborations(list);
    } catch (err: any) {
      console.error('Error fetching collaborations:', err);
      setError(isFr ? 'Erreur lors du chargement des collaborations.' : 'Error loading collaborations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleStatusChange = async (collaborationId: string, newStatus: CollaborationStatus) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setActionLoadingId(collaborationId);
    setError(null);
    setSuccessMessage(null);
    try {
      await updateCollaborationStatus(collaborationId, newStatus, user.uid);
      setSuccessMessage(
        isFr ? 'Statut de la collaboration mis à jour avec succès.' : 'Collaboration status successfully updated.'
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      console.error('Error updating collaboration:', err);
      setError(err.message || (isFr ? 'Erreur lors de la mise à jour.' : 'Error updating status.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCollaborations = collaborations.filter(c => {
    if (activeFilter === 'all') return true;
    return c.status === activeFilter;
  });

  const getStatusBadge = (status: CollaborationStatus) => {
    switch (status) {
      case 'proposed':
        return {
          label: isFr ? 'Proposée' : 'Proposed',
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        };
      case 'accepted':
        return {
          label: isFr ? 'Acceptée' : 'Accepted',
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        };
      case 'active':
        return {
          label: isFr ? 'En cours' : 'Active',
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'completed':
        return {
          label: isFr ? 'Terminée' : 'Completed',
          bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
        };
      case 'cancelled':
        return {
          label: isFr ? 'Annulée' : 'Cancelled',
          bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        };
      case 'rejected':
        return {
          label: isFr ? 'Refusée' : 'Rejected',
          bg: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800'
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
        };
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF6FD] dark:bg-blue-950 text-[#67B7E8] mx-auto flex items-center justify-center shadow-md">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#19344A] dark:text-white">
          {isFr ? 'Mes Collaborations' : 'My Collaborations'}
        </h2>
        <p className="text-sm text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed">
          {isFr
            ? 'Connectez-vous pour suivre vos propositions d\'entraide, acceptations et projets de solidarité inter-églises.'
            : 'Sign in to track your mutual aid proposals, acceptances, and inter-church solidarity projects.'}
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-2xl bg-[#67B7E8] text-white font-bold text-sm shadow-md hover:opacity-90 transition-all cursor-pointer"
        >
          {isFr ? 'Se connecter' : 'Sign In'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111315] dark:text-white tracking-tight">
            {isFr ? 'Mes Collaborations' : 'My Collaborations'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-1">
            {isFr
              ? 'Suivi des partages de ressources, prêts de matériel et actions d\'entraide concrètes.'
              : 'Tracking resource sharing, equipment loans, and practical mutual aid actions.'}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('needs')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#67B7E8] text-white text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{isFr ? 'Explorer les besoins' : 'Explore Needs'}</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {successMessage}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: isFr ? 'Toutes' : 'All', count: collaborations.length },
          { id: 'proposed', label: isFr ? 'Proposées' : 'Proposed', count: collaborations.filter(c => c.status === 'proposed').length },
          { id: 'accepted', label: isFr ? 'Acceptées' : 'Accepted', count: collaborations.filter(c => c.status === 'accepted').length },
          { id: 'active', label: isFr ? 'Actives' : 'Active', count: collaborations.filter(c => c.status === 'active').length },
          { id: 'completed', label: isFr ? 'Terminées' : 'Completed', count: collaborations.filter(c => c.status === 'completed').length },
          { id: 'cancelled', label: isFr ? 'Annulées' : 'Cancelled', count: collaborations.filter(c => c.status === 'cancelled').length },
          { id: 'rejected', label: isFr ? 'Refusées' : 'Rejected', count: collaborations.filter(c => c.status === 'rejected').length }
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#19344A] dark:bg-[#67B7E8] text-white shadow-xs'
                  : 'bg-white dark:bg-[#19344A] text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/10'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-[#FAF9F6] dark:bg-[#1D334D] text-[#6F7B85]'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List / Content */}
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredCollaborations.length === 0 ? (
        <EmptyState
          title={isFr ? 'Aucune collaboration dans cette catégorie' : 'No collaborations in this category'}
          description={
            isFr
              ? 'Répondez à un besoin ou proposez une ressource pour initier une collaboration.'
              : 'Respond to a need or propose a resource to start a collaboration.'
          }
          actionLabel={isFr ? 'Découvrir les besoins' : 'Browse Needs'}
          onAction={() => onNavigateTab('needs')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCollaborations.map((collab) => {
            const badge = getStatusBadge(collab.status);
            const isNeedOwner = collab.needOwnerId === user.uid;
            const isResourceOwner = collab.resourceOwnerId === user.uid;
            const isActionLoading = actionLoadingId === collab.collaborationId;

            return (
              <div
                key={collab.collaborationId}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-[11px] font-bold text-[#6F7B85] dark:text-[#FAF9F6]/60">
                      {new Date(collab.createdAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-[#67B7E8]">
                    {isNeedOwner
                      ? (isFr ? 'Vous êtes l\'auteur du besoin' : 'You are the need author')
                      : isResourceOwner
                      ? (isFr ? 'Vous fournissez la ressource' : 'You provide the resource')
                      : ''}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Need Info */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-wider text-[#6F7B85]">
                      {isFr ? 'Besoin exprimé' : 'Expressed Need'}
                    </p>
                    <p className="text-sm font-black text-[#111315] dark:text-white">
                      {collab.needTitle || collab.title || (isFr ? 'Besoin d\'entraide' : 'Mutual aid need')}
                    </p>
                    {collab.needOwnerName && (
                      <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70">
                        {isFr ? 'Demandé par :' : 'Requested by:'} <span className="font-bold text-[#19344A] dark:text-white">{collab.needOwnerName}</span>
                      </p>
                    )}
                  </div>

                  {/* Resource Info */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-wider text-[#6F7B85]">
                      {isFr ? 'Ressource associée' : 'Associated Resource'}
                    </p>
                    <p className="text-sm font-black text-[#111315] dark:text-white">
                      {collab.resourceTitle || (isFr ? 'Ressource partagée' : 'Shared resource')}
                    </p>
                    {collab.resourceOwnerName && (
                      <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70">
                        {isFr ? 'Fournie par :' : 'Provided by:'} <span className="font-bold text-[#19344A] dark:text-white">{collab.resourceOwnerName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {collab.message && (
                  <div className="p-3.5 rounded-2xl bg-[#EAF6FD]/50 dark:bg-[#1D334D]/30 border border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/80 leading-relaxed italic">
                    "{collab.message}"
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10">
                  {collab.status === 'proposed' && (
                    <>
                      {/* Recipient can accept or reject */}
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleStatusChange(collab.collaborationId, 'accepted')}
                        className="px-4 py-2 rounded-xl bg-[#22A06B] hover:bg-[#1d8a5c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isFr ? 'Accepter la collaboration' : 'Accept Collaboration'}
                      </button>
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleStatusChange(collab.collaborationId, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isFr ? 'Refuser' : 'Decline'}
                      </button>
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleStatusChange(collab.collaborationId, 'cancelled')}
                        className="px-4 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#6F7B85] hover:text-[#19344A] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isFr ? 'Annuler' : 'Cancel'}
                      </button>
                    </>
                  )}

                  {collab.status === 'accepted' && (
                    <>
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleStatusChange(collab.collaborationId, 'active')}
                        className="px-4 py-2 rounded-xl bg-[#67B7E8] hover:bg-[#52a3d4] text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isFr ? 'Démarrer l\'entraide' : 'Start Collaboration'}
                      </button>
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleStatusChange(collab.collaborationId, 'cancelled')}
                        className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isFr ? 'Annuler' : 'Cancel'}
                      </button>
                    </>
                  )}

                  {collab.status === 'active' && (
                    <>
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleStatusChange(collab.collaborationId, 'completed')}
                        className="px-4 py-2 rounded-xl bg-[#22A06B] hover:bg-[#1d8a5c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isFr ? 'Marquer comme terminée' : 'Mark as Completed'}
                      </button>
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleStatusChange(collab.collaborationId, 'cancelled')}
                        className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1D334D] text-[#6F7B85] hover:text-red-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isFr ? 'Interrompre' : 'Interrupt'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
