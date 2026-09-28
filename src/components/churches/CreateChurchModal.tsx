import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { createChurch } from '../../supabase/services/dataService';
import { getHumanErrorMessage } from '../../supabase/errors';

interface CreateChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (churchId: string) => void;
}

export const CreateChurchModal: React.FC<CreateChurchModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, profile, refreshMemberships } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('France');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [denomination, setDenomination] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCountry('France');
    setCity('');
    setAddress('');
    setContactPhone('');
    setContactEmail('');
    setWebsite('');
    setDenomination('');
    setFoundedYear('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setErrorMsg('Veuillez vous connecter pour référencer une église.');
      return;
    }

    if (!name.trim() || !city.trim() || !country.trim()) {
      setErrorMsg('Veuillez renseigner le nom, le pays et la ville.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const churchId = await createChurch(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          city: city.trim(),
          country: country.trim(),
          address: address.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          website: website.trim() || undefined,
          denomination: denomination.trim() || undefined,
          foundedYear: foundedYear.trim() || undefined
        },
        user.uid,
        profile.displayName,
        user.email || ''
      );

      await refreshMemberships();
      onSuccess(churchId);
      handleClose();
    } catch (err) {
      console.error('Error creating church:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Référencer une Église"
      subtitle="Créez un espace communautaire de partage et de coopération"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#19344A]/20 border border-[#19344A]/30 dark:border-[#19344A]/30 text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          {/* Identité */}
          <div className="bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-3.5 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#67B7E8]/20 space-y-3">
            <h3 className="text-xs font-bold text-[#19344A] dark:text-white uppercase tracking-wider">Identité</h3>
            
            <div>
              <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                Nom de l'église *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Église Évangélique de Lyon"
                required
                maxLength={150}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                Description de l'église
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Partagez l'histoire, la vision, et les projets de l'église locale..."
                rows={3}
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all resize-none"
              />
            </div>
          </div>

          {/* Localisation */}
          <div className="bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-3.5 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#67B7E8]/20 space-y-3">
            <h3 className="text-xs font-bold text-[#19344A] dark:text-white uppercase tracking-wider">Localisation</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                  Pays *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex. France"
                  required
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex. Lyon"
                  required
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                Adresse physique (facultatif)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex. 14 Rue Victor Hugo"
                maxLength={250}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-3.5 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#67B7E8]/20 space-y-3">
            <h3 className="text-xs font-bold text-[#19344A] dark:text-white uppercase tracking-wider">Contact</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                  Téléphone de contact
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ex. +33 6 00 00 00 00"
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                  Email de contact
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Ex. contact@eglise.org"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                Site Web officiel
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Ex. https://eglise.org"
                maxLength={150}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
              />
            </div>
          </div>

          {/* Informations complémentaires */}
          <div className="bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-3.5 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#67B7E8]/20 space-y-3">
            <h3 className="text-xs font-bold text-[#19344A] dark:text-white uppercase tracking-wider">Informations complémentaires</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                  Dénomination (facultatif)
                </label>
                <input
                  type="text"
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                  placeholder="Ex. Baptiste, Réformée..."
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                  Année de fondation (facultatif)
                </label>
                <input
                  type="text"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="Ex. 1995"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A] text-xs sm:text-sm text-[#111315] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 flex justify-end gap-3.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#19344A]/80 dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#19344A] dark:bg-blue-600 text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] dark:hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? 'Création...' : 'Créer l\'église'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
