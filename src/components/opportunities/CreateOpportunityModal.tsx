import React, { useState } from 'react';
import { Opportunity, OpportunityType, OpportunityVisibility, ChurchMember, UserProfile } from '../../types';
import { createOpportunity } from '../../firebase/services/dataService';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Opportunités & Services</span>
            <h2 className="text-lg font-black text-gray-900">
              {mode === 'propose' ? 'Proposer une compétence ou un service' : 'Publier une recherche ou une opportunité'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Tabs : Proposer / Rechercher */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('propose')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'propose'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Je recherche (Besoin / Offre)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">Service / Compétence</span>
                    <span className="text-[11px] text-gray-500 font-normal">Ex: graphiste dispo, cours de musique</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('volunteer')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      type === 'volunteer'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">Bénévolat / Service d'église</span>
                    <span className="text-[11px] text-gray-500 font-normal">Disponible pour servir bénévolement</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setType('skill_request')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      type === 'skill_request'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">Recherche de compétence</span>
                    <span className="text-[11px] text-gray-500 font-normal">Ex: recherche un comptable, un vidéaste</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('job')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      type === 'job'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">Emploi / Mission rémunérée</span>
                    <span className="text-[11px] text-gray-500 font-normal">Poste ouvert ou prestation</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Titre de l'annonce <span className="text-red-500">*</span>
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Domaine / Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                {OPPORTUNITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Localisation / Modalité
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Paris / Distanciel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément votre proposition, vos expériences, vos attentes et les détails utiles..."
              rows={4}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Skills tags */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
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
                  className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-medium transition-colors"
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
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="ml-1.5 text-primary/70 hover:text-primary font-bold"
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
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Disponibilités / Période
            </label>
            <input
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Ex: Samedis & dimanches, 5h par semaine, Dès maintenant"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Publisher Identity (Personal vs Church) */}
          {approvedLeaderChurches.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Publier en tant que
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChurchId('')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                    selectedChurchId === ''
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
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
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="truncate">{c.churchName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Visibilité de l'annonce
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                  visibility === 'public'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tout ALLORA (Public)</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('church')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 ${
                  visibility === 'church'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Mon église uniquement</span>
              </button>
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
              disabled={submitting || !title.trim() || !description.trim()}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Publication en cours...' : 'Publier l\'annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
