import React, { useState } from 'react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordReset } from '../../firebase/services/authService';
import { getHumanErrorMessage } from '../../firebase/errors';
import { Footer } from '../layout/Footer';
import { AlloraLogo } from '../common/AlloraLogo';
import { useLanguage, Language } from '../../context/LanguageContext';
import welcomeHeroBg from '../../assets/images/allora_welcome_hero_1790244085401.jpg';

interface WelcomeAuthScreenProps {
  initialMode?: 'signin' | 'signup';
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({
  initialMode = 'signin',
  isModal = false,
  onCloseModal
}) => {
  const { t, setLanguage, language } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Language state
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ];

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const identifier = emailOrPhone.trim();
    if (!identifier) {
      setErrorMsg(t.auth.errorEmailPhone);
      return;
    }
    if (!password) {
      setErrorMsg(t.auth.errorPassword);
      return;
    }

    setLoading(true);
    try {
      let authEmail = identifier;
      if (!authEmail.includes('@')) {
        authEmail = `${identifier.replace(/\s+/g, '')}@allora-phone.app`;
      }

      if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg(t.auth.errorName);
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg(t.auth.errorPasswordLength);
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg(t.auth.errorPasswordMatch);
          setLoading(false);
          return;
        }

        await registerWithEmail(authEmail, password, displayName.trim());
      } else {
        await loginWithEmail(authEmail, password);
      }

      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      console.error('Email auth error:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetStatus({ type: 'error', text: language === 'fr' ? 'Veuillez saisir une adresse email valide.' : 'Please enter a valid email address.' });
      return;
    }

    setResetLoading(true);
    setResetStatus(null);
    try {
      await sendPasswordReset(resetEmail.trim());
      setResetStatus({
        type: 'success',
        text: t.auth.resetEmailSent
      });
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setResetStatus(null);
        setResetEmail('');
      }, 4000);
    } catch (err: any) {
      setResetStatus({ type: 'error', text: getHumanErrorMessage(err) });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full bg-[#19344A] text-white flex flex-col justify-between overflow-x-hidden ${isModal ? 'p-0' : ''}`}>
      {/* Background Hero Image with Atmospheric Gradients - FIXED at scroll */}
      <div className={`${isModal ? 'absolute' : 'fixed'} inset-0 z-0 overflow-hidden pointer-events-none`}>
        <img
          src={welcomeHeroBg}
          alt={t.brand.tagline}
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Soft Vignette & Deep Blue Gradient overlays */}
        <div className="absolute inset-0 bg-[#111315]/80" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#19344A]/20 to-[#19344A]" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Decorative Bottom African Pattern */}
      <div
        className={`${isModal ? 'absolute' : 'fixed'} bottom-0 inset-x-0 h-14 bg-repeat-x opacity-10 pointer-events-none z-0`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='30' viewBox='0 0 60 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 15 L30 30 L0 15 Z M30 6 L48 15 L30 24 L12 15 Z' fill='%2367B7E8' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 20px'
        }}
      />

      {/* Top Bar (Language & Close if modal) */}
      <header className="relative z-20 w-full max-w-md mx-auto px-5 pt-6 flex items-center justify-between">
        {isModal && onCloseModal ? (
          <button
            onClick={onCloseModal}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all cursor-pointer border border-white/20"
            aria-label={t.actions.close}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <div />
        )}

        {/* Language Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#19344A]/40 hover:bg-[#19344A]/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{language}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-[#111315]/95 backdrop-blur-xl border border-[#67B7E8]/20 rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code as any);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-between hover:bg-[#67B7E8]/10 transition-colors ${
                    language === l.code ? 'text-[#67B7E8]' : 'text-white/60'
                  }`}
                >
                  <span>{l.label}</span>
                  {language === l.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#67B7E8]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-md mx-auto px-5 pt-4 pb-12 flex flex-col items-center">
        {/* Brand Identity Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-10">
          <AlloraLogo 
            size="xl" 
            variant="white" 
            showTagline={true} 
          />
        </div>

        {/* Hero Title & Subtitle */}
        <div className="w-full text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {t.auth.welcomeTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF9F6]/70 font-medium leading-relaxed mt-3 max-w-sm mx-auto">
            {t.auth.welcomeSubtitle}
          </p>
        </div>

        {/* 3 Core Value Pillars */}
        <div className="w-full flex items-center justify-between gap-2 px-4 py-4 mb-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          {[
            { label: t.auth.pillarCommunity, icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
            { label: t.auth.pillarSolidarity, icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /> },
            { label: t.auth.pillarOpportunities, icon: <><circle cx="12" cy="7" r="3" /><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><line x1="9.5" y1="9.5" x2="7.5" y2="14.5" /><line x1="14.5" y1="9.5" x2="16.5" y2="14.5" /><line x1="8.5" y1="17" x2="15.5" y2="17" /></> }
          ].map((pillar, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67B7E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
                {pillar.icon}
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#FAF9F6] text-center leading-tight">
                {pillar.label}
              </span>
            </div>
          ))}
        </div>

        {/* Elevated Auth Card */}
        <div className="w-full bg-white dark:bg-[#111315]/95 rounded-[32px] p-7 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-[#67B7E8]/30" />
          
          {/* Segmented Mode Selector */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF9F6] dark:bg-[#19344A]/50 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#67B7E8] text-white shadow-lg'
                  : 'text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white'
              }`}
            >
              {t.auth.signIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#67B7E8] text-white shadow-lg'
                  : 'text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white'
              }`}
            >
              {t.auth.signUp}
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#19344A]/5 dark:bg-[#67B7E8]/10 border border-[#19344A]/10 dark:border-[#67B7E8]/30 text-[#19344A] dark:text-white text-xs font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-0.5 rounded-full bg-[#67B7E8]/20">
                <svg className="w-3.5 h-3.5 text-[#67B7E8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#67B7E8]/10 border border-[#67B7E8]/30 text-[#67B7E8] text-xs font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <svg className="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6F7B85] group-focus-within:text-[#67B7E8] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.auth.fullName}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#FAF9F6] dark:bg-[#19344A]/30 border border-[#E8E4D9] dark:border-[#67B7E8]/10 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#19344A]/50 rounded-2xl text-sm font-bold text-[#111315] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6F7B85] group-focus-within:text-[#67B7E8] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={t.auth.emailPhone}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-[#FAF9F6] dark:bg-[#19344A]/30 border border-[#E8E4D9] dark:border-[#67B7E8]/10 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#19344A]/50 rounded-2xl text-sm font-bold text-[#111315] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6F7B85] group-focus-within:text-[#67B7E8] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.password}
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-3.5 bg-[#FAF9F6] dark:bg-[#19344A]/30 border border-[#E8E4D9] dark:border-[#67B7E8]/10 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#19344A]/50 rounded-2xl text-sm font-bold text-[#111315] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6F7B85] hover:text-[#67B7E8] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {mode === 'signup' && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6F7B85] group-focus-within:text-[#67B7E8] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.auth.confirmPassword}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#FAF9F6] dark:bg-[#19344A]/30 border border-[#E8E4D9] dark:border-[#67B7E8]/10 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#19344A]/50 rounded-2xl text-sm font-bold text-[#111315] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
                />
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded-lg text-[#67B7E8] focus:ring-[#67B7E8]/30 border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#111315] transition-all"
                    />
                  </div>
                  <span className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/60 font-bold group-hover:text-[#19344A] dark:group-hover:text-white transition-colors">{t.auth.rememberMe}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-black uppercase tracking-widest text-[#67B7E8] hover:text-[#67B7E8]/80 cursor-pointer"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-[#67B7E8] hover:bg-[#67B7E8]/90 active:scale-[0.98] text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-[#67B7E8]/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center gap-2.5">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t.auth.processing}</span>
                </div>
              ) : (
                <>
                  <span>{mode === 'signin' ? t.auth.signIn : t.auth.signUp}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Or Divider */}
          <div className="relative flex items-center justify-center my-7">
            <div className="w-full border-t border-[#E8E4D9] dark:border-[#67B7E8]/10" />
            <span className="bg-white dark:bg-[#111315] px-4 text-[9px] font-black uppercase tracking-widest text-[#6F7B85] absolute">
              {t.auth.or}
            </span>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#19344A]/30 border border-[#E8E4D9] dark:border-[#67B7E8]/10 hover:border-[#67B7E8] text-[#19344A] dark:text-[#FAF9F6] font-bold text-xs flex items-center justify-center gap-3.5 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="uppercase tracking-widest text-[10px]">{t.auth.googleContinue}</span>
          </button>

          {/* Bottom toggle prompt */}
          <div className="mt-7 text-center text-[10px] font-bold text-[#6F7B85]">
            {mode === 'signin' ? (
              <p>
                {t.auth.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-black uppercase tracking-widest text-[#67B7E8] hover:underline cursor-pointer"
                >
                  {t.auth.signUp}
                </button>
              </p>
            ) : (
              <p>
                {t.auth.hasAccount}{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-black uppercase tracking-widest text-[#67B7E8] hover:underline cursor-pointer"
                >
                  {t.auth.signIn}
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer on Welcome Auth Screen */}
      {!isModal && (
        <Footer variant="dark" />
      )}

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#19344A] rounded-3xl p-6 text-[#19344A] dark:text-[#FAF9F6] shadow-2xl border border-gray-100 dark:border-[#67B7E8]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#19344A] dark:text-[#FAF9F6]">{t.auth.forgotTitle}</h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-full text-[#19344A] hover:text-[#19344A] dark:hover:text-[#FAF9F6] hover:bg-[#FAF9F6] dark:hover:bg-[#19344A]/40 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-[#19344A]/70 dark:text-[#FAF9F6]/70 mb-4 leading-relaxed">
              {t.auth.forgotDesc}
            </p>

            {resetStatus && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  resetStatus.type === 'success'
                    ? 'bg-[#FAF9F6] dark:bg-blue-900/20 text-[#67B7E8] dark:text-[#DCEFFA] border border-blue-200 dark:border-blue-800'
                    : 'bg-[#FAF9F6] dark:bg-red-900/20 text-[#19344A] dark:text-red-200 border border-[#19344A] dark:border-red-900/50'
                }`}
              >
                <span>{resetStatus.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={t.auth.forgotEmailPlaceholder}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#19344A]/40 focus:border-[#67B7E8] text-sm text-[#19344A] dark:text-[#FAF9F6] placeholder:text-[#19344A]/40 dark:placeholder:text-[#FAF9F6]/40 focus:outline-none transition-all"
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 hover:bg-[#FAF9F6] dark:hover:bg-[#19344A]/40 text-[#19344A] dark:text-[#FAF9F6]/80 font-semibold text-xs transition-all cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#67B7E8] hover:bg-[#67B7E8] text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? t.needs.sending : t.auth.sendLink}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
