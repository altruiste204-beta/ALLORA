import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { createOpportunityResponse } from '../../firebase/services/dataService';
import { X, User, Tag, MapPin, Calendar, Briefcase, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProfessionalProfileModalProps {
  profile: UserProfile;
  currentUser: any;
  currentProfile: UserProfile | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
  profile,
  currentUser,
  currentProfile,
  onClose,
  onOpenAuth
}) => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUser?.uid === profile.userId;
  const canShowLocation = isOwner || profile.privacySettings?.locationVisibility !== false;
  const canShowSkills = isOwner || profile.privacySettings?.skillsVisibility !== false;
  const canShowProfession = isOwner || profile.privacySettings?.professionalInfoVisibility !== 'private';

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!message.trim()) {
      setError('Veuillez écrire un message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create a response proposal linking the two users
      await createOpportunityResponse(
        {
          opportunityId: `profile_contact_${profile.userId}`,
          opportunityTitle: `Contact direct : ${profile.displayName}`,
          opportunityAuthorId: profile.userId,
          responderId: currentUser.uid,
          responderName: currentProfile?.displayName || currentUser.displayName || 'Membre ALLORA',
          responderPhotoUrl: currentProfile?.photoUrl || currentUser.photoURL || undefined,
          responderTitle: currentProfile?.professionalTitle || undefined,
          message: message.trim(),
          skills: currentProfile?.skills || [],
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined
        },
        `Profil Professionnel de ${profile.displayName}`,
        profile.userId
      );

      setSuccess(true);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Erreur lors de l\'envoi du message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#19344A] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-[#67B7E8]/10">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-[#67B7E8]/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#19344A] z-10">
          <span className="text-xs font-bold text-[#67B7E8] uppercase tracking-wider">Profil Professionnel & Talents</span>
          <button
            onClick={onClose}
            className="p-2 text-[#19344A] hover:text-[#19344A] dark:hover:text-[#19344A] rounded-full hover:bg-[#FAF9F6] dark:hover:bg-#1D334D transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-[#67B7E8]/20">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                profile.displayName ? profile.displayName.charAt(0).toUpperCase() : <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#19344A] dark:text-white">{profile.displayName}</h3>
              {canShowProfession && profile.professionalTitle && (
                <p className="text-xs font-semibold text-[#67B7E8]">{profile.professionalTitle}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 mt-1">
                {canShowLocation && profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </span>
                )}
                {profile.availability && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {profile.availability}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="p-4 bg-[#FAF9F6] dark:bg-[#1D334D]/50 rounded-2xl border border-gray-100 dark:border-[#67B7E8]/10 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 leading-relaxed">
              {profile.bio}
            </div>
          )}

          {/* Skills */}
          {canShowSkills && profile.skills && profile.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-2">
                Compétences & Domaines
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#67B7E8]/10 text-[#67B7E8] text-xs font-semibold"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services Offered */}
          {profile.servicesOffered && profile.servicesOffered.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-2">
                Services proposés
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.servicesOffered.map((service, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#FAF9F6] dark:bg-[#FAF9F6]0/10 text-[#67B7E8] dark:text-[#67B7E8] border border-blue-200 dark:border-blue-500/20 text-xs font-semibold"
                  >
                    <Briefcase className="w-3 h-3 mr-1" />
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Direct Contact Form */}
          {currentUser?.uid !== profile.userId && (
            <div className="pt-4 border-t border-gray-100 dark:border-[#67B7E8]/10">
              {success ? (
                <div className="p-4 bg-[#FAF9F6] dark:bg-[#67B7E8]/10 text-[#67B7E8] dark:text-[#67B7E8] rounded-2xl border border-[#E8E4D9] dark:border-blue-500/20 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Votre message a été transmis à {profile.displayName} !</span>
                </div>
              ) : showContactForm ? (
                <form onSubmit={handleSendContact} className="space-y-3 bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-4 rounded-2xl border border-gray-100 dark:border-[#67B7E8]/10">
                  <h4 className="text-xs font-bold text-[#19344A] dark:text-white">
                    Proposer une opportunité ou un projet à {profile.displayName}
                  </h4>
                  {error && (
                    <div className="p-2.5 bg-[#FAF9F6] dark:bg-[#67B7E8]/10 text-[#19344A] dark:text-[#FAF9F6]/70 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Présentez votre besoin ou opportunité de service..."
                    rows={3}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-[#19344A] rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#67B7E8] dark:text-white resize-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Votre email"
                      className="w-full px-3 py-2 bg-white dark:bg-[#19344A] rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-white"
                    />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Votre téléphone"
                      className="w-full px-3 py-2 bg-white dark:bg-[#19344A] rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-3 py-1.5 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-gray-200 dark:hover:bg-#1D334D rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="px-4 py-1.5 bg-[#67B7E8] text-white font-bold text-xs rounded-lg hover:bg-[#67B7E8]-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{submitting ? 'Envoi...' : 'Envoyer'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      onOpenAuth();
                    } else {
                      setShowContactForm(true);
                    }
                  }}
                  className="w-full py-3 bg-[#67B7E8] hover:bg-[#67B7E8]-hover text-white text-xs font-bold rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contacter / Proposer mes services</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
