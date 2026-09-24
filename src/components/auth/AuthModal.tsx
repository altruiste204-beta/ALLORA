import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../firebase/services/authService';
import { getHumanErrorMessage } from '../../firebase/errors';
import { i18n } from '../../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      handleClose();
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('Veuillez renseigner votre prénom et nom.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email.trim(), password, displayName.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      handleClose();
    } catch (err) {
      console.error('Email auth error:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'signin' ? 'Connexion à ALLORA' : 'Rejoindre ALLORA'}
      subtitle={
        mode === 'signin'
          ? 'Retrouvez votre communauté et vos collaborations.'
          : 'Partagez vos ressources et répondez aux besoins de votre église.'
      }
    >
      <div className="space-y-4">
        {/* Error notification banner if any (discreet, accessible, no warm brand colors) */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#19344A]/30 text-[#19344A] text-xs font-medium flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#E8E4D9] bg-[#FFFFFF] hover:bg-[#FAF9F6] text-[#19344A] text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 shadow-xs"
        >
          {/* Sober Google G linear SVG icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#19344A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.945 11a9 9 0 1 1-3.284-5.997l-2.655 2.392A5.5 5.5 0 1 0 18.25 12h-6.25v-2h8.945z" />
          </svg>
          <span>Continuer avec Google</span>
        </button>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#E8E4D9] w-full" />
          <span className="bg-[#FFFFFF] px-3 text-[11px] uppercase tracking-wider text-[#19344A]/50 font-semibold absolute">
            ou par email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#19344A] mb-1">
                Prénom et Nom
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex. Sarah Martin"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A] transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#19344A] mb-1">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@exemple.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19344A] mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] bg-[#FAF9F6] text-sm text-[#111315] placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 mt-2 rounded-xl bg-[#19344A] hover:bg-[#111315] text-[#FFFFFF] text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {loading ? 'Traitement en cours...' : mode === 'signin' ? i18n.actions.signIn : i18n.actions.signUp}
          </button>
        </form>

        {/* Switch mode */}
        <div className="pt-2 text-center text-xs text-[#19344A]/70">
          {mode === 'signin' ? (
            <span>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className="font-bold text-[#19344A] hover:underline cursor-pointer"
              >
                Créer un compte
              </button>
            </span>
          ) : (
            <span>
              Vous avez déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(null); }}
                className="font-bold text-[#19344A] hover:underline cursor-pointer"
              >
                Se connecter
              </button>
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
};
