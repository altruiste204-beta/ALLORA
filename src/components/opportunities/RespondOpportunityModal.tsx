import React, { useState } from 'react';
import { Opportunity, UserProfile } from '../../types';
import { createOpportunityResponse } from '../../supabase/services/dataService';
import { useLanguage } from '../../context/LanguageContext';
import { X, Send, AlertCircle, CheckCircle, Mail, Phone, Tag } from 'lucide-react';

interface RespondOpportunityModalProps {
  opportunity: Opportunity;
  currentUser: any;
  userProfile: UserProfile | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RespondOpportunityModal: React.FC<RespondOpportunityModalProps> = ({
  opportunity,
  currentUser,
  userProfile,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(userProfile?.phoneNumber || '');
  const [skills, setSkills] = useState<string[]>(userProfile?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Veuillez rédiger un message de présentation.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createOpportunityResponse(
        {
          opportunityId: opportunity.opportunityId,
          opportunityTitle: opportunity.title,
          opportunityAuthorId: opportunity.authorId,
          responderName: userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0],
          responderPhotoUrl: userProfile?.photoUrl || currentUser?.photoURL,
          responderTitle: userProfile?.professionalTitle || userProfile?.profession,
          message: message.trim(),
          skills: skills,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
        },
        opportunity.title,
        opportunity.authorId
      );

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting opportunity response:', err);
      setError(err?.message || 'Erreur lors de l\'envoi de votre proposition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-center justify-between bg-[#FAF9F6] dark:bg-[#111315]/40">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#19344A] dark:text-white">
              Répondre à l'annonce
            </h2>
            <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60 truncate max-w-sm mt-0.5">
              {opportunity.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-[#19344A] dark:text-white">
                Proposition transmise avec succès !
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70">
                L'auteur de l'annonce recevra votre message et vos coordonnées pour vous recontacter.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                  Votre message de proposition / motivation *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Présentez brièvement vos compétences, votre expérience et la manière dont vous souhaitez collaborer..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-[#19344A] dark:text-white text-xs placeholder:text-[#6F7B85]/50 focus:outline-none focus:border-[#67B7E8] transition-colors resize-none"
                />
              </div>

              {/* Skills Tags */}
              <div>
                <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                  Compétences mises en avant
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#67B7E8]/15 text-[#19344A] dark:text-[#FAF9F6] text-xs font-semibold"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#6F7B85] hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Ajouter une compétence (ex: Montage vidéo, Son)"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#111315] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#19344A] dark:text-white hover:border-[#67B7E8]"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1">
                    Email de contact
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7B85]" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1">
                    Téléphone (optionnel)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7B85]" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
                    />
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="pt-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-black/5 text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#67B7E8] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#67B7E8]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Envoi en cours...' : 'Envoyer ma proposition'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
