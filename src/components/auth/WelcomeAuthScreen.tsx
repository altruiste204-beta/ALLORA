import React, { useState, useEffect, useRef } from 'react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordReset } from '../../supabase/services/authService';
import { getHumanErrorMessage } from '../../supabase/errors';
import { AlloraLogo } from '../common/AlloraLogo';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import heroCathedraleDouala from '../../assets/images/hero_cathedrale_douala.jpg';
import churchYaoundeVictoires from '../../assets/images/church_yaounde_victoires.jpg';
import eventChoraleCameroun from '../../assets/images/event_chorale_cameroun.jpg';
import entraideMarcheMfoundi from '../../assets/images/entraide_marche_mfoundi.jpg';
import serviceJeunesseDouala from '../../assets/images/service_jeunesse_douala.jpg';
import {
  Mail,
  Eye,
  EyeOff,
  X,
  ArrowLeft,
  Check,
  AlertCircle,
  Sun,
  Moon,
  Church,
  Calendar,
  HeartHandshake,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock
} from 'lucide-react';

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
  const { setTheme, isDark } = useTheme();
  const isFr = language === 'fr';

  // Overall landing page state: is the Auth Window (bottom sheet) open?
  const [isAuthOpen, setIsAuthOpen] = useState(isModal);

  // Bottom sheet animation & pull-to-lower gesture state
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);

  // Navigation view inside the login window: 'options' or 'email'
  const [viewMode, setViewMode] = useState<'options' | 'email'>('options');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Legal modal state for visitors (Mentions légales, CGU, Confidentialité)
  const [legalModalContent, setLegalModalContent] = useState<{ title: string; body: React.ReactNode } | null>(null);

  // Language dropdown menu state
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ];

  // Lower / dismiss the bottom sheet smoothly
  const handleLowerDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsAuthOpen(false);
      setIsClosing(false);
      setDragOffset(0);
      setIsDragging(false);
      if (onCloseModal) onCloseModal();
    }, 280);
  };

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isForgotModalOpen) {
          setIsForgotModalOpen(false);
        } else if (legalModalContent) {
          setLegalModalContent(null);
        } else if (isAuthOpen && !isModal) {
          handleLowerDismiss();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen, isModal, isForgotModalOpen, legalModalContent]);

  // Pull / swipe gestures on the top bar (_____)
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - dragStartYRef.current;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > 70) {
      handleLowerDismiss();
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartYRef.current = e.clientY;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      if (deltaY > 0) {
        setDragOffset(deltaY);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsDragging(false);
      setDragOffset((prev) => {
        if (prev > 70) {
          handleLowerDismiss();
          return prev;
        }
        return 0;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Open Auth Window dynamically from the bottom
  const handleOpenAuth = (targetMode: 'signin' | 'signup') => {
    setMode(targetMode);
    setViewMode('options');
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmailSentNotice(null);
    setDragOffset(0);
    setIsClosing(false);
    setIsAuthOpen(true);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      handleLowerDismiss();
    } catch (err: any) {
      console.warn('Google Sign-in status:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmailSentNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(isFr ? 'Veuillez saisir une adresse email valide.' : 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg(t.auth.errorPassword);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cleanFirst = firstName.trim();
        const cleanLast = lastName.trim();
        const fullName = [cleanFirst, cleanLast].filter(Boolean).join(' ');

        if (!cleanFirst) {
          setErrorMsg(isFr ? 'Le prénom est requis.' : 'First name is required.');
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

        const result = await registerWithEmail(cleanEmail, password, fullName);

        if (result.requiresEmailConfirmation) {
          setEmailSentNotice(
            isFr
              ? `Un e-mail de confirmation a été envoyé à ${cleanEmail}. Cliquez sur le lien reçu pour activer votre compte avant de vous connecter.`
              : `A confirmation email has been sent to ${cleanEmail}. Please click the link in your inbox to verify your account before logging in.`
          );
          setMode('signin');
        } else {
          setSuccessMsg(isFr ? 'Compte créé avec succès !' : 'Account created successfully!');
          handleLowerDismiss();
        }
      } else {
        await loginWithEmail(cleanEmail, password);
        handleLowerDismiss();
      }
    } catch (err: any) {
      console.warn('Auth notice:', err);
      setErrorMsg(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetStatus({ type: 'error', text: isFr ? 'Veuillez saisir une adresse email valide.' : 'Please enter a valid email address.' });
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

  // The Contextual Login Dialog / Bottom Sheet
  // - Contains the upper drag bar (_____) to pull down and withdraw
  // - No cancel (X) icon
  // - No phrase "Créez votre compte pour commencer à servir"
  // - Email FIRST, Google SECOND
  const renderAuthSheet = () => (
    <div
      style={{
        transform: isClosing
          ? 'translateY(100%)'
          : dragOffset > 0
          ? `translateY(${dragOffset}px)`
          : undefined,
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
      }}
      className={`relative w-full max-w-lg bg-white dark:bg-[#19344A] rounded-t-[32px] sm:rounded-[32px] shadow-2xl border-t sm:border border-[#E8E4D9]/80 dark:border-[#67B7E8]/20 p-6 sm:p-8 pt-3 sm:pt-6 overflow-hidden text-[#19344A] dark:text-white ${
        isClosing
          ? 'translate-y-full opacity-0'
          : 'animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:fade-in duration-300'
      }`}
    >
      {/* Top Drag & Lower Dismiss Bar: (_____) — Mobile only */}
      <div
        role="button"
        tabIndex={0}
        aria-label={isFr ? "Abaisser pour fermer" : "Slide down to close"}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleLowerDismiss}
        className="sm:hidden w-full pt-1 pb-3 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group touch-none"
      >
        <div className="w-16 h-1.5 rounded-full bg-slate-300 dark:bg-white/30 group-hover:bg-[#67B7E8] transition-colors" />
      </div>

      {viewMode === 'options' ? (
        /* STEP 1: OPTIONS VIEW — EMAIL FIRST, GOOGLE SECOND */
        <div className="space-y-6">
          {/* Header Row: Branded Icon on Left, Close Button (X) on Desktop only */}
          <div className="flex items-center justify-between">
            {/* Branded Emblem Badge (Square with rounded corners) */}
            <div className="w-12 h-12 rounded-2xl bg-[#19344A] dark:bg-[#111315] flex items-center justify-center p-2.5 shadow-sm border border-[#67B7E8]/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1095 1095"
                className="w-7 h-7 text-[#67B7E8]"
                fill="#67B7E8"
                aria-label="ALLORA"
              >
                <path
                  d="M838.73 239.43C850.92 237.86 863.18 238.82 874.87 242.58C895.8 249.31 913.24 263.05 924.41 282.1C948.04 322.39 931.95 376.84 891.61 399.08C882.91 403.88 873.33 407.36 863.46 408.78C850.86 410.61 838.52 409.79 826.3 406.31C815.98 403.39 806.8 398.71 798.09 392.41C788.57 385.53 781.08 376.29 775.41 366.09C752.23 324.43 768 272.55 808.99 249.49C818.18 244.32 828.24 240.78 838.73 239.43ZM843.66 293.35C811.17 298.56 809.41 345.42 840.51 355C845.8 356.63 851.88 356.74 857.29 355.66C884.65 350.2 890.41 313.82 868.34 298.13C861.29 293.12 852.02 292.01 843.66 293.35ZM807.5 711.11C801.86 716.48 797.68 724.17 792.93 730.39C783.61 742.61 773.95 754.71 763.36 765.86C726.18 805.01 682.77 839.1 633.81 862.32C617.98 869.83 601.85 877.02 585.25 882.67C482.05 917.82 357.89 919.97 258.45 872.05C195.72 841.83 144.07 792.31 131.22 721.45C128.68 707.39 128.07 692.76 128.87 678.5C133.34 598.7 180.8 525.43 236.57 471.07C313.39 396.21 416.66 345.58 522.46 328.77C595.6 317.15 671.34 322.2 738.02 356.49C757.68 366.6 775.34 380.07 791.78 394.7C853.26 449.44 877.94 525.95 887.69 605.55C894.15 658.27 894.6 711.41 906.18 763.45C912.92 793.72 924.88 822.58 942.09 848.36C952.67 864.2 968.6 882.02 958.89 902.38C953.17 914.39 940.1 919.51 927.5 919.74C907.63 920.1 887.32 910.93 872.51 898C836.66 866.71 820.28 815.21 814.4 769.31C812.96 758.05 811.31 746.8 810.21 735.5C809.42 727.48 809.51 718.89 807.5 711.11ZM581.75 405.46C470.96 412.79 350.72 469.62 290.63 566.15C259.23 616.59 243.53 677.53 280.99 729.47C287.43 738.4 295.59 746.5 304.15 753.39C341.72 783.64 390.33 795.23 437.47 798.38C523.06 804.09 611.17 774.9 677.57 721.03C708.76 695.73 736.2 664.71 753.89 628.39C763.93 607.77 771.22 586.16 774.76 563.46C777.36 546.76 777.47 529.21 774.91 512.5C773.61 504.02 771.16 495.5 767.86 487.59C738.96 418.32 648.63 401.04 581.75 405.46Z"
                  fillRule="evenodd"
                />
              </svg>
            </div>

            {/* Circular Close Button (X) — Desktop only (hidden on mobile) */}
            <button
              onClick={handleLowerDismiss}
              className="hidden sm:flex w-10 h-10 rounded-full bg-[#FAF9F6] dark:bg-white/10 text-[#6F7B85] dark:text-[#FAF9F6]/80 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-[#19344A] dark:hover:text-white items-center justify-center transition-colors cursor-pointer"
              aria-label={t.actions.close}
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h2 className="text-2xl sm:text-[26px] font-black text-[#19344A] dark:text-white tracking-tight leading-tight">
              {isFr ? 'Continuer avec ALLORA' : 'Continue with ALLORA'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75 mt-2 leading-relaxed">
              {isFr
                ? 'Connectez-vous pour rejoindre votre communauté, partager des besoins et coopérer.'
                : 'Sign in to join your community, share needs and collaborate with others.'}
            </p>
          </div>

          {/* Notifications / Errors */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons: EMAIL FIRST, GOOGLE SECOND */}
          <div className="space-y-3 pt-1">
            {/* Button 1: EMAIL FIRST */}
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setViewMode('email');
              }}
              className="w-full py-4 px-4 rounded-2xl border-2 border-[#19344A] dark:border-[#67B7E8] bg-white dark:bg-[#111315] text-[#19344A] dark:text-white font-black text-sm flex items-center justify-center gap-3.5 hover:bg-[#FAF9F6] dark:hover:bg-[#19344A]/80 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
            >
              <Mail className="w-5 h-5 text-[#67B7E8] shrink-0 stroke-[2.2]" />
              <span>{isFr ? 'Continuer avec un e-mail' : 'Continue with email'}</span>
            </button>

            {/* Button 2: GOOGLE SECOND */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#111315]/40 text-[#19344A] dark:text-white font-bold text-sm flex items-center justify-center gap-3.5 hover:bg-slate-100 dark:hover:bg-[#111315]/80 active:scale-[0.99] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t.auth.googleContinue || (isFr ? 'Continuer avec Google' : 'Continue with Google')}</span>
            </button>
          </div>

          {/* Quick toggle at bottom */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-[#6F7B85] dark:text-[#FAF9F6]/60">
              {mode === 'signin' ? (isFr ? 'Pas encore de compte ?' : 'No account yet?') : (isFr ? 'Déjà un compte ?' : 'Already have an account?')}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setViewMode('email');
              }}
              className="text-[#67B7E8] font-black hover:underline cursor-pointer"
            >
              {mode === 'signin' ? t.auth.signUp : t.auth.signIn}
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/50 pt-1 leading-relaxed">
            {isFr 
              ? 'En continuant, vous adhérez aux principes de fraternité, de confiance et de confidentialité d’ALLORA.' 
              : 'By continuing, you agree to ALLORA’s community standards of trust, fellowship, and privacy.'}
          </p>
        </div>
      ) : (
        /* STEP 2: EXPANDED EMAIL AUTH FORM — NO (X) ICON */
        <div className="space-y-5">
          {/* Header Row: Back button on Left (no close button) */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setViewMode('options');
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isFr ? 'Options' : 'Back'}</span>
            </button>

            <span className="text-xs font-black uppercase tracking-wider text-[#67B7E8]">
              {mode === 'signin' ? t.auth.signIn : t.auth.signUp}
            </span>

            {/* Circular Close Button (X) — Desktop only (hidden on mobile) */}
            <button
              onClick={handleLowerDismiss}
              className="hidden sm:flex w-8 h-8 rounded-full bg-[#FAF9F6] dark:bg-white/10 text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white items-center justify-center cursor-pointer transition-colors"
              aria-label={t.actions.close}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-8 sm:hidden" />
          </div>

          {/* Segmented Mode Selector: Connexion / Inscription */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF9F6] dark:bg-[#111315]/60 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
                setEmailSentNotice(null);
              }}
              className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#67B7E8] text-white shadow-sm'
                  : 'text-[#6F7B85] dark:text-[#FAF9F6]/60 hover:text-[#19344A] dark:hover:text-white'
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
                setEmailSentNotice(null);
              }}
              className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#67B7E8] text-white shadow-sm'
                  : 'text-[#6F7B85] dark:text-[#FAF9F6]/60 hover:text-[#19344A] dark:hover:text-white'
              }`}
            >
              {t.auth.signUp}
            </button>
          </div>

          {/* Email Confirmation Notice */}
          {emailSentNotice && (
            <div className="p-3.5 rounded-2xl bg-[#67B7E8]/15 border border-[#67B7E8]/40 text-[#19344A] dark:text-white text-xs font-semibold flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#67B7E8] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{emailSentNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-start gap-2.5">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={isFr ? 'Prénom *' : 'First Name *'}
                  required
                  className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#111315] rounded-2xl text-xs font-bold text-[#19344A] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isFr ? 'Nom' : 'Last Name'}
                  className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#111315] rounded-2xl text-xs font-bold text-[#19344A] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adresse@email.com"
                required
                className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#111315] rounded-2xl text-xs font-bold text-[#19344A] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.password}
                required
                minLength={6}
                className="w-full pl-4 pr-11 py-3 bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#111315] rounded-2xl text-xs font-bold text-[#19344A] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6F7B85] hover:text-[#67B7E8] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.auth.confirmPassword}
                  required
                  minLength={6}
                  className="w-full pl-4 pr-11 py-3 bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 focus:border-[#67B7E8] focus:bg-white dark:focus:bg-[#111315] rounded-2xl text-xs font-bold text-[#19344A] dark:text-white placeholder:text-[#6F7B85] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6F7B85] hover:text-[#67B7E8] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Remember Me & Forgot Password (Sign in only) */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#E8E4D9] text-[#67B7E8] focus:ring-[#67B7E8] cursor-pointer accent-[#67B7E8]"
                  />
                  <span className="text-[11px] font-bold text-[#6F7B85]">
                    {t.auth.rememberMe}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(true);
                    setResetEmail(email);
                    setResetStatus(null);
                  }}
                  className="text-[11px] font-bold text-[#67B7E8] hover:underline cursor-pointer"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#67B7E8]/20 transition-all cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                t.auth.signIn
              ) : (
                t.auth.signUp
              )}
            </button>
          </form>

          {/* Quick toggle at bottom */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMsg(null);
                setSuccessMsg(null);
                setEmailSentNotice(null);
              }}
              className="text-xs text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white transition-colors cursor-pointer"
            >
              {mode === 'signin' ? (
                <>
                  {t.auth.noAccount}{' '}
                  <span className="text-[#67B7E8] font-bold hover:underline">{t.auth.signUp}</span>
                </>
              ) : (
                <>
                  {t.auth.hasAccount}{' '}
                  <span className="text-[#67B7E8] font-bold hover:underline">{t.auth.signIn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If used as a modal inside AuthModal, render directly with the drag-to-lower handle
  if (isModal) {
    return (
      <div className="w-full flex justify-center">
        {renderAuthSheet()}
      </div>
    );
  }

  // Standalone Welcome & Complete Landing Page ("Page d'ensemble")
  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] dark:bg-[#111315] text-[#19344A] dark:text-[#FAF9F6] selection:bg-[#67B7E8]/30 transition-colors duration-200 overflow-x-hidden font-sans">
      
      {/* 1. TOP BAR NAVIGATION (Zone 1: Logo, Zone 2: Anchor links, Zone 3: Actions & CTAs) */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#111315]/90 border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 transition-colors duration-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Zone 1: ALLORA Wordmark / Logo */}
          <a href="#" className="flex items-center gap-2 group cursor-pointer">
            <AlloraLogo size="md" showTagline={false} withContainer={true} />
          </a>

          {/* Zone 2: Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-bold text-[#6F7B85] dark:text-[#FAF9F6]/75">
            <a href="#churches" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Églises' : 'Churches'}</a>
            <a href="#events" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Événements' : 'Events'}</a>
            <a href="#needs" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Entraide' : 'Mutual Aid'}</a>
            <a href="#opportunities" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Missions' : 'Opportunities'}</a>
            <a href="#how-it-works" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Comment ça marche' : 'How it works'}</a>
            <a href="#values" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Valeurs' : 'Values'}</a>
          </div>

          {/* Zone 3: Theme switch, Language switch, Se connecter & Commencer CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 sm:p-2.5 rounded-xl text-[#6F7B85] dark:text-[#FAF9F6]/80 hover:bg-[#FAF9F6] dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E8E4D9] dark:border-white/10 text-[#19344A] dark:text-white text-xs font-black uppercase tracking-wider hover:bg-[#FAF9F6] dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>{language}</span>
                <span className="text-[10px] text-[#6F7B85]">▼</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-[#FAF9F6] dark:hover:bg-white/10 transition-colors ${
                        language === l.code ? 'text-[#67B7E8]' : 'text-[#19344A] dark:text-white'
                      }`}
                    >
                      <span>{l.label}</span>
                      {language === l.code && <div className="w-1.5 h-1.5 rounded-full bg-[#67B7E8]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CTA 1: Se connecter */}
            <button
              onClick={() => handleOpenAuth('signin')}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold text-[#19344A] dark:text-white hover:text-[#67B7E8] transition-colors cursor-pointer"
            >
              {t.auth.signIn}
            </button>

            {/* CTA 2: Commencer à servir / Créer un compte */}
            <button
              onClick={() => handleOpenAuth('signup')}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white text-xs font-black shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            >
              {isFr ? 'Commencer' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative w-full pt-10 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#67B7E8]/10 via-[#67B7E8]/5 to-transparent pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Kicker badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#67B7E8]/10 text-[#67B7E8] border border-[#67B7E8]/20 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFr ? 'Plateforme chrétienne d’édification & d’action' : 'Christian community & ministry platform'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#19344A] dark:text-white tracking-tight leading-[1.1] text-balance">
              {isFr ? 'Connectés pour servir. Ensemble pour le Royaume.' : 'Connected to serve. Together for the Kingdom.'}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-[#6F7B85] dark:text-[#FAF9F6]/80 leading-relaxed font-normal max-w-2xl mx-auto">
              {isFr
                ? 'Rejoignez votre église locale, participez à des rassemblements spirituels, partagez des besoins concrets d’entraide et engagez-vous activement dans le service fraternel.'
                : 'Connect with your local church, join spiritual gatherings, share tangible mutual aid, and mobilize your gifts in Christian service.'}
            </p>

            {/* Action CTA Buttons Cluster */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => handleOpenAuth('signup')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#67B7E8]/25 transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <span>{isFr ? 'Commencer à servir' : 'Start Serving'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleOpenAuth('signin')}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-white font-bold text-sm hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] transition-all cursor-pointer shadow-xs"
              >
                {t.auth.signIn}
              </button>
            </div>

            {/* Trust and Values Row */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#6F7B85] dark:text-[#FAF9F6]/65 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#67B7E8]" />
                {isFr ? '100% fraternel & sans publicité' : '100% fellowship & ad-free'}
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#67B7E8]" />
                {isFr ? 'Code d’église privé & sécurisé' : 'Private & encrypted church codes'}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#67B7E8]" />
                {isFr ? 'Données protégées sous Supabase RLS' : 'Protected by Supabase RLS'}
              </span>
            </div>
          </div>

          {/* Hero Visual Showcase Card */}
          <div className="mt-12 sm:mt-16 relative rounded-3xl overflow-hidden shadow-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#111315]">
            <img
              src={heroCathedraleDouala}
              alt="Cathédrale Saint-Pierre-et-Saint-Paul de Douala, Cameroun"
              referrerPolicy="no-referrer"
              className="w-full h-64 sm:h-96 object-cover object-center brightness-95"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111315] via-[#111315]/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
              <div className="max-w-xl space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-[#67B7E8]" />
                  <span>{isFr ? 'Cathédrale Saint-Pierre-et-Saint-Paul · Douala, Cameroun' : 'Saint Peter & Paul Cathedral · Douala, Cameroon'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  {isFr ? 'Découvrez tout ce que vous pouvez vivre sur ALLORA' : 'Discover everything you can experience on ALLORA'}
                </h3>
                <p className="text-xs sm:text-sm text-white/80">
                  {isFr
                    ? 'Explorez ci-dessous les 4 piliers de l’application. Chaque action est immédiatement accessible dès que vous rejoignez votre assemblée.'
                    : 'Explore the 4 core pillars below. Every feature is available the moment you connect.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. APPLICATION PRESENTATION PILLARS (Bento Grid of the 4 Key App Modules) */}
      <section className="w-full py-16 sm:py-24 bg-white dark:bg-[#19344A]/40 border-y border-[#E8E4D9] dark:border-[#67B7E8]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
          
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#67B7E8]">
              {isFr ? 'Fonctionnalités Clés' : 'Core Features'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#19344A] dark:text-white tracking-tight">
              {isFr ? 'Tout ce dont votre communauté a besoin pour grandir' : 'Everything your community needs to grow together'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75">
              {isFr
                ? 'ALLORA rassemble les églises locales, les membres, les serviteurs et les bénévoles autour d’outils clairs, sécurisés et respectueux de la vie privée.'
                : 'ALLORA unites local churches, members, servants, and volunteers around clear, secure, and privacy-first tools.'}
            </p>
          </div>

          {/* Feature 1: Églises & Assemblées Locales */}
          <div id="churches" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl p-6 sm:p-10 bg-[#FAF9F6] dark:bg-[#111315]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/15">
            <div className="lg:col-span-6 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center">
                <Church className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#67B7E8]">01. {isFr ? 'Rassemblement & Paroisses' : 'Gathering & Parishes'}</span>
                <h3 className="text-xl sm:text-3xl font-black text-[#19344A] dark:text-white tracking-tight">
                  {isFr ? 'Votre église locale au centre de la vie communautaire' : 'Your local church at the center of fellowship'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75 leading-relaxed">
                {isFr
                  ? 'Rejoignez votre église en toute sécurité grâce au code d’invitation unique délivré par vos pasteurs, ou enregistrez une nouvelle assemblée pour coordonner vos fidèles, certifier les responsables et diffuser les annonces officielles.'
                  : 'Join your congregation securely using the unique private join code provided by your pastors, or register a new church to coordinate members, certify leaders, and broadcast notices.'}
              </p>
              <div className="space-y-2 pt-1 text-xs text-[#19344A] dark:text-white font-semibold">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Code d’adhésion privé chiffré et non devinable' : 'Private, encrypted and unguessable join code'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Annuaire paroissial certifié et gestion des rôles (pasteur, responsable, membre)' : 'Certified parish directory and role management (pastor, leader, member)'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-5 py-3 rounded-2xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Church className="w-4 h-4" />
                  <span>{isFr ? 'Ajouter une église' : 'Add a church'}</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="px-5 py-3 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-white text-xs font-bold hover:bg-[#FAF9F6] transition-all cursor-pointer"
                >
                  {isFr ? 'Rejoindre mon église' : 'Join my church'}
                </button>
              </div>
            </div>
            <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-lg border border-[#E8E4D9] dark:border-white/10 aspect-4/3 relative">
              <img
                src={churchYaoundeVictoires}
                alt="Cathédrale Notre-Dame-des-Victoires de Yaoundé, Cameroun"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                {isFr ? 'Cathédrale Notre-Dame-des-Victoires — Yaoundé, Cameroun' : 'Our Lady of Victories Cathedral — Yaoundé, Cameroon'}
              </div>
            </div>
          </div>

          {/* Feature 2: Événements & Rassemblements */}
          <div id="events" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl p-6 sm:p-10 bg-[#FAF9F6] dark:bg-[#111315]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/15">
            <div className="lg:col-span-6 order-2 lg:order-1 rounded-2xl overflow-hidden shadow-lg border border-[#E8E4D9] dark:border-white/10 aspect-4/3 relative">
              <img
                src={eventChoraleCameroun}
                alt="Femme pasteur et chorale chrétienne en célébration au Cameroun"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                {isFr ? 'Louange et communion : chorale et pasteur en pleine célébration au Cameroun' : 'Worship & fellowship: choir and pastor celebrating in Cameroon'}
              </div>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center">
                <Calendar className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#67B7E8]">02. {isFr ? 'Événements & Foi en Action' : 'Events & Faith in Action'}</span>
                <h3 className="text-xl sm:text-3xl font-black text-[#19344A] dark:text-white tracking-tight">
                  {isFr ? 'Vivez des rassemblements inspirants et fraternels' : 'Experience impactful and fraternal gatherings'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75 leading-relaxed">
                {isFr
                  ? 'Cultes d’action de grâce, veillées d’intercession, conférences régionales, séminaires pour couples ou camps de jeunesse : publiez vos rendez-vous et suivez les inscriptions avec une gestion de capacité en temps réel.'
                  : 'Worship services, prayer vigils, regional conferences, couple seminars, or youth camps: publish events and manage RSVPs with real-time seat tracking.'}
              </p>
              <div className="space-y-2 pt-1 text-xs text-[#19344A] dark:text-white font-semibold">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Inscription en 1 clic avec contrôle de jauge côté serveur' : '1-click RSVP with server-side capacity control'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Rappels automatiques et calendrier des rendez-vous paroissiaux' : 'Automated reminders and parish event calendar'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-5 py-3 rounded-2xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isFr ? 'Créer un événement' : 'Create an event'}</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="px-5 py-3 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-white text-xs font-bold hover:bg-[#FAF9F6] transition-all cursor-pointer"
                >
                  {isFr ? 'Explorer les événements' : 'Explore events'}
                </button>
              </div>
            </div>
          </div>

          {/* Feature 3: Entraide & Solidarité */}
          <div id="needs" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl p-6 sm:p-10 bg-[#FAF9F6] dark:bg-[#111315]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/15">
            <div className="lg:col-span-6 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#67B7E8]">03. {isFr ? 'Solidarité & Diaconie' : 'Solidarity & Diakonia'}</span>
                <h3 className="text-xl sm:text-3xl font-black text-[#19344A] dark:text-white tracking-tight">
                  {isFr ? 'Une entraide tangible, discrète et sans intermédiaire' : 'Tangible, discreet, direct mutual aid'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75 leading-relaxed">
                {isFr
                  ? 'Exprimez un besoin ponctuel (paniers alimentaires, soutien moral, transport médical, aide matérielle) ou proposez votre secours à un membre dans l’épreuve. Chaque geste concrétise l’amour du prochain.'
                  : 'Express a need (food supplies, prayer support, rides, material aid) or offer your help to a brother or sister in need. Pure Christian solidarity.'}
              </p>
              <div className="space-y-2 pt-1 text-xs text-[#19344A] dark:text-white font-semibold">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Respect strict de la dignité et de la discrétion des bénéficiaires' : 'Strict respect for members’ dignity and confidentiality'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Matching direct d’entraide entre paroissiens et diacres' : 'Direct matching between parishioners and deacons'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-5 py-3 rounded-2xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>{isFr ? 'Publier un besoin' : 'Publish a need'}</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="px-5 py-3 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-white text-xs font-bold hover:bg-[#FAF9F6] transition-all cursor-pointer"
                >
                  {isFr ? 'Offrir de l’aide' : 'Offer help'}
                </button>
              </div>
            </div>
            <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-lg border border-[#E8E4D9] dark:border-white/10 aspect-4/3 relative">
              <img
                src={entraideMarcheMfoundi}
                alt="Solidarité vivrière et partage communautaire à Yaoundé, Cameroun"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                {isFr ? 'Entraide solidaire et partage fraternel au marché du Mfoundi — Yaoundé, Cameroun' : 'Mutual aid & fraternal solidarity at Mfoundi market — Yaoundé, Cameroon'}
              </div>
            </div>
          </div>

          {/* Feature 4: Opportunités de Service & Bénévolat */}
          <div id="opportunities" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl p-6 sm:p-10 bg-[#FAF9F6] dark:bg-[#111315]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/15">
            <div className="lg:col-span-6 order-2 lg:order-1 rounded-2xl overflow-hidden shadow-lg border border-[#E8E4D9] dark:border-white/10 aspect-4/3 relative">
              <img
                src={serviceJeunesseDouala}
                alt="Jeunesse chrétienne camerounaise engagée pour le service et l'entraide communautaire à Douala"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                {isFr ? 'Jeunesse et serviteurs engagés dans la mission locale à Douala, Cameroun' : 'Youth & servants engaged in community mission in Douala, Cameroon'}
              </div>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#67B7E8]">04. {isFr ? 'Ministères & Talents' : 'Ministries & Gifts'}</span>
                <h3 className="text-xl sm:text-3xl font-black text-[#19344A] dark:text-white tracking-tight">
                  {isFr ? 'Mobilisez vos compétences au service du Corps du Christ' : 'Put your gifts to work for the Body of Christ'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75 leading-relaxed">
                {isFr
                  ? 'Accueil du culte, sonorisation, chorale, accompagnement des enfants, logistique, communication ou maraudes caritatives : trouvez facilement les missions de bénévolat qui répondent à votre appel.'
                  : 'Hospitality, audio/video tech, worship band, children’s ministry, logistics, communication, or community outreach: easily discover missions matching your gifts.'}
              </p>
              <div className="space-y-2 pt-1 text-xs text-[#19344A] dark:text-white font-semibold">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Coordination simple des équipes de service et plannings' : 'Simple ministry teams and schedule coordination'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#67B7E8]" />
                  <span>{isFr ? 'Valorisation de chaque vocation au sein de l’assemblée' : 'Empowering every calling inside the congregation'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-5 py-3 rounded-2xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>{isFr ? 'Rejoindre une mission' : 'Join a mission'}</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-5 py-3 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-white text-xs font-bold hover:bg-[#FAF9F6] transition-all cursor-pointer"
                >
                  {isFr ? 'Proposer un service' : 'Offer service'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section id="how-it-works" className="w-full py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#67B7E8]">
              {isFr ? 'Démarrage Facile' : 'Simple Onboarding'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#19344A] dark:text-white tracking-tight">
              {isFr ? 'Comment commencer en 3 étapes simples' : 'How to get started in 3 simple steps'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6F7B85] dark:text-[#FAF9F6]/75">
              {isFr
                ? 'Aucune configuration complexe. Vous êtes prêt à servir et échanger en moins de deux minutes.'
                : 'No complicated setup. You are ready to serve and connect in under two minutes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/15 space-y-4 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-[#67B7E8] text-white flex items-center justify-center font-black text-sm">
                01
              </div>
              <h3 className="text-lg font-black text-[#19344A] dark:text-white">
                {isFr ? 'Créez votre compte gratuit' : 'Create your free account'}
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed">
                {isFr
                  ? 'Inscrivez-vous en un clic via votre adresse e-mail ou votre compte Google en toute confidentialité.'
                  : 'Sign up in seconds using your email address or Google account with zero spam.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/15 space-y-4 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-[#67B7E8] text-white flex items-center justify-center font-black text-sm">
                02
              </div>
              <h3 className="text-lg font-black text-[#19344A] dark:text-white">
                {isFr ? 'Rejoignez votre église' : 'Connect with your church'}
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed">
                {isFr
                  ? 'Saisissez le code privé ALLORA fourni par vos pasteurs ou explorez les paroisses enregistrées.'
                  : 'Enter the private ALLORA code provided by your church leaders or browse verified congregations.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/15 space-y-4 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-[#67B7E8] text-white flex items-center justify-center font-black text-sm">
                03
              </div>
              <h3 className="text-lg font-black text-[#19344A] dark:text-white">
                {isFr ? 'Participez et servez' : 'Participate & serve'}
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed">
                {isFr
                  ? 'Publiez des besoins, inscrivez-vous aux cultes et engagez-vous activement dans les ministères.'
                  : 'Publish needs, register for gatherings, and actively engage in ministry opportunities.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VALUES & TRUST GUARANTEES */}
      <section id="values" className="w-full py-16 sm:py-24 bg-white dark:bg-[#19344A]/40 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-black text-[#19344A] dark:text-white">
                {isFr ? 'Sécurité Postgres & RLS Supabase' : 'Postgres Security & Supabase RLS'}
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed">
                {isFr
                  ? 'Aucune faille de visibilité. Vos échanges communautaires et données d’assemblée sont protégés par des règles de sécurité de niveau entreprise.'
                  : 'Row Level Security ensures your church data and communications remain strictly accessible only to approved members.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center">
                <Lock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-black text-[#19344A] dark:text-white">
                {isFr ? 'Zéro publicité, zéro revente de données' : 'Zero ads, zero data selling'}
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed">
                {isFr
                  ? 'ALLORA est un sanctuaire fraternel. Vos informations ne sont jamais exploitées à des fins publicitaires ou commerciales.'
                  : 'ALLORA is a dedicated space for fellowship. Your personal information is never used for commercial advertising.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#67B7E8]/10 text-[#67B7E8] flex items-center justify-center">
                <Flame className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-black text-[#19344A] dark:text-white">
                {isFr ? 'Pour chaque église, petite ou grande' : 'For every church, big or small'}
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed">
                {isFr
                  ? 'Qu’il s’agisse d’une paroisse de quartier, d’un groupe de maison ou d’une grande cathédrale, ALLORA s’adapte à votre réalité pastorale.'
                  : 'Whether you gather 15 people in a house or thousands in a large church, ALLORA adapts to your pastoral mission.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL BOTTOM CALL TO ACTION BANNER */}
      <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-[#19344A] via-[#111315] to-[#19344A] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#67B7E8]/20 text-[#67B7E8] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFr ? 'Rejoignez la communion fraternelle' : 'Join the Christian fellowship'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {isFr ? 'Prêt à vous connecter pour servir ?' : 'Ready to connect and serve?'}
          </h2>
          <p className="text-xs sm:text-sm text-white/75 max-w-lg mx-auto leading-relaxed">
            {isFr
              ? 'Créez votre compte en quelques instants ou connectez-vous pour retrouver votre assemblée dès aujourd’hui.'
              : 'Create your account in seconds or sign in to reconnect with your local congregation today.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => handleOpenAuth('signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#67B7E8] hover:bg-[#52a5d9] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#67B7E8]/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>{isFr ? 'Créer un compte gratuit' : 'Create free account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenAuth('signin')}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {t.auth.signIn}
            </button>
          </div>
        </div>
      </section>

      {/* 7. COMPLETE FOOTER */}
      <footer className="w-full py-12 bg-white dark:bg-[#111315] border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 text-[#6F7B85] dark:text-[#FAF9F6]/60 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E8E4D9] dark:border-white/10">
            <div className="space-y-2">
              <AlloraLogo size="md" showTagline={false} variant="footer" withContainer={true} />
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 max-w-sm">
                {t.brand.tagline}
              </p>
            </div>

            {/* Quick anchors */}
            <div className="flex flex-wrap gap-5 text-xs font-bold text-[#19344A] dark:text-white">
              <a href="#churches" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Églises' : 'Churches'}</a>
              <a href="#events" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Événements' : 'Events'}</a>
              <a href="#needs" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Entraide' : 'Mutual Aid'}</a>
              <a href="#opportunities" className="hover:text-[#67B7E8] transition-colors">{isFr ? 'Missions' : 'Opportunities'}</a>
              <button
                onClick={() => handleOpenAuth('signin')}
                className="hover:text-[#67B7E8] transition-colors cursor-pointer"
              >
                {t.auth.signIn}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              © 2026 ALLORA. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'} {isFr ? 'Connectés pour servir.' : 'Connected to serve.'}
            </div>

            {/* Legal Links (opens legal dialog) */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLegalModalContent({
                  title: isFr ? 'Mentions Légales' : 'Legal Notice',
                  body: (
                    <div className="space-y-4 text-xs leading-relaxed">
                      <p><strong>Éditeur :</strong> ALLORA Réseau & Association loi 1901.</p>
                      <p><strong>Hébergement :</strong> Infrastructure Cloud hautement sécurisée avec chiffrement et RLS PostgreSQL (Supabase).</p>
                      <p><strong>Objet :</strong> Plateforme d’entraide fraternelle, d’édification et de coordination spirituelle sans visée lucrative.</p>
                    </div>
                  )
                })}
                className="hover:text-[#67B7E8] transition-colors cursor-pointer"
              >
                {isFr ? 'Mentions légales' : 'Legal Notice'}
              </button>

              <button
                onClick={() => setLegalModalContent({
                  title: isFr ? 'Conditions Générales d’Utilisation' : 'Terms of Service',
                  body: (
                    <div className="space-y-4 text-xs leading-relaxed">
                      <p>1. <strong>Respect et fraternité :</strong> Tout utilisateur s’engage à des échanges respectueux, bienveillants et conformes aux valeurs chrétiennes d’amour du prochain.</p>
                      <p>2. <strong>Protection des données :</strong> Les codes d’adhésion d’église sont confidentiels et ne doivent pas être diffusés publiquement.</p>
                      <p>3. <strong>Entraide :</strong> Les partages d’entraide sont bénévoles et gratuits.</p>
                    </div>
                  )
                })}
                className="hover:text-[#67B7E8] transition-colors cursor-pointer"
              >
                {isFr ? 'CGU' : 'Terms'}
              </button>

              <button
                onClick={() => setLegalModalContent({
                  title: isFr ? 'Politique de Confidentialité' : 'Privacy Policy',
                  body: (
                    <div className="space-y-4 text-xs leading-relaxed">
                      <p><strong>Souveraineté des données :</strong> Vos données ne font l’objet d’aucun profilage commercial ni d’aucune vente à des tiers.</p>
                      <p><strong>Contrôle d’accès :</strong> Seuls les membres approuvés de votre communauté paroissiale ont accès aux publications et coordonnées internes de votre église.</p>
                    </div>
                  )
                })}
                className="hover:text-[#67B7E8] transition-colors cursor-pointer"
              >
                {isFr ? 'Confidentialité' : 'Privacy'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 8. THE AUTH MODAL (BOTTOM SHEET ON MOBILE, CENTERED DIALOG ON DESKTOP) */}
      {isAuthOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto transition-opacity duration-300 ${
            isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-in fade-in duration-200'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleLowerDismiss();
            }
          }}
        >
          <div className="w-full max-w-lg">
            {renderAuthSheet()}
          </div>
        </div>
      )}

      {/* 9. FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#19344A] rounded-3xl p-6 border border-[#E8E4D9] dark:border-[#67B7E8]/20 shadow-2xl relative text-[#19344A] dark:text-white">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black mb-1.5">
              {(t.auth as any).forgotPasswordTitle || t.auth.forgotPassword || (isFr ? 'Mot de passe oublié' : 'Forgot Password')}
            </h3>
            <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 mb-4 leading-relaxed">
              {(t.auth as any).forgotPasswordDesc || (isFr ? 'Entrez votre adresse email pour recevoir les instructions de réinitialisation.' : 'Enter your email address to receive reset instructions.')}
            </p>

            {resetStatus && (
              <div className={`mb-3.5 p-3 rounded-xl text-xs font-bold ${
                resetStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/40'
              }`}>
                {resetStatus.text}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="adresse@email.com"
                required
                className="w-full px-4 py-3 bg-[#FAF9F6] dark:bg-[#111315]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 focus:border-[#67B7E8] rounded-2xl text-xs font-bold text-[#19344A] dark:text-white placeholder:text-[#6F7B85] focus:outline-none"
              />

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 rounded-2xl bg-[#67B7E8] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {resetLoading ? '...' : ((t.auth as any).sendResetLink || (isFr ? 'Envoyer le lien' : 'Send Link'))}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. LEGAL INFORMATION MODAL (CGU, MENTIONS LÉGALES, CONFIDENTIALITÉ) */}
      {legalModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#19344A] rounded-3xl p-6 sm:p-8 border border-[#E8E4D9] dark:border-[#67B7E8]/20 shadow-2xl relative text-[#19344A] dark:text-white max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setLegalModalContent(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#FAF9F6] dark:bg-white/10 text-[#6F7B85] hover:text-[#19344A] dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black mb-4 pr-8 text-[#19344A] dark:text-white">
              {legalModalContent.title}
            </h3>

            <div className="text-[#6F7B85] dark:text-[#FAF9F6]/80">
              {legalModalContent.body}
            </div>

            <div className="pt-6">
              <button
                onClick={() => setLegalModalContent(null)}
                className="w-full py-3 rounded-2xl bg-[#67B7E8] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t.actions.close}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
