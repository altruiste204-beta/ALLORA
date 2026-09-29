import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { createContactRequest } from '../../supabase/services/dataService';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  MapPin, 
  Tag, 
  Send, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Briefcase, 
  Clock, 
  Sparkles, 
  HeartHandshake 
} from 'lucide-react';

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
  onOpenAuth,
}) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentProfile?.phoneNumber || '');
  const [showContactForm, setShowContactForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isSelf = currentUser && (currentUser.uid === profile.userId || currentUser.id === profile.userId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!message.trim()) {
      setError('Veuillez saisir votre message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createContactRequest(
        currentUser.uid || currentUser.id,
        profile.userId,
        message.trim(),
        contactEmail.trim(),
        contactPhone.trim(),
        currentProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0],
        currentProfile?.photoUrl || currentUser?.photoURL,
        profile.displayName
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error sending contact request:', err);
      setError(err?.message || 'Erreur lors de l\'envoi de la demande de contact.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cover / Header */}
        <div className="relative h-28 bg-gradient-to-r from-[#19344A] via-[#1E4362] to-[#67B7E8]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Basic Info */}
        <div className="px-6 pt-0 pb-4 relative -mt-12 flex items-end justify-between gap-4">
          <div className="flex items-end gap-3.5">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#19344A] shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#67B7E8] text-white flex items-center justify-center text-2xl font-black border-4 border-white dark:border-[#19344A] shadow-md shrink-0">
                {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="mb-1">
              <h2 className="text-lg font-black text-[#19344A] dark:text-white">
                {profile.displayName}
              </h2>
              <p className="text-xs text-[#67B7E8] font-bold">
                {profile.professionalTitle || profile.profession || 'Membre de la communauté'}
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 pt-2 overflow-y-auto space-y-5">
          {/* Location & Availability tags */}
          <div className="flex flex-wrap items-center gap-2">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF9F6] dark:bg-[#111315]/40 text-[#6F7B85] dark:text-[#FAF9F6]/70 text-xs font-semibold border border-[#E8E4D9] dark:border-transparent">
                <MapPin className="w-3.5 h-3.5 text-[#67B7E8]" />
                <span>{profile.location}</span>
              </span>
            )}
            {profile.availability && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF9F6] dark:bg-[#111315]/40 text-[#6F7B85] dark:text-[#FAF9F6]/70 text-xs font-semibold border border-[#E8E4D9] dark:border-transparent">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>{profile.availability}</span>
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                À propos / Parcours
              </h3>
              <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/80 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[#19344A] dark:text-white mb-2">
                Compétences & Savoir-faire
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#67B7E8]/15 text-[#19344A] dark:text-white text-xs font-semibold"
                  >
                    <Tag className="w-3 h-3 text-[#67B7E8]" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services Offered */}
          {profile.servicesOffered && profile.servicesOffered.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[#19344A] dark:text-white mb-2">
                Services proposés aux églises & membres
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.servicesOffered.map((svc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40"
                  >
                    <HeartHandshake className="w-3 h-3" />
                    <span>{svc}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Section */}
          {!isSelf && (
            <div className="pt-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/15">
              {success ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <CheckCircle className="w-6 h-6 mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    Demande de contact transmise !
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-300">
                    {profile.displayName} recevra votre message et vos coordonnées.
                  </p>
                </div>
              ) : showContactForm ? (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <h3 className="text-xs font-bold text-[#19344A] dark:text-white">
                    Envoyer un message à {profile.displayName}
                  </h3>

                  {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Bonjour, je souhaiterais échanger avec vous concernant vos compétences pour un projet / besoin..."
                    rows={3}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8] resize-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Votre email"
                      className="px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
                    />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Votre téléphone (optionnel)"
                      className="px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-[#E8E4D9] text-xs font-bold text-[#6F7B85] hover:bg-black/5"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 rounded-xl bg-[#67B7E8] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
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
                  className="w-full py-2.5 rounded-xl bg-[#67B7E8] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#67B7E8]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contacter {profile.displayName}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/15 bg-[#FAF9F6] dark:bg-[#111315]/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#6F7B85] hover:bg-black/5 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
