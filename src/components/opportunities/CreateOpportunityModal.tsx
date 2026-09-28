import React, { useState } from 'react';
import { Opportunity, OpportunityType, OpportunityVisibility, ChurchMember, UserProfile } from '../../types';
import { createOpportunity } from '../../supabase/services/dataService';
import { X, Briefcase, HeartHandshake, UserCheck, Search, Tag, Building2, User, Globe, Lock, AlertCircle, Plus } from 'lucide-react';

interface CreateOpportunityModalProps {
  currentUser: any;
  userProfile: UserProfile | null;
  memberships: ChurchMember[];
  initialMode?: 'propose' | 'search';
  onClose: () => void;
  onSuccess: () => void;
}

const OPPORTUNITY_CATEGORIES = [
  'Graphisme & Vidéo',
  'Musique & Culte',
  'Tech & Informatique',
  'Gestion & Comptabilité',
  'Communication & Rédaction',
  'Bâtiment & Logistique',
  'Social & Entraide',
  'Enseignement & Formation',
  'Autre'
];

const SKILL_SUGGESTIONS = [
  'Vidéaste', 'Graphiste', 'Comptable', 'Développeur', 'Musicien',
  'Sonorisation', 'Chauffeur', 'Community Manager', 'Traducteur',
  'Électricien', 'Cuisinier', 'Enseignant', 'Photographe'
];

export const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({
  currentUser,
  userProfile,
  memberships,
  initialMode = 'propose',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'propose' | 'search'>(initialMode);
  const [type, setType] = useState<OpportunityType>(initialMode === 'propose' ? 'service' : 'skill_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(OPPORTUNITY_CATEGORIES[0]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [location, setLocation] = useState(userProfile?.location || 'Présentiel & Distanciel');
  const [availability, setAvailability] = useState(userProfile?.availability || 'Flexible');
  const [visibility, setVisibility] = useState<OpportunityVisibility>('public');
  
  // Entity selection (Personal or Church)
  const approvedLeaderChurches = memberships.filter(
    m => m.status === 'approved' && (m.role === 'OWNER' || m.role === 'ADMIN')
  );
  const [selectedChurchId, setSelectedChurchId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: 'propose' | 'search') => {
    setMode(newMode);
    if (newMode === 'propose') {
      setType('service');
    } else {
      setType('skill_request');
    }
  };

  const handleAddSkill = (skillToAdd?: string) => {
    const s = (skillToAdd || skillInput).trim();
    if (!s) return;
    if (!skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Vous devez être connecté pour publier.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Veuillez renseigner un titre et une description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedChurch = approvedLeaderChurches.find(c => c.churchId === selectedChurchId);

      await createOpportunity({
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        skills,
        authorId: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName || 'Membre ALLORA',
        authorPhotoUrl: userProfile?.photoUrl || currentUser.photoURL || undefined,
        authorTitle: userProfile?.professionalTitle || undefined,
        churchId: selectedChurch ? selectedChurch.churchId : undefined,
        churchName: selectedChurch ? selectedChurch.churchName : undefined,
        location: location.trim() || 'Distanciel / Présentiel',
        visibility,
        status: 'open',
        availability: availability.trim() || undefined
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error creating opportunity:', err);
      setError(err.message || 'Erreur lors de la création de l\'opportunité.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#19344A] rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-[#67B7E8]/10">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-[#67B7E8]/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#19344A] z-10">
          <div>
            <span className="text-xs font-bold text-[#67B7E8] dark:text-[#67B7E8] uppercase tracking-wider">Opportunités & Services</span>
            <h2 className="text-lg font-black text-[#19344A] dark:text-white">
              {mode === 'propose' ? 'Proposer une compétence ou un service' : 'Publier une recherche ou une opportunité'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#19344A] dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-[#19344A] rounded-full hover:bg-[#FAF9F6] dark:hover:bg-#1D334D transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Tabs : Proposer / Rechercher */}
        <div className="p-4 bg-[#FAF9F6] dark:bg-[#1D334D]/50 border-b border-gray-100 dark:border-[#67B7E8]/10 flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('propose')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'propose'
                ? 'bg-[#67B7E8] dark:bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#19344A] text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D border border-[#E8E4D9] dark:border-[#67B7E8]/20'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Je propose (Service / Talent)</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('search')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'search'
                ? 'bg-[#67B7E8] dark:bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#19344A] text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D border border-[#E8E4D9] dark:border-[#67B7E8]/20'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Je recherche (Besoin / Offre)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FAF9F6] dark:bg-[#19344A]/20 text-[#19344A] dark:text-[#FAF9F6]/70 text-xs rounded-xl flex items-start gap-2 border border-[#19344A] dark:border-[#19344A]/50">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
              Type précis d'annonce
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mode === 'propose' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setType('service')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      type === 'service'
                        ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                        : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                    }`}
                  >
                    <span className="block font-bold">Service / Compétence</span>
                    <span className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70 font-normal">Ex: graphiste dispo, cours de musique</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('volunteer')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      type === 'volunteer'
                        ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                        : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                    }`}
                  >
                    <span className="block font-bold">Bénévolat / Service d'église</span>
                    <span className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70 font-normal">Disponible pour servir bénévolement</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setType('skill_request')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      type === 'skill_request'
                        ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                        : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                    }`}
                  >
                    <span className="block font-bold">Recherche de compétence</span>
                    <span className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70 font-normal">Ex: recherche un comptable, un vidéaste</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('job')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      type === 'job'
                        ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                        : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                    }`}
                  >
                    <span className="block font-bold">Emploi / Mission rémunérée</span>
                    <span className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70 font-normal">Poste ouvert ou prestation</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
              Titre de l'annonce <span className="text-[#67B7E8]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === 'propose'
                  ? "Ex: Graphiste & Designer disponible pour servir vos projets"
                  : "Ex: Recherche un vidéaste pour enregistrement de culte"
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:border-[#67B7E8] dark:focus:border-[#67B7E8]"
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
                Domaine / Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:border-[#67B7E8] dark:focus:border-[#67B7E8] bg-white dark:bg-[#1D334D] dark:text-white"
              >
                {OPPORTUNITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
                Localisation / Modalité
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Paris / Distanciel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:border-[#67B7E8] dark:focus:border-[#67B7E8]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
              Description détaillée <span className="text-[#67B7E8]">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément votre proposition, vos expériences, vos attentes et les détails utiles..."
              rows={4}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:border-[#67B7E8] dark:focus:border-[#67B7E8] resize-none"
            />
          </div>

          {/* Skills tags */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
              Compétences associées (mots-clés pour la recherche)
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
                placeholder="Ajouter une compétence (ex: Vidéo, Son, Web)..."
                className="flex-1 px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:border-[#67B7E8] dark:focus:border-[#67B7E8]"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-3 py-2 bg-[#FAF9F6] dark:bg-[#1D334D] hover:bg-gray-200 dark:hover:bg-#253C5A text-[#19344A] dark:text-[#FAF9F6]/70 font-semibold text-xs rounded-xl transition-colors"
              >
                Ajouter
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SKILL_SUGGESTIONS.slice(0, 6).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => handleAddSkill(s)}
                  className="px-2 py-0.5 rounded-md bg-[#FAF9F6] dark:bg-[#1D334D] hover:bg-gray-200 dark:hover:bg-#253C5A text-[#19344A] dark:text-[#FAF9F6]/70 text-[10px] font-medium transition-colors border border-transparent dark:border-[#67B7E8]/20"
                >
                  + {s}
                </button>
              ))}
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#67B7E8]/10 dark:bg-[#67B7E8]/20 text-[#67B7E8] dark:text-[#67B7E8] text-xs font-medium"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="ml-1.5 text-[#67B7E8]/70 dark:text-[#67B7E8]/70 hover:text-[#67B7E8] dark:hover:text-[#67B7E8] font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
              Disponibilités / Période
            </label>
            <input
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Ex: Samedis & dimanches, 5h par semaine, Dès maintenant"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 focus:border-[#67B7E8] dark:focus:border-[#67B7E8]"
            />
          </div>

          {/* Publisher Identity (Personal vs Church) */}
          {approvedLeaderChurches.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
                Publier en tant que
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChurchId('')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                    selectedChurchId === ''
                      ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                      : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Mon profil personnel</span>
                </button>

                {approvedLeaderChurches.map((c) => (
                  <button
                    type="button"
                    key={c.churchId}
                    onClick={() => setSelectedChurchId(c.churchId)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                      selectedChurchId === c.churchId
                        ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                        : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#67B7E8] dark:text-[#67B7E8]" />
                    <span className="truncate">{c.churchName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider mb-1.5">
              Visibilité de l'annonce
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                  visibility === 'public'
                    ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                    : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#67B7E8] dark:text-[#67B7E8]" />
                <span>Tout ALLORA (Public)</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('church')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                  visibility === 'church'
                    ? 'border-[#67B7E8] bg-[#67B7E8]/5 dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#67B7E8]'
                    : 'border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#67B7E8] dark:text-[#67B7E8]" />
                <span>Mon église uniquement</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-[#67B7E8]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="px-6 py-2.5 bg-[#67B7E8] dark:bg-blue-600 hover:bg-[#67B7E8]-hover dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Publication en cours...' : 'Publier l\'annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
