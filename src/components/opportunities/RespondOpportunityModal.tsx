import React, { useState } from 'react';
import { Opportunity, UserProfile } from '../../types';
import { createOpportunityResponse } from '../../firebase/services/dataService';
import { X, Send, User, Mail, Phone, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

interface RespondOpportunityModalProps {
  opportunity: Opportunity;
  currentUser: any;
  userProfile: UserProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RespondOpportunityModal: React.FC<RespondOpportunityModalProps> = ({
  opportunity,
  currentUser,
  userProfile,
  onClose,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [skills, setSkills] = useState<string[]>(userProfile?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (s: string) => {
    setSkills(skills.filter(x => x !== s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Vous devez être connecté pour répondre.');
      return;
    }
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
          responderId: currentUser.uid,
          responderName: userProfile?.displayName || currentUser.displayName || 'Membre ALLORA',
          responderPhotoUrl: userProfile?.photoUrl || currentUser.photoURL || undefined,
          responderTitle: userProfile?.professionalTitle || undefined,
          message: message.trim(),
          skills,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined
        },
        opportunity.title,
        opportunity.authorId
      );

      onSuccess();
    } catch (err: any) {
      console.error('Error sending proposition:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de votre proposition.');
    } finally {
      setSubmitting(false);
    }
  };

  const isServiceOffer = opportunity.type === 'job' || opportunity.type === 'skill_request' || opportunity.type === 'volunteer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {isServiceOffer ? 'Proposer mes services' : 'Manifester mon intérêt'}
            </span>
            <h2 className="text-lg font-bold text-gray-900 line-clamp-1">
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed">
            💡 <strong>Mise en relation directe :</strong> Votre message et vos coordonnées seront transmis de façon sécurisée à l'auteur de l'annonce ({opportunity.authorName || opportunity.churchName || 'l\'organisateur'}).
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Votre message de présentation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isServiceOffer
                  ? "Présentez brièvement vos compétences, vos disponibilités et votre motivation à servir ou collaborer..."
                  : "Expliquez pourquoi ce service ou cette offre vous intéresse..."
              }
              rows={4}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Highlighted Skills */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Compétences à mettre en avant
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Ex: Graphisme, Sonorisation, Rédaction..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Ajouter
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="ml-1.5 text-primary/70 hover:text-primary"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Email de contact
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Téléphone (optionnel)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer ma proposition</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
