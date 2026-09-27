import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { joinChurchWithCode, fetchChurches } from '../../firebase/services/dataService';
import { getHumanErrorMessage } from '../../firebase/errors';
import { Church } from '../../types';

interface JoinChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (churchId: string) => void;
}

export const JoinChurchModal: React.FC<JoinChurchModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, refreshMemberships } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matchedChurch, setMatchedChurch] = useState<Church | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setJoinCode('');
    setMatchedChurch(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Searches local DB or matching records to confirm code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setSearching(true);
    setErrorMsg(null);
    setMatchedChurch(null);

    try {
      const codeToFind = joinCode.trim().toUpperCase();
      // To bypass creating complex multi-index, we can list churches and find, or just query.
      // Since fetchChurches is fast and capped, we can search it.
      const allChurches = await fetchChurches();
      const match = allChurches.find(c => c.joinCode?.toUpperCase() === codeToFind);

      if (match) {
        setMatchedChurch(match);
      } else {
        setErrorMsg('Aucune église ne correspond à ce code de rejoindre. Veuillez vérifier le code.');
      }
    } catch (err) {
      console.error('Error verifying join code:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!user || !matchedChurch) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      await joinChurchWithCode(matchedChurch.churchId, joinCode.trim().toUpperCase(), {
        uid: user.uid,
        displayName: user.displayName || 'Membre ALLORA',
        email: user.email || ''
      });

      await refreshMemberships();
      onSuccess(matchedChurch.churchId);
      handleClose();
    } catch (err) {
      console.error('Error joining with code:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rejoindre une Église par Code"
      subtitle="Saisissez le code d'adhésion pour rejoindre directement"
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#19344A]/20 border border-[#19344A]/30 dark:border-[#19344A]/30 text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-medium flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {!matchedChurch ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">
                Code de rejoindre l'église
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ex. ALLORA-7K4P2"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#19344A] text-sm text-[#111315] dark:text-white font-mono tracking-wider focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] transition-all text-center uppercase"
              />
              <p className="text-[10px] text-[#19344A]/60 dark:text-[#FAF9F6]/70 mt-1.5 leading-snug">
                Le code d'adhésion est fourni oralement ou par message par les responsables de votre église locale.
              </p>
            </div>

            <div className="pt-2 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#19344A]/80 dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2 rounded-xl bg-[#19344A] dark:bg-blue-600 text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] dark:hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {searching ? 'Vérification...' : 'Vérifier le code'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Matching Church Sheet Card */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#67B7E8]/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">Église trouvée !</span>
              <h3 className="text-base font-bold text-[#19344A] dark:text-white mt-1">{matchedChurch.name}</h3>
              <p className="text-xs text-[#19344A]/70 dark:text-[#FAF9F6]/70 mt-0.5">{matchedChurch.city}, {matchedChurch.country}</p>
              {matchedChurch.denomination && (
                <p className="text-[11px] text-[#19344A]/60 dark:text-[#FAF9F6]/70 mt-1 italic">Dénomination : {matchedChurch.denomination}</p>
              )}
            </div>

            <p className="text-xs text-[#19344A]/80 dark:text-[#FAF9F6]/70 text-center leading-relaxed px-2">
              En confirmant, vous rejoindrez directement cette église en tant que membre approuvé et actif.
            </p>

            <div className="pt-2 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMatchedChurch(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#19344A]/80 dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#19344A] dark:bg-blue-600 text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] dark:hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? 'Adhésion en cours...' : 'Rejoindre l\'église'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
