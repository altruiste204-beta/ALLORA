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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Profil Professionnel & Talents</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-primary/20">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                profile.displayName ? profile.displayName.charAt(0).toUpperCase() : <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{profile.displayName}</h3>
              {profile.professionalTitle && (
                <p className="text-xs font-semibold text-primary">{profile.professionalTitle}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {profile.location && (
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
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
              {profile.bio}
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Compétences & Domaines
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
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
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Services proposés
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.servicesOffered.map((service, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
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
            <div className="pt-4 border-t border-gray-100">
              {success ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Votre message a été transmis à {profile.displayName} !</span>
                </div>
              ) : showContactForm ? (
                <form onSubmit={handleSendContact} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800">
                    Proposer une opportunité ou un projet à {profile.displayName}
                  </h4>
                  {error && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
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
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Votre email"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs"
                    />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Votre téléphone"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="px-4 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
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
