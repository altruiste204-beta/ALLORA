import React, { useState } from 'react';
import { Opportunity, OpportunityType, UserProfile, ChurchMember, OpportunityVisibility } from '../../types';
import { createOpportunity } from '../../supabase/services/dataService';
import { useLanguage } from '../../context/LanguageContext';
import { X, Plus, AlertCircle, Briefcase, Church, MapPin, Tag, Clock } from 'lucide-react';

interface CreateOpportunityModalProps {
  currentUser: any;
  userProfile: UserProfile | null;
  memberships: ChurchMember[];
  initialMode: 'propose' | 'search' | 'propose_service' | 'search_need';
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({
  currentUser,
  userProfile,
  memberships,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();

  const [mode, setMode] = useState<'propose_service' | 'search_need'>(
    initialMode === 'search' || initialMode === 'search_need' ? 'search_need' : 'propose_service'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(t.opportunities.categories.tech);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [selectedChurchId, setSelectedChurchId] = useState(memberships[0]?.churchId || '');
  const [availability, setAvailability] = useState('Quelques heures / semaine');
  const [compensation, setCompensation] = useState('Bénévole');
  const [visibility, setVisibility] = useState<OpportunityVisibility>('public');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES = [
    t.opportunities.categories.design,
    t.opportunities.categories.music,
    t.opportunities.categories.tech,
    t.opportunities.categories.accounting,
    t.opportunities.categories.communication,
    t.opportunities.categories.building,
    t.opportunities.categories.social,
    t.opportunities.categories.education
  ];

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim() || skills.includes(skillInput.trim())) return;
    setSkills([...skills, skillInput.trim()]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Veuillez renseigner un titre et une description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const oppType: OpportunityType = mode === 'propose_service' ? 'service' : 'skill_request';
      const church = memberships.find((m) => m.churchId === selectedChurchId);

      await createOpportunity({
        type: oppType,
        title: title.trim(),
        description: description.trim(),
        category,
        skills,
        authorId: currentUser?.uid || currentUser?.id,
        authorName: userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0],
        authorPhotoUrl: userProfile?.photoUrl || currentUser?.photoURL,
        authorTitle: userProfile?.professionalTitle || userProfile?.profession,
        churchId: selectedChurchId || undefined,
        churchName: church?.churchName || undefined,
        location: location.trim() || 'En ligne / Non spécifié',
        visibility,
        availability,
        compensation,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error creating opportunity:', err);
      setError(err?.message || 'Erreur lors de la création de l\'annonce.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-center justify-between bg-[#FAF9F6] dark:bg-[#111315]/40">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#19344A] dark:text-white">
              Publier une annonce d'opportunité & compétence
            </h2>
            <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60 mt-0.5">
              Connectez vos talents chrétiens au service des églises et de la communauté
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 sm:p-5 border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 bg-white dark:bg-[#19344A]">
          <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] dark:bg-[#111315]/50 p-1.5 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10">
            <button
              type="button"
              onClick={() => setMode('propose_service')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'propose_service'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-[#6F7B85] dark:text-[#FAF9F6]/60 hover:text-[#19344A] dark:hover:text-white'
              }`}
            >
              🤝 {t.opportunities.tabPropose} (Mes services)
            </button>
            <button
              type="button"
              onClick={() => setMode('search_need')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'search_need'
                  ? 'bg-[#67B7E8] text-white shadow-sm'
                  : 'text-[#6F7B85] dark:text-[#FAF9F6]/60 hover:text-[#19344A] dark:hover:text-white'
              }`}
            >
              🔍 {t.opportunities.tabSearch} (Recherche de compétence)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
              Titre de l'annonce *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === 'propose_service'
                  ? 'ex: Graphiste & monteur vidéo pour vos cultes et réseaux'
                  : 'ex: Recherche développeur Web bénévole pour le site de notre église'
              }
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                Domaine / Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315] text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
              >
                {CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                Lieu ou mode d'intervention
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7B85]" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ex: Paris / À distance"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
              Description détaillée *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément ce que vous proposez ou ce que vous recherchez, les attentes, le contexte..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white placeholder:text-[#6F7B85]/50 focus:outline-none focus:border-[#67B7E8] resize-none"
            />
          </div>

          {/* Skills tags */}
          <div>
            <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
              Compétences clés
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#67B7E8]/15 text-[#19344A] dark:text-white text-xs font-semibold"
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
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Ajouter une compétence (ex: Photoshop, Sonorisation)"
                className="flex-1 px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#111315] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#19344A] dark:text-white hover:border-[#67B7E8]"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Church affiliation & Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memberships.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                  Rattacher à une église (optionnel)
                </label>
                <select
                  value={selectedChurchId}
                  onChange={(e) => setSelectedChurchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315] text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
                >
                  <option value="">Aucune église associée</option>
                  {memberships.map((m) => (
                    <option key={m.membershipId} value={m.churchId}>
                      {m.churchName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                Modalité / Rémunération
              </label>
              <select
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315] text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
              >
                <option value="Bénévole / Service">Bénévole / Service fraternel</option>
                <option value="Dédommagement des frais">Dédommagement des frais</option>
                <option value="Prestation professionnelle">Prestation professionnelle</option>
                <option value="À discuter">À discuter</option>
              </select>
            </div>
          </div>

          {/* Availability & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                Disponibilité
              </label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="ex: Soirs & week-ends, Temps plein"
                className="w-full px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315]/50 text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19344A] dark:text-white mb-1.5">
                Visibilité
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as OpportunityVisibility)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#111315] text-xs text-[#19344A] dark:text-white focus:outline-none focus:border-[#67B7E8]"
              >
                <option value="public">Publique (Tous les membres ALLORA)</option>
                <option value="church">Église uniquement</option>
              </select>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-[#E8E4D9] dark:border-[#67B7E8]/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#6F7B85] hover:bg-black/5 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#67B7E8] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#67B7E8]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Publication en cours...' : 'Publier l\'annonce'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
