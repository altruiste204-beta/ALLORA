import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  fetchChurchMembers,
  requestToJoinChurch,
  updateMemberStatus,
  updateMemberRole,
  leaveChurch,
  joinChurchWithCode,
  getChurchJoinCode
} from '../../supabase/services/dataService';
import { getHumanErrorMessage } from '../../supabase/errors';
import { Church, ChurchMember } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ChurchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  church: Church;
  onStateChange?: () => void; // call to refresh parent view
}

export const ChurchDetailModal: React.FC<ChurchDetailModalProps> = ({
  isOpen,
  onClose,
  church,
  onStateChange
}) => {
  const { user, memberships, refreshMemberships } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'about' | 'members' | 'future'>('about');
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showJoinCodeInput, setShowJoinCodeInput] = useState(false);
  const [manualJoinCode, setManualJoinCode] = useState('');
  const [leaderJoinCode, setLeaderJoinCode] = useState<string | null>(null);

  // Find user's relationship with this church
  const myMembership = memberships.find(m => m.churchId === church.churchId);
  const isApprovedMember = myMembership?.status === 'approved';
  const isPendingMember = myMembership?.status === 'pending';
  const myRole = myMembership?.role;
  const isLeader = Boolean(myRole === 'OWNER' || myRole === 'ADMIN');

  useEffect(() => {
    let cancelled = false;
    if (isOpen && isLeader) {
      getChurchJoinCode(church.churchId)
        .then(code => { if (!cancelled) setLeaderJoinCode(code); })
        .catch(() => { if (!cancelled) setLeaderJoinCode(null); });
    } else {
      setLeaderJoinCode(null);
    }
    return () => { cancelled = true; };
  }, [isOpen, isLeader, church.churchId]);

  // Load members of this church
  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const list = await fetchChurchMembers(church.churchId);
      setMembers(list);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      setErrorMsg(null);
      setShowJoinCodeInput(false);
      setManualJoinCode('');
    }
  }, [isOpen, church.churchId]);

  const handleRequestJoin = async () => {
    if (!user) {
      setErrorMsg('Veuillez vous connecter pour faire une demande d\'adhésion.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await requestToJoinChurch(church.churchId, {
        uid: user.uid,
        displayName: user.displayName || 'Membre ALLORA',
        email: user.email || ''
      });
      await refreshMemberships();
      await loadMembers();
      if (onStateChange) onStateChange();
    } catch (err) {
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualJoinCode.trim()) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      await joinChurchWithCode(church.churchId, manualJoinCode.trim().toUpperCase(), {
        uid: user.uid,
        displayName: user.displayName || 'Membre ALLORA',
        email: user.email || ''
      });
      await refreshMemberships();
      await loadMembers();
      setShowJoinCodeInput(false);
      setManualJoinCode('');
      if (onStateChange) onStateChange();
    } catch (err) {
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveChurch = async () => {
    if (!user) return;
    const confirmLeave = window.confirm('Voulez-vous vraiment quitter cette église ?');
    if (!confirmLeave) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      await leaveChurch(church.churchId, user.uid);
      await refreshMemberships();
      await loadMembers();
      if (onStateChange) onStateChange();
    } catch (err) {
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // OWNER/ADMIN actions on other members
  const handleApproveMember = async (member: ChurchMember) => {
    setActionLoading(true);
    try {
      await updateMemberStatus(member.membershipId, 'approved', church.churchId, member.userId, church.name);
      await loadMembers();
    } catch (err) {
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectMember = async (member: ChurchMember) => {
    setActionLoading(true);
    try {
      await updateMemberStatus(member.membershipId, 'rejected', church.churchId, member.userId, church.name);
      await loadMembers();
    } catch (err) {
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (member: ChurchMember) => {
    const confirmRemove = window.confirm(`Voulez-vous vraiment retirer ${member.displayName} de l'église ?`);
    if (!confirmRemove) return;

    setActionLoading(true);
    try {
      await updateMemberStatus(member.membershipId, 'removed', church.churchId, member.userId, church.name);
      await loadMembers();
    } catch (err) {
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdminRole = async (member: ChurchMember) => {
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setActionLoading(true);
    try {
      await updateMemberRole(member.membershipId, newRole, church.churchId, member.userId, church.name);
      await loadMembers();
    } catch (err) {
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Group members by status
  const pendingRequests = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'approved');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Cover Header Banner */}
        <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#19344A] to-[#67B7E8]/40 border border-[#E8E4D9]/60 flex items-center justify-center">
          {/* Node pattern overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="30" r="4" fill="#FFFFFF" />
              <circle cx="150" cy="80" r="6" fill="#FFFFFF" />
              <circle cx="280" cy="40" r="4.5" fill="#FFFFFF" />
              <line x1="50" y1="30" x2="150" y2="80" stroke="#FFFFFF" strokeWidth="0.8" />
              <line x1="150" y1="80" x2="280" y2="40" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="3 3" />
            </svg>
          </div>
          
          <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-2xl bg-white dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 shadow-xs flex items-center justify-center text-xl font-bold text-[#19344A] dark:text-white">
            {church.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Name and Basic Metadata */}
        <div className="pt-2 pl-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-extrabold text-[#19344A] dark:text-white tracking-tight">
              {church.name}
            </h1>
            {church.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF9F6] dark:bg-blue-900/20 border border-[#67B7E8] dark:border-[#67B7E8]/30 text-[10px] font-bold text-[#19344A] dark:text-[#DCEFFA] uppercase tracking-wide">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Vérifiée</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#19344A]/60 dark:text-[#FAF9F6]/70 mt-0.5 font-semibold">
            {church.city}, {church.country}
          </p>
        </div>

        {/* Member Status Action Bar */}
        <div className="p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9]/80 dark:border-[#67B7E8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#19344A]/50 dark:text-[#FAF9F6]/70">Votre statut</span>
            <div className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 mt-0.5">
              {isApprovedMember ? (
                <span className="text-[#19344A] dark:text-white flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#67B7E8" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Membre actif ({myRole === 'OWNER' ? 'Propriétaire' : myRole === 'ADMIN' ? 'Administrateur' : 'Membre'})
                </span>
              ) : isPendingMember ? (
                <span className="text-[#19344A]/70 dark:text-[#FAF9F6]/70 flex items-center gap-1">
                  <svg className="animate-pulse" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  Demande d'adhésion en attente d'approbation
                </span>
              ) : (
                <span>Non membre</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isApprovedMember && !isPendingMember && (
              <>
                <button
                  onClick={() => setShowJoinCodeInput(!showJoinCodeInput)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] hover:bg-[#FAF9F6] dark:hover:bg-#1D334D text-xs font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 transition-all cursor-pointer"
                >
                  Saisir un code
                </button>
                <button
                  onClick={handleRequestJoin}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-[#19344A] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-[#111315] dark:hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Envoi...' : 'Demander à rejoindre'}
                </button>
              </>
            )}

            {isApprovedMember && myRole !== 'OWNER' && (
              <button
                onClick={handleLeaveChurch}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-xl border border-[#19344A]/20 dark:border-[#19344A]/30 hover:border-[#19344A]/40 dark:hover:border-[#19344A]/50 text-xs font-semibold text-[#19344A]/80 dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-[#19344A] transition-all cursor-pointer"
              >
                {actionLoading ? 'Traitement...' : 'Quitter l\'église'}
              </button>
            )}
          </div>
        </div>

        {/* Join code entry form if clicked */}
        {showJoinCodeInput && (
          <form onSubmit={handleJoinWithCode} className="p-3.5 rounded-2xl bg-white dark:bg-[#1D334D] border border-[#67B7E8] dark:border-[#67B7E8]/50 space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                Saisissez le code d'adhésion de l'église
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualJoinCode}
                  onChange={(e) => setManualJoinCode(e.target.value)}
                  placeholder="Ex. ALLORA-7K4P2"
                  required
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#19344A] text-xs text-[#111315] dark:text-white font-mono tracking-wider focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-[#19344A] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-[#111315] dark:hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Rejoindre
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-[#E8E4D9]/60 dark:border-[#67B7E8]/10">
          <button
            onClick={() => setActiveSubTab('about')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'about'
                ? 'border-[#19344A] dark:border-[#67B7E8] text-[#19344A] dark:text-white'
                : 'border-transparent text-[#19344A]/55 dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-white'
            }`}
          >
            Présentation
          </button>
          
          {isApprovedMember && (
            <button
              onClick={() => setActiveSubTab('members')}
              className={`px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'members'
                  ? 'border-[#19344A] dark:border-[#67B7E8] text-[#19344A] dark:text-white'
                  : 'border-transparent text-[#19344A]/55 dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-white'
              }`}
            >
              Membres ({activeMembers.length})
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('future')}
            className="px-4 py-2 text-xs font-bold text-[#19344A]/35 dark:text-[#FAF9F6]/70 cursor-not-allowed"
            title="Besoins, ressources, collaborations et événements seront déployés prochainement."
          >
            Besoins & Ressources (À venir)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#19344A]/20 border border-[#19344A]/30 dark:border-[#19344A]/30 text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {activeSubTab === 'about' && (
            <div className="space-y-4 text-xs sm:text-sm text-[#19344A]/80 dark:text-[#FAF9F6]/70 leading-relaxed">
              {church.description ? (
                <p>{church.description}</p>
              ) : (
                <p className="italic text-[#19344A]/50 dark:text-[#FAF9F6]/70">Aucune description disponible pour cette église.</p>
              )}

              <div className="bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-4 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#67B7E8]/20 space-y-2.5">
                <h4 className="text-xs font-bold text-[#19344A] dark:text-white uppercase tracking-wider mb-1">Informations pratiques</h4>
                
                {church.address && (
                  <p><strong>Adresse :</strong> {church.address}</p>
                )}
                {church.contactPhone && (
                  <p><strong>Téléphone :</strong> {church.contactPhone}</p>
                )}
                {church.contactEmail && (
                  <p><strong>Email :</strong> {church.contactEmail}</p>
                )}
                {church.website && (
                  <p><strong>Site web :</strong> <a href={church.website} target="_blank" rel="noopener noreferrer" className="text-[#67B7E8] font-bold hover:underline">{church.website}</a></p>
                )}
                {church.denomination && (
                  <p><strong>Dénomination :</strong> {church.denomination}</p>
                )}
                {church.foundedYear && (
                  <p><strong>Fondée en :</strong> {church.foundedYear}</p>
                )}
              </div>

              {/* Display code only to church leaders */}
              {isLeader && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1D334D] border border-[#67B7E8] dark:border-[#67B7E8]/50 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#19344A]/50 dark:text-[#FAF9F6]/70">Espace Responsable</span>
                  <p className="text-xs text-[#19344A]/80 dark:text-[#FAF9F6]/70 font-medium">Partagez ce code secret pour approuver directement de nouveaux membres :</p>
                  <p className="text-sm font-bold font-mono text-[#19344A] dark:text-white tracking-wider bg-[#FAF9F6] dark:bg-[#19344A] inline-block px-3 py-1.5 rounded-lg border border-[#E8E4D9] dark:border-[#67B7E8]/20 mt-1.5">
                    {leaderJoinCode || '••••••••••'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'members' && isApprovedMember && (
            <div className="space-y-4">
              {loadingMembers ? (
                <LoadingSpinner text="Chargement des membres de la communauté..." />
              ) : (
                <div className="space-y-4">
                  {/* Pending requests for Owners/Admins */}
                  {isLeader && pendingRequests.length > 0 && (
                    <div className="space-y-2.5 bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-3.5 rounded-2xl border border-[#19344A]/20 dark:border-[#67B7E8]/20">
                      <h4 className="text-xs font-bold text-[#19344A] dark:text-white uppercase tracking-wider">
                        Demandes d'adhésion ({pendingRequests.length})
                      </h4>
                      <div className="divide-y divide-[#E8E4D9]/60 dark:divide-#253C5A">
                        {pendingRequests.map(req => (
                          <div key={req.membershipId} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3">
                            <div>
                              <p className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{req.displayName}</p>
                              <p className="text-[10px] text-[#19344A]/60 dark:text-[#FAF9F6]/70">{req.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRejectMember(req)}
                                className="px-2.5 py-1 rounded-lg border border-[#19344A]/20 dark:border-slate-600 text-[10px] font-bold text-[#19344A]/70 dark:text-[#FAF9F6]/70 hover:bg-white dark:hover:bg-#1D334D cursor-pointer transition-colors"
                              >
                                Refuser
                              </button>
                              <button
                                onClick={() => handleApproveMember(req)}
                                className="px-3 py-1 rounded-lg bg-[#19344A] dark:bg-blue-600 text-white text-[10px] font-bold hover:bg-[#111315] dark:hover:bg-blue-700 cursor-pointer shadow-2xs transition-all"
                              >
                                Accepter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active members list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#19344A] dark:text-white uppercase tracking-wider">
                      Membres de l'église
                    </h4>
                    <div className="divide-y divide-[#E8E4D9]/60 dark:divide-#253C5A max-h-60 overflow-y-auto pr-1">
                      {activeMembers.map(member => {
                        const isMemberOwner = member.role === 'OWNER';
                        const isSelf = member.userId === user?.uid;

                        return (
                          <div key={member.membershipId} className="flex items-center justify-between py-2.5">
                            <div>
                              <p className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70">
                                {member.displayName} {isSelf && <span className="text-[10px] font-normal text-[#19344A]/60 dark:text-[#FAF9F6]/70">(Vous)</span>}
                              </p>
                              <p className="text-[10px] text-[#19344A]/60 dark:text-[#FAF9F6]/70">
                                {isMemberOwner ? 'Propriétaire' : member.role === 'ADMIN' ? 'Administrateur' : 'Membre'} • Arrivé le {new Date(member.joinedAt).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Leader administrative controls */}
                            {isLeader && !isMemberOwner && !isSelf && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleAdminRole(member)}
                                  className="px-2 py-1 rounded-lg border border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D text-[10px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 transition-colors"
                                  title={member.role === 'ADMIN' ? 'Retirer les droits administrateur' : 'Nommer administrateur'}
                                >
                                  {member.role === 'ADMIN' ? 'Rétrograder' : 'Promouvoir'}
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(member)}
                                  className="p-1.5 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-#1D334D text-[#19344A]/60 dark:text-[#FAF9F6]/70 hover:text-[#111315] dark:hover:text-white transition-colors"
                                  title="Retirer de l'église"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'future' && (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-center justify-center mx-auto text-[#19344A]/40 dark:text-[#FAF9F6]/70">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.67l7.65-7.66.77-.78a5.4 5.4 0 0 0 0-7.65z" />
                </svg>
              </div>
              <h4 className="text-xs font-bold text-[#19344A] dark:text-white">Besoins et Ressources d'Église</h4>
              <p className="text-[11px] text-[#19344A]/60 dark:text-[#FAF9F6]/70 max-w-sm mx-auto leading-relaxed">
                Cette section permettra d'associer directement des besoins matériels, des partages de locaux ou des appels de service à la communauté locale.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
