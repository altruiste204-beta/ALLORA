import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { i18n } from '../../i18n';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  fetchChurches, 
  fetchCollaborations, 
  updateCollaborationStatus 
} from '../../firebase/services/dataService';
import { ChurchDetailModal } from '../churches/ChurchDetailModal';
import { Church, Collaboration, CollaborationStatus, ActiveTab } from '../../types';

interface ProfileViewProps {
  onOpenAuth: () => void;
  onOpenEditProfile: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenAuth,
  onOpenEditProfile,
  onNavigateTab
}) => {
  const { user, profile, memberships, notifications, refreshNotifications, signOut } = useAuth();
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [loadingChurch, setLoadingChurch] = useState(false);

  // Collaborations State
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(false);
  const [collabTab, setCollabTab] = useState<'pending' | 'active' | 'completed' | 'cancelled'>('pending');
  const [collabError, setCollabError] = useState<string | null>(null);

  const loadCollaborations = async () => {
    if (!user) return;
    setLoadingCollabs(true);
    setCollabError(null);
    try {
      const list = await fetchCollaborations(100, user.uid);
      setCollaborations(list);
    } catch (err: any) {
      setCollabError(err.message || 'Erreur lors du chargement des collaborations.');
    } finally {
      setLoadingCollabs(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCollaborations();
    }
  }, [user]);

  const handleUpdateStatus = async (collabId: string, newStatus: CollaborationStatus) => {
    if (!user) return;
    setCollabError(null);
    try {
      await updateCollaborationStatus(collabId, newStatus, user.uid);
      await loadCollaborations();
    } catch (err: any) {
      setCollabError(err.message || 'Erreur lors de la mise à jour de la collaboration.');
    }
  };

  // Opens a church from a membership
  const handleOpenChurch = async (churchId: string) => {
    setLoadingChurch(true);
    try {
      const list = await fetchChurches();
      const match = list.find(c => c.churchId === churchId);
      if (match) {
        setSelectedChurch(match);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingChurch(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    await refreshNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
    await refreshNotifications();
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      handleMarkRead(notif.notificationId);
    }

    if (notif.type === 'community' || notif.type === 'info') {
      onNavigateTab('community');
    } else if (notif.type === 'opportunities') {
      onNavigateTab('opportunities');
    } else if (notif.type === 'events') {
      onNavigateTab('events');
    } else if (notif.type === 'needs') {
      onNavigateTab('needs');
    } else if (notif.type === 'resources') {
      onNavigateTab('resources');
    } else if (notif.type === 'collaborations') {
      // Stay on profile as collab dashboard is here
    } else if (notif.churchId) {
      handleOpenChurch(notif.churchId);
    }
  };

  if (!user) {
    return (
      <div className="rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center mx-auto mb-5 text-[#19344A]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-[#19344A] tracking-tight mb-2">
          {i18n.profile.unauthenticatedTitle}
        </h2>

        <p className="text-sm text-[#19344A]/70 leading-relaxed mb-6">
          {i18n.profile.unauthenticatedSubtitle}
        </p>

        <button
          onClick={onOpenAuth}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#19344A] text-[#FFFFFF] text-sm font-semibold hover:bg-[#111315] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <span>{i18n.actions.signIn} / {i18n.actions.signUp}</span>
        </button>
      </div>
    );
  }

  // Active or pending user memberships
  const approvedMemberships = memberships.filter(m => m.status === 'approved');
  const pendingMemberships = memberships.filter(m => m.status === 'pending');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Notifications Inbox / Alerts Panel */}
      {notifications.length > 0 && (
        <div className="rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E4D9]/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {notifications.some(n => !n.read) && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67B7E8] opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#67B7E8]"></span>
              </span>
              <h2 className="text-sm font-extrabold uppercase text-[#19344A] tracking-wider">
                Notifications ({notifications.filter(n => !n.read).length} non lues)
              </h2>
            </div>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-[#67B7E8] hover:underline cursor-pointer"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-[#E8E4D9]/40">
            {notifications.map((notif) => (
              <div
                key={notif.notificationId}
                onClick={() => handleNotificationClick(notif)}
                className={`pt-3 first:pt-0 flex items-start justify-between gap-4 text-xs transition-all cursor-pointer hover:bg-[#FAF9F6]/50 p-2 rounded-xl group ${
                  !notif.read ? 'bg-[#FAF9F6] border-l-2 border-[#67B7E8]' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${!notif.read ? 'text-[#19344A]' : 'text-[#19344A]/60'}`}>
                      {notif.title}
                    </span>
                    <span className="text-[9px] text-[#19344A]/40 font-medium">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`leading-relaxed ${!notif.read ? 'text-[#19344A]/80' : 'text-[#19344A]/50'}`}>
                    {notif.body}
                  </p>
                  {notif.churchName && (
                    <span className="text-[10px] font-bold text-[#67B7E8]/80">
                      {notif.churchName}
                    </span>
                  )}
                </div>

                {!notif.read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#67B7E8] mt-2 shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-[#E8E4D9]/60">
          <div className="w-20 h-20 rounded-full bg-[#19344A] text-[#FAF9F6] flex items-center justify-center text-2xl font-bold shrink-0 shadow-xs">
            {profile?.displayName
              ? profile.displayName.charAt(0).toUpperCase()
              : user.email?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#19344A] tracking-tight">
                  {profile?.displayName || user.displayName || 'Membre ALLORA'}
                </h1>
                {profile?.professionalTitle && (
                  <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                    {profile.professionalTitle}
                  </p>
                )}
                <p className="text-xs text-[#19344A]/60 mt-0.5">
                  {user.email}
                </p>
              </div>

              <button
                onClick={onOpenEditProfile}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] hover:bg-[#E8E4D9]/40 text-xs font-semibold text-[#19344A] transition-all cursor-pointer shadow-2xs"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <span>{i18n.actions.editProfile}</span>
              </button>
            </div>

            {profile?.location && (
              <div className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#19344A]/70 font-medium">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{profile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="py-5 border-b border-[#E8E4D9]/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#19344A]/60 mb-2">
            {i18n.profile.bio}
          </h3>
          <p className="text-sm text-[#19344A]/80 leading-relaxed">
            {profile?.bio || i18n.profile.noBio}
          </p>
        </div>

        {/* Availability */}
        <div className="py-5 border-b border-[#E8E4D9]/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#19344A]/60 mb-2">
            {i18n.profile.availability}
          </h3>
          <p className="text-sm text-[#19344A]/80">
            {profile?.availability || 'Non précisée'}
          </p>
        </div>

        {/* Skills & Resources */}
        <div className="py-5 border-b border-[#E8E4D9]/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#19344A]/60 mb-2">
            Compétences & Domaines
          </h3>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E4D9] text-xs font-medium text-[#19344A]"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#19344A]/60 italic">
              {i18n.profile.noSkills}
            </p>
          )}
        </div>

        {/* Services proposés */}
        {profile?.servicesOffered && profile.servicesOffered.length > 0 && (
          <div className="py-5 border-b border-[#E8E4D9]/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#19344A]/60 mb-2">
              Services proposés
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.servicesOffered.map((srv) => (
                <span
                  key={srv}
                  className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800"
                >
                  {srv}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Attached Churches */}
        <div className="pt-5 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#19344A]/60 mb-3">
            {i18n.profile.churches}
          </h3>
          
          {approvedMemberships.length === 0 && pendingMemberships.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[#19344A]/60 italic">
                {i18n.profile.noChurches}
              </p>
              <button
                onClick={() => onNavigateTab('churches')}
                className="text-xs font-bold text-[#19344A] hover:text-[#111315] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Rechercher une église</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Approved churches */}
              {approvedMemberships.map(member => (
                <div
                  key={member.membershipId}
                  onClick={() => handleOpenChurch(member.churchId)}
                  className="p-3 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] hover:border-[#19344A]/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#19344A]">{member.churchName}</h4>
                    <p className="text-[10px] text-[#19344A]/60 capitalize">Rôle : {member.role?.toLowerCase()}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#67B7E8] inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-all">
                    <span>Consulter</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              ))}

              {/* Pending approvals */}
              {pendingMemberships.map(member => (
                <div
                  key={member.membershipId}
                  onClick={() => handleOpenChurch(member.churchId)}
                  className="p-3 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6]/50 hover:border-[#19344A]/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#19344A]/85">{member.churchName}</h4>
                    <p className="text-[10px] text-[#19344A]/50 italic">Demande d'adhésion en attente d'approbation</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#19344A]/40 inline-flex items-center gap-1 group-hover:text-[#19344A] transition-colors">
                    <span>Voir</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="mt-6 pt-4 border-t border-[#E8E4D9] flex justify-end">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#19344A]/70 hover:text-[#19344A] hover:bg-[#FAF9F6] transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{i18n.actions.signOut}</span>
          </button>
        </div>
      </div>

      {/* Collaborations Dashboard */}
      <div className="rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#E8E4D9]/60 pb-4">
          <h2 className="text-lg font-bold text-[#19344A] tracking-tight">
            Mes collaborations
          </h2>
          <p className="text-xs text-[#19344A]/60 mt-1">
            Suivez et gérez l'avancement de vos partages de ressources et entraides.
          </p>
        </div>

        {collabError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            {collabError}
          </div>
        )}

        {/* Status sub-tabs */}
        <div className="flex border-b border-[#E8E4D9]/40 gap-1 overflow-x-auto pb-1">
          {[
            { id: 'pending', label: 'À confirmer', statuses: ['proposed'] },
            { id: 'active', label: 'En cours', statuses: ['accepted', 'active'] },
            { id: 'completed', label: 'Terminées', statuses: ['completed'] },
            { id: 'cancelled', label: 'Annulées', statuses: ['cancelled', 'rejected'] }
          ].map(tab => {
            const count = collaborations.filter(c => tab.statuses.includes(c.status)).length;
            const isActive = collabTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCollabTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#19344A] text-white'
                    : 'text-[#19344A]/60 hover:text-[#19344A] hover:bg-[#FAF9F6]'
                }`}
              >
                {tab.label} {count > 0 && <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-[10px] rounded-full">{count}</span>}
              </button>
            );
          })}
        </div>

        {loadingCollabs ? (
          <div className="py-8 text-center text-xs text-[#19344A]/50">
            Chargement de vos collaborations...
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const activeTabConfig = {
                pending: ['proposed'],
                active: ['accepted', 'active'],
                completed: ['completed'],
                cancelled: ['cancelled', 'rejected']
              };
              const filtered = collaborations.filter(c => activeTabConfig[collabTab].includes(c.status));

              if (filtered.length === 0) {
                return (
                  <p className="text-sm text-[#19344A]/60 text-center py-6 italic">
                    Aucune collaboration dans cette catégorie pour le moment.
                  </p>
                );
              }

              return filtered.map(collab => {
                const isUserNeedOwner = collab.needOwnerId === user.uid;
                const partnerName = isUserNeedOwner 
                  ? collab.resourceOwnerName || 'Propriétaire ressource'
                  : collab.needOwnerName || 'Auteur du besoin';
                const roleLabel = isUserNeedOwner ? "Demandeur" : "Fournisseur";

                return (
                  <div key={collab.collaborationId} className="p-4 rounded-2xl border border-[#E8E4D9] bg-[#FAF9F6] space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-2 ${
                          isUserNeedOwner ? 'bg-[#E0F2FE] text-[#0369A1]' : 'bg-[#FEF3C7] text-[#D97706]'
                        }`}>
                          {roleLabel}
                        </span>
                        <h4 className="text-sm font-bold text-[#19344A]">{collab.needTitle}</h4>
                        <p className="text-xs text-[#19344A]/70 mt-1">
                          Ressource : <span className="font-semibold">{collab.resourceTitle}</span>
                        </p>
                      </div>

                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                        collab.status === 'proposed' ? 'bg-amber-100 text-amber-800' :
                        collab.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        collab.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        collab.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {collab.status === 'proposed' ? 'Proposé' :
                         collab.status === 'accepted' ? 'Accepté' :
                         collab.status === 'active' ? 'En cours' :
                         collab.status === 'completed' ? 'Terminé' :
                         collab.status === 'rejected' ? 'Refusé' : 'Annulé'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-[#E8E4D9]/40 pt-2.5 text-xs text-[#19344A]/80">
                      <div>
                        <span className="text-[10px] text-[#19344A]/50 block">Partenaire d'entraide</span>
                        <span className="font-semibold">{partnerName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#19344A]/50 block">Quantité</span>
                        <span className="font-semibold">{collab.quantity} {collab.unit || 'unités'}</span>
                      </div>
                    </div>

                    {collab.message && (
                      <div className="p-2.5 bg-white/75 rounded-xl border border-[#E8E4D9]/40 text-xs text-[#19344A]/80 italic">
                        "{collab.message}"
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[#19344A]/50 pt-1">
                      <span>Créé le : {new Date(collab.createdAt).toLocaleDateString()}</span>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {collab.status === 'proposed' && (
                          <>
                            {((isUserNeedOwner && collab.resourceOwnerId !== user.uid) || (!isUserNeedOwner && collab.needOwnerId !== user.uid)) ? (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(collab.collaborationId, 'accepted')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-all"
                                >
                                  Accepter
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(collab.collaborationId, 'rejected')}
                                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg cursor-pointer transition-all"
                                >
                                  Refuser
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(collab.collaborationId, 'cancelled')}
                                className="px-2.5 py-1 border border-[#E8E4D9] hover:bg-gray-100 text-gray-700 font-bold rounded-lg cursor-pointer transition-all"
                              >
                                Annuler
                              </button>
                            )}
                          </>
                        )}

                        {collab.status === 'accepted' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(collab.collaborationId, 'active')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-all"
                            >
                              Commencer l'échange (Activer)
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(collab.collaborationId, 'cancelled')}
                              className="px-2.5 py-1 text-red-600 hover:underline font-bold rounded-lg cursor-pointer transition-all"
                            >
                              Annuler
                            </button>
                          </>
                        )}

                        {collab.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(collab.collaborationId, 'completed')}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer transition-all"
                            >
                              Marquer comme terminé
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(collab.collaborationId, 'cancelled')}
                              className="px-2.5 py-1 text-red-600 hover:underline font-bold rounded-lg cursor-pointer transition-all"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Church Detail Modal popup */}
      {selectedChurch && (
        <ChurchDetailModal
          isOpen={!!selectedChurch}
          onClose={() => setSelectedChurch(null)}
          church={selectedChurch}
        />
      )}
    </div>
  );
};
