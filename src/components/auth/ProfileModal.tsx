import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { saveUserProfile } from '../../firebase/services/userService';
import { getHumanErrorMessage } from '../../firebase/errors';
import { UserProfile } from '../../types';
import { i18n } from '../../i18n';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setProfessionalTitle(profile.professionalTitle || '');
      setLocation(profile.location || '');
      setBio(profile.bio || '');
      setAvailability(profile.availability || '');
      setSkills(profile.skills || []);
      setServicesOffered(profile.servicesOffered || []);
    }
  }, [profile, isOpen]);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 15) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddService = () => {
    const trimmed = serviceInput.trim();
    if (trimmed && !servicesOffered.includes(trimmed) && servicesOffered.length < 15) {
      setServicesOffered([...servicesOffered, trimmed]);
      setServiceInput('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setServicesOffered(servicesOffered.filter(s => s !== serviceToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const updatedProfile: UserProfile = {
        userId: user.uid,
        email: user.email || '',
        displayName: displayName.trim() || 'Membre ALLORA',
        professionalTitle: professionalTitle.trim() || undefined,
        location: location.trim(),
        bio: bio.trim(),
        availability: availability.trim(),
        skills,
        servicesOffered,
        interests: profile?.interests || [],
        churchIds: profile?.churchIds || [],
        photoUrl: profile?.photoUrl || undefined,
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveUserProfile(updatedProfile);
      await refreshProfile();
      setSuccessMsg('Votre profil a été mis à jour avec succès.');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={i18n.profile.title}
      subtitle={user?.email || undefined}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#19344A]/30 text-[#19344A] text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#67B7E8] text-[#19344A] text-xs font-medium">
            {successMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#19344A] mb-1">
            Nom affiché
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] focus:outline-none focus:border-[#19344A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#19344A] mb-1">
            Titre ou domaine professionnel (optionnel)
          </label>
          <input
            type="text"
            value={professionalTitle}
            onChange={(e) => setProfessionalTitle(e.target.value)}
            placeholder="Ex. Graphiste & Vidéaste, Développeur Web, Comptable..."
            maxLength={100}
            className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] focus:outline-none focus:border-[#19344A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#19344A] mb-1">
            {i18n.profile.location} (ville, région)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex. Lyon, France"
            maxLength={150}
            className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] focus:outline-none focus:border-[#19344A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#19344A] mb-1">
            {i18n.profile.bio}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Partagez quelques mots sur vous, vos valeurs, vos projets..."
            className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] focus:outline-none focus:border-[#19344A] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#19344A] mb-1">
            {i18n.profile.availability}
          </label>
          <input
            type="text"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Ex. Samedis matin, soirs de semaine..."
            maxLength={100}
            className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] focus:outline-none focus:border-[#19344A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#19344A] mb-1">
            Compétences & Talents
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
              placeholder="Ex. Graphisme, Sonorisation, Rédaction..."
              className="flex-1 px-3.5 py-1.5 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-xs text-[#111315] focus:outline-none focus:border-[#19344A]"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-3 py-1.5 rounded-xl bg-[#E8E4D9] text-[#19344A] text-xs font-semibold hover:bg-[#19344A] hover:text-[#FFFFFF] transition-all cursor-pointer"
            >
              Ajouter
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E4D9] text-xs font-medium text-[#19344A]"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-[#111315] cursor-pointer"
                  aria-label={`Supprimer ${skill}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#19344A] mb-1">
            Services que vous pouvez proposer
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddService();
                }
              }}
              placeholder="Ex. Montage vidéo, Cours de guitare, Conseil compta..."
              className="flex-1 px-3.5 py-1.5 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-xs text-[#111315] focus:outline-none focus:border-[#19344A]"
            />
            <button
              type="button"
              onClick={handleAddService}
              className="px-3 py-1.5 rounded-xl bg-[#E8E4D9] text-[#19344A] text-xs font-semibold hover:bg-[#19344A] hover:text-[#FFFFFF] transition-all cursor-pointer"
            >
              Ajouter
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {servicesOffered.map((srv) => (
              <span
                key={srv}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
              >
                {srv}
                <button
                  type="button"
                  onClick={() => handleRemoveService(srv)}
                  className="hover:text-emerald-950 cursor-pointer"
                  aria-label={`Supprimer ${srv}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8E4D9] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              onClose();
            }}
            className="text-xs font-semibold text-[#19344A]/60 hover:text-[#19344A] cursor-pointer"
          >
            {i18n.actions.signOut}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#19344A]/80 hover:bg-[#FAF9F6] cursor-pointer"
            >
              {i18n.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#19344A] text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? 'Enregistrement...' : i18n.actions.save}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
