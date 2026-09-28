import React, { useState } from 'react';
import { UserProfile, ActiveTab, ChurchMember } from '../../types';
import { User } from 'firebase/auth';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  deactivateAccount,
  deleteAccountPermanently,
  sendPasswordReset,
  updateUserPassword
} from '../../firebase/services/userService';
import { leaveChurch, createSupportTicket } from '../../firebase/services/dataService';
import { requestPushNotificationPermission } from '../../firebase/services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

type SettingsSection = 
  | 'main' 
  | 'account' 
  | 'community' 
  | 'notifications' 
  | 'privacy' 
  | 'security' 
  | 'preferences' 
  | 'churches' 
  | 'help' 
  | 'manage';

interface SettingsViewProps {
  user: User;
  profile: UserProfile | null;
  memberships: ChurchMember[];
  onRefreshMemberships?: () => Promise<void>;
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSignOut: () => void;
  onUpdateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  onEditProfile?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  memberships,
  onRefreshMemberships,
  onClose,
  onNavigateTab,
  onSignOut,
  onUpdateProfile,
  onEditProfile,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [currentSection, setCurrentSection] = useState<SettingsSection>('main');

  // Deactivation state
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInputConfirmation, setDeleteInputConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Password & Security state
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Churches state
  const [leavingChurchId, setLeavingChurchId] = useState<string | null>(null);
  const [churchActionMsg, setChurchActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Push notification state
  const [pushStatusMsg, setPushStatusMsg] = useState<string | null>(null);

  // Help & Support state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [supportTab, setSupportTab] = useState<'faq' | 'guide' | 'contact'>('faq');
  const [ticketType, setTicketType] = useState<'bug' | 'content_report' | 'contact' | 'question'>('contact');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccessId, setTicketSuccessId] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // Sign out confirmation modal
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { signOut: authSignOut } = useAuth();

  const handleSignOutExecution = async () => {
    setIsSigningOut(true);
    try {
      setSignOutConfirmOpen(false);
      onClose();
      if (onSignOut) {
        onSignOut();
      }
      await authSignOut();
    } catch (err) {
      console.error('Sign out error in SettingsView:', err);
      try {
        await authSignOut();
      } catch (fallbackErr) {
        console.error('Fallback authSignOut error:', fallbackErr);
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  const renderSectionHeader = (title: string) => (
    <div className="flex items-center gap-3 mb-6 p-4 border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 bg-[#FAF9F6] dark:bg-[#111315]/50 -mx-4 -mt-4 rounded-t-3xl">
      <button 
        onClick={() => {
          setCurrentSection('main');
          setChurchActionMsg(null);
          setResetEmailSent(false);
          setPasswordChangeSuccess(null);
          setPasswordChangeError(null);
        }}
        className="w-10 h-10 rounded-full bg-white dark:bg-[#19344A] flex items-center justify-center text-[#19344A] dark:text-white shadow-sm border border-[#E8E4D9] dark:border-transparent hover:scale-105 transition-all cursor-pointer"
        aria-label={t.actions.back}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <h2 className="text-xl font-black text-[#111315] dark:text-white tracking-tight">{title}</h2>
    </div>
  );

  const SettingRow = ({ icon, title, subtitle, onClick, color = 'bg-[#FAF9F6] dark:bg-[#111315]/50', iconColor = 'text-[#67B7E8]' }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#FAF9F6] dark:hover:bg-[#111315] transition-all text-left group border border-[#E8E4D9] dark:border-[#67B7E8]/10 hover:border-[#67B7E8] cursor-pointer bg-white dark:bg-[#19344A] shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${color} ${iconColor} flex items-center justify-center shrink-0 border border-[#E8E4D9] dark:border-[#67B7E8]/10 group-hover:border-[#67B7E8]/30 transition-colors`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-black text-[#111315] dark:text-white group-hover:text-[#67B7E8] transition-colors">{title}</p>
          {subtitle && <p className="text-[10px] text-[#6F7B85] dark:text-[#FAF9F6]/50 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#6F7B85] group-hover:text-[#67B7E8] group-hover:translate-x-1 transition-all">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );

  const ToggleRow = ({ title, checked, onChange, subtitle }: { title: string; checked: boolean; onChange: (val: boolean) => void; subtitle?: string }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
      <div className="max-w-[75%]">
        <span className="text-sm font-black text-[#111315] dark:text-white block">{title}</span>
        {subtitle && <span className="text-[11px] text-[#6F7B85] font-bold mt-0.5 block">{subtitle}</span>}
      </div>
      <button 
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6.5 rounded-full transition-all relative flex items-center px-1 shrink-0 cursor-pointer ${checked ? 'bg-[#67B7E8]' : 'bg-[#E8E4D9] dark:bg-[#111315]'}`}
        aria-label={title}
      >
        <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  // ================= 1. GESTION DU COMPTE (DEACTIVATE / DELETE) =================
  if (currentSection === 'manage') {
    const handleDeactivate = async () => {
      setIsDeactivating(true);
      setDeactivateError(null);
      try {
        await deactivateAccount(user.uid);
        await onUpdateProfile({
          isDeactivated: true,
          status: 'deactivated',
          deactivatedAt: new Date().toISOString()
        });
        setDeactivateConfirmOpen(false);
      } catch (err) {
        setDeactivateError(err instanceof Error ? err.message : (t.settings.errorDeactivation));
      } finally {
        setIsDeactivating(false);
      }
    };

    const handleDeleteAccount = async () => {
      const confirmText = t.settings.deleteConfirmText;
      if (deleteInputConfirmation.trim().toUpperCase() !== confirmText.toUpperCase()) {
        setDeleteError(`${t.settings.confirmTypeLabel} "${confirmText}".`);
        return;
      }
      setIsDeleting(true);
      setDeleteError(null);
      try {
        await deleteAccountPermanently(user.uid);
        onSignOut();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : (t.settings.errorDelete));
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.categoryAccountData)}
        <div className="p-4 space-y-6">
          <div className="p-6 rounded-3xl bg-[#FAF9F6] dark:bg-blue-900/20 border border-[#E8E4D9] dark:border-blue-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-800 text-[#67B7E8] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#19344A] dark:text-white mb-1">{t.settings.sensitiveActions}</h3>
              <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70 leading-relaxed font-medium">
                {t.settings.sensitiveActionsDesc}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => {
                setDeactivateError(null);
                setDeactivateConfirmOpen(true);
              }}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 text-left hover:bg-[#FAF9F6] dark:hover:bg-#1D334D/50 transition-colors cursor-pointer"
            >
              <p className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.deactivateAccountTitle}</p>
              <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70 font-medium">{t.settings.deactivateAccountDesc}</p>
            </button>

            <button 
              onClick={() => {
                setDeleteError(null);
                setDeleteInputConfirmation('');
                setDeleteConfirmOpen(true);
              }}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#19344A] dark:border-[#19344A] text-left hover:bg-[#FAF9F6] dark:hover:bg-[#19344A]/30 transition-colors group cursor-pointer"
            >
              <p className="text-sm font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.deleteAccountTitle}</p>
              <p className="text-[11px] text-[#19344A] dark:text-[#67B7E8] font-medium group-hover:text-[#67B7E8]">{t.settings.deleteAccountDesc}</p>
            </button>
          </div>

          {/* Deactivation Modal */}
          {deactivateConfirmOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white dark:bg-[#19344A] rounded-3xl p-6 shadow-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-4 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-[#19344A] dark:text-white">{t.settings.confirmDeactivation}</h3>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70 leading-relaxed">
                  {t.settings.deactivationFinalNotice}
                </p>
                {deactivateError && (
                  <p className="text-xs font-bold text-[#19344A] bg-[#FAF9F6] dark:bg-blue-950/40 p-3 rounded-xl border border-[#19344A] dark:border-[#19344A]">{deactivateError}</p>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setDeactivateConfirmOpen(false)}
                    className="py-3 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-bold hover:bg-slate-200 dark:hover:bg-#253C5A cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={isDeactivating}
                    className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {isDeactivating ? (t.settings.requesting) : (t.settings.deactivateBtn)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Modal */}
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white dark:bg-[#19344A] rounded-3xl p-6 shadow-2xl border border-[#19344A] dark:border-[#19344A] space-y-4 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.confirmDelete}</h3>
                <div className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70 space-y-2">
                  <p>{t.settings.deleteInstructions}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t.settings.deleteInstructions1}</li>
                    <li>{t.settings.deleteInstructions2}</li>
                    <li>{t.settings.deleteWarning}</li>
                  </ul>
                  <p className="pt-2">{t.settings.confirmTypeLabel} <strong>{t.settings.deleteConfirmText}</strong> :</p>
                </div>

                <input
                  type="text"
                  value={deleteInputConfirmation}
                  onChange={(e) => setDeleteInputConfirmation(e.target.value)}
                  placeholder={t.settings.deleteInputPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-[#19344A] dark:text-white text-sm font-bold uppercase tracking-wider"
                />

                {deleteError && (
                  <p className="text-xs font-bold text-[#19344A] bg-[#FAF9F6] dark:bg-blue-950/40 p-3 rounded-xl border border-[#19344A] dark:border-[#19344A]">{deleteError}</p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="py-3 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-bold hover:bg-slate-200 dark:hover:bg-#253C5A cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteInputConfirmation.trim().toUpperCase() !== t.settings.deleteConfirmText.toUpperCase()}
                    className="py-3 rounded-xl bg-[#19344A] hover:bg-[#19344A] text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? (t.settings.saving) : (t.settings.deleteFinalBtn)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= 2. SÉCURITÉ DU COMPTE =================
  if (currentSection === 'security') {
    const handleSendPasswordReset = async () => {
      setResetEmailError(null);
      try {
        await sendPasswordReset(user.email || '');
        setResetEmailSent(true);
      } catch (err) {
        setResetEmailError(err instanceof Error ? err.message : (t.settings.errorResetEmail));
      }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordChangeError(null);
      setPasswordChangeSuccess(null);

      if (newPassword.length < 6) {
        setPasswordChangeError(t.auth.errorPasswordLength);
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordChangeError(t.auth.errorPasswordMatch);
        return;
      }

      setIsChangingPassword(true);
      try {
        await updateUserPassword(newPassword);
        setPasswordChangeSuccess(t.settings.passwordChangeSuccess);
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setPasswordChangeError(err instanceof Error ? err.message : (t.settings.errorPasswordChange));
      } finally {
        setIsChangingPassword(false);
      }
    };

    const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.accountSecurity)}
        <div className="p-4 space-y-6">
          {/* Method Info */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-3">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest">{t.settings.activeConnection}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#19344A] dark:text-white">{user.email}</p>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">
                  {isGoogleUser ? t.settings.googleAuth : t.settings.emailAuth}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FAF9F6] dark:bg-blue-900/20 text-[#67B7E8] border border-[#E8E4D9] dark:border-blue-800">
                {t.settings.secured}
              </span>
            </div>
          </div>

          {/* Password Reset Email */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#19344A] dark:text-white mb-1">{t.settings.emailReset}</h3>
              <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70 leading-relaxed font-medium">
                {t.settings.emailResetDesc} <strong>{user.email}</strong>.
              </p>
            </div>

            {resetEmailSent ? (
              <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-blue-900/20 border border-[#E8E4D9] dark:border-blue-800 text-xs font-bold text-[#67B7E8]">
                {t.settings.emailSent}
              </div>
            ) : (
              <button
                onClick={handleSendPasswordReset}
                className="w-full py-3.5 rounded-2xl bg-[#19344A] dark:bg-[#1D334D] hover:bg-[#19344A] dark:hover:bg-#253C5A text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                {t.settings.sendResetBtn}
              </button>
            )}

            {resetEmailError && (
              <p className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 bg-[#FAF9F6] dark:bg-blue-950/40 p-3 rounded-xl border border-[#19344A] dark:border-[#19344A]">{resetEmailError}</p>
            )}
          </div>

          {/* Change password directly if password provider */}
          {!isGoogleUser && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-4">
              <div>
                <h3 className="text-sm font-black text-[#19344A] dark:text-white mb-1">{t.settings.directChange}</h3>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.directChangeDesc}</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.settings.newPasswordPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-[#19344A] dark:text-white text-xs"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.settings.confirmPasswordPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-[#19344A] dark:text-white text-xs"
                />

                {passwordChangeSuccess && (
                  <p className="text-xs font-bold text-[#67B7E8] bg-[#FAF9F6] dark:bg-blue-900/20 p-3 rounded-xl border border-[#E8E4D9] dark:border-blue-800">{passwordChangeSuccess}</p>
                )}
                {passwordChangeError && (
                  <p className="text-xs font-bold text-[#19344A] bg-[#FAF9F6] dark:bg-blue-950/40 p-3 rounded-xl border border-[#19344A] dark:border-[#19344A]">{passwordChangeError}</p>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword}
                  className="w-full py-3.5 rounded-2xl bg-[#67B7E8] hover:bg-[#67B7E8] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isChangingPassword ? (t.settings.saving) : t.settings.updatePasswordBtn}
                </button>
              </form>
            </div>
          )}

          {/* Sessions Info */}
          <div className="p-6 rounded-3xl bg-[#FAF9F6] dark:bg-[#19344A]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-3">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest">{t.settings.sessionsTitle}</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.currentDevice}</span>
              <span className="text-[#67B7E8] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#67B7E8] animate-pulse" />
                {t.settings.online}
              </span>
            </div>
            <p className="text-[11px] text-[#19344A] leading-relaxed">
              {t.settings.transparencyInfo}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. NOTIFICATIONS =================
  if (currentSection === 'notifications') {
    const prefs = profile?.notificationPreferences || {};
    const updatePref = (key: string, val: boolean) => {
      onUpdateProfile({ 
        notificationPreferences: { ...prefs, [key]: val } 
      });
    };

    const handleEnablePush = async () => {
      setPushStatusMsg(null);
      const uid = profile?.userId || (profile as any)?.uid;
      if (!uid) return;
      const granted = await requestPushNotificationPermission(uid);
      if (granted) {
        setPushStatusMsg(t.settings.pushEnabledSuccess);
        await onUpdateProfile({ pushNotificationsEnabled: true });
      } else {
        setPushStatusMsg(t.settings.pushPermissionDenied);
      }
    };

    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.categoryNotifications)}
        <div className="p-4 space-y-6">
          <div className="p-6 rounded-3xl bg-[#FAF9F6] dark:bg-blue-950/30 border border-[#E8E4D9] dark:border-blue-900/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#67B7E8] text-white flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.pushAlerts}</p>
                <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.pushAlertsDesc}</p>
              </div>
            </div>

            <button
              onClick={handleEnablePush}
              className="w-full py-3 rounded-xl bg-[#67B7E8] hover:bg-[#67B7E8] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              {t.settings.enablePushBtn}
            </button>
            {pushStatusMsg && (
              <p className="text-xs font-bold text-center text-[#67B7E8] pt-1">{pushStatusMsg}</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest px-1">{t.settings.categoriesPrefs}</h3>
            <ToggleRow title={t.settings.prefsCommunityNeeds} checked={prefs.needs !== false} onChange={(v) => updatePref('needs', v)} />
            <ToggleRow title={t.settings.prefsResources} checked={prefs.resources !== false} onChange={(v) => updatePref('resources', v)} />
            <ToggleRow title={t.settings.prefsHelpRequests} checked={prefs.helpRequests !== false} onChange={(v) => updatePref('helpRequests', v)} />
            <ToggleRow title={t.settings.prefsCollaborations} checked={prefs.collaborations !== false} onChange={(v) => updatePref('collaborations', v)} />
            <ToggleRow title={t.settings.prefsEvents} checked={prefs.events !== false} onChange={(v) => updatePref('events', v)} />
            <ToggleRow title={t.settings.prefsCommunity} checked={prefs.community !== false} onChange={(v) => updatePref('community', v)} />
            <ToggleRow title={t.settings.prefsChurches} checked={prefs.churches !== false} onChange={(v) => updatePref('churches', v)} />
            <ToggleRow title={t.settings.prefsSystem} checked={prefs.system !== false} onChange={(v) => updatePref('system', v)} />
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => onUpdateProfile({ notificationPreferences: { needs: true, resources: true, helpRequests: true, collaborations: true, events: true, community: true, churches: true, system: true } })}
                className="py-3 rounded-xl bg-[#19344A] dark:bg-[#1D334D] text-white text-xs font-bold cursor-pointer"
              >
                {t.settings.enableAll}
              </button>
              <button 
                onClick={() => onUpdateProfile({ notificationPreferences: { needs: false, resources: false, helpRequests: false, collaborations: false, events: false, community: false, churches: false, system: false } })}
                className="py-3 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-bold cursor-pointer"
              >
                {t.settings.disableAll}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 4. CONFIDENTIALITÉ =================
  if (currentSection === 'privacy') {
    const settings = profile?.privacySettings || {};
    const updatePrivacy = (key: string, val: any) => {
      onUpdateProfile({ 
        privacySettings: { ...settings, [key]: val } 
      });
    };

    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.categoryPrivacy)}
        <div className="p-4 space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest px-1">{t.settings.visibilityTitle}</h3>
            <ToggleRow 
              title={t.settings.showLocation} 
              subtitle={t.settings.showLocationDesc}
              checked={settings.locationVisibility !== false} 
              onChange={(v) => updatePrivacy('locationVisibility', v)} 
            />
            <ToggleRow 
              title={t.settings.showSkills} 
              subtitle={t.settings.showSkillsDesc}
              checked={settings.skillsVisibility !== false} 
              onChange={(v) => updatePrivacy('skillsVisibility', v)} 
            />
            <ToggleRow 
              title={t.settings.showActivities} 
              subtitle={t.settings.showActivitiesDesc}
              checked={settings.activityVisibility !== false} 
              onChange={(v) => updatePrivacy('activityVisibility', v)} 
            />
            <ToggleRow 
              title={t.settings.showPosts} 
              subtitle={t.settings.showPostsDesc}
              checked={settings.postsVisibility !== false} 
              onChange={(v) => updatePrivacy('postsVisibility', v)} 
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest px-1">{t.settings.scopeTitle}</h3>
            
            <div className="p-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-3">
              <p className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.whoCanSeeProfile}</p>
              <div className="flex gap-2">
                {[
                  { id: 'public', label: t.needs.visibilityPublic },
                  { id: 'church', label: t.needs.visibilityChurch },
                  { id: 'private', label: t.events.visibilityPrivate }
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => updatePrivacy('profileVisibility', opt.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${settings.profileVisibility === opt.id ? 'bg-[#67B7E8] text-white shadow-md' : 'bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-3">
              <p className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.whoCanSeeContact}</p>
              <div className="flex gap-2">
                {[
                  { id: 'public', label: t.needs.visibilityPublic },
                  { id: 'church', label: t.needs.visibilityChurch },
                  { id: 'private', label: t.events.visibilityPrivate }
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => updatePrivacy('contactVisibility', opt.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${settings.contactVisibility === opt.id ? 'bg-[#67B7E8] text-white shadow-md' : 'bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ================= 5. APPARENCE ET LANGUE (FRANÇAIS, ENGLISH, SWAHILI) =================
  if (currentSection === 'preferences') {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.categoryAppearance)}
        <div className="p-4 space-y-6">
          {/* Language Selection: Strict requirement of ONLY Français, English, Swahili */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest px-1">{t.settings.interfaceLanguage}</h3>
            <div className="space-y-2">
              {/* 1. Français - Default */}
              <button 
                onClick={() => {
                  setLanguage('fr');
                  onUpdateProfile({ preferences: { ...(profile?.preferences || {}), language: 'fr' } });
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#19344A] border transition-all cursor-pointer ${language === 'fr' ? 'border-[#67B7E8] ring-2 ring-[#67B7E8]/20 shadow-xs' : 'border-[#E8E4D9] dark:border-[#67B7E8]/10'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-5 rounded overflow-hidden shadow-xs shrink-0 border border-[#E8E4D9] dark:border-[#67B7E8]/20 flex">
                    <span className="w-1/3 h-full bg-[#002395]" />
                    <span className="w-1/3 h-full bg-white" />
                    <span className="w-1/3 h-full bg-[#ED2939]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#19344A] dark:text-white">Français</p>
                    <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.defaultLang}</p>
                  </div>
                </div>
                {language === 'fr' && (
                  <div className="w-6 h-6 rounded-full bg-[#67B7E8] flex items-center justify-center text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>

              {/* 2. English */}
              <button 
                onClick={() => {
                  setLanguage('en');
                  onUpdateProfile({ preferences: { ...(profile?.preferences || {}), language: 'en' } });
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#19344A] border transition-all cursor-pointer ${language === 'en' ? 'border-[#67B7E8] ring-2 ring-[#67B7E8]/20 shadow-xs' : 'border-[#E8E4D9] dark:border-[#67B7E8]/10'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-5 rounded overflow-hidden shadow-xs shrink-0 border border-[#E8E4D9] dark:border-[#67B7E8]/20">
                    <svg viewBox="0 0 60 30" className="w-full h-full">
                      <clipPath id="uk-flag">
                        <path d="M0,0 v30 h60 v-30 z"/>
                      </clipPath>
                      <g clipPath="url(#uk-flag)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
                        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#19344A] dark:text-white">English</p>
                    <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.completeTranslation}</p>
                  </div>
                </div>
                {language === 'en' && (
                  <div className="w-6 h-6 rounded-full bg-[#67B7E8] flex items-center justify-center text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            </div>
          </section>

          {/* Theme selection */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest px-1">{t.settings.appearanceTheme}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: t.settings.light, icon: Sun },
                { id: 'dark', label: t.settings.dark, icon: Moon },
                { id: 'system', label: t.settings.system, icon: Laptop }
              ].map(opt => {
                const ThemeIcon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id as any);
                      onUpdateProfile({ preferences: { ...(profile?.preferences || {}), theme: opt.id as any } });
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${theme === opt.id ? 'bg-[#67B7E8] text-white border-[#67B7E8] shadow-md' : 'bg-white dark:bg-[#19344A] text-[#19344A] dark:text-[#FAF9F6]/70 border-[#E8E4D9] dark:border-[#67B7E8]/10'}`}
                  >
                    <ThemeIcon className="w-6 h-6 mb-2 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ================= 6. MES ÉGLISES (COMMUNAUTÉS) =================
  if (currentSection === 'churches') {
    const handleLeave = async (churchId: string) => {
      setLeavingChurchId(churchId);
      setChurchActionMsg(null);
      try {
        const res = await leaveChurch(churchId, user.uid);
        setChurchActionMsg({ type: 'success', text: res.message });
        if (onRefreshMemberships) await onRefreshMemberships();
      } catch (err) {
        setChurchActionMsg({
          type: 'error',
          text: err instanceof Error ? err.message : (t.settings.errorLeaveChurch)
        });
      } finally {
        setLeavingChurchId(null);
      }
    };

    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.myChurchesTitle)}
        <div className="p-4 space-y-6">
          <button 
            onClick={() => onNavigateTab('churches')}
            className="w-full py-4 rounded-2xl bg-[#19344A] dark:bg-[#1D334D] hover:bg-[#19344A] text-white text-xs font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {t.settings.joinDiscoverChurch}
          </button>

          {churchActionMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold border ${churchActionMsg.type === 'success' ? 'bg-[#FAF9F6] dark:bg-blue-900/20 text-[#67B7E8] border-[#E8E4D9] dark:border-blue-800' : 'bg-[#FAF9F6] dark:bg-blue-950 text-[#19344A] dark:text-[#FAF9F6]/70 border-[#19344A] dark:border-[#19344A]'}`}>
              {churchActionMsg.text}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest px-1">{t.settings.affiliatedChurches} ({memberships.length})</h3>
            
            {memberships.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 text-center space-y-3">
                <p className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.noChurchJoined}</p>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.noChurchJoinedDesc}</p>
                <button onClick={() => onNavigateTab('churches')} className="text-[#67B7E8] text-xs font-black uppercase tracking-wider hover:underline cursor-pointer">
                  {t.settings.findMyChurch}
                </button>
              </div>
            ) : (
              memberships.map((m) => {
                const isLeader = m.role === 'OWNER' || m.role === 'ADMIN';
                return (
                  <div key={m.membershipId} className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-[#19344A] dark:text-white">{m.churchName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${m.role === 'OWNER' ? 'bg-[#19344A] text-white' : m.role === 'ADMIN' ? 'bg-blue-100 dark:bg-blue-900 text-[#67B7E8]' : 'bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A]'}`}>
                            {m.role === 'OWNER' ? t.settings.roleOwner : m.role === 'ADMIN' ? t.settings.roleAdmin : t.settings.roleMember}
                          </span>
                          <span className="text-[10px] text-[#19344A]">{t.settings.since} {new Date(m.joinedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateTab('churches')}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#67B7E8] text-xs font-bold hover:bg-[#FAF9F6] dark:hover:bg-#253C5A cursor-pointer"
                      >
                        {t.settings.viewSheet}
                      </button>
                    </div>

                    {/* Leader tools panel */}
                    {isLeader && (
                      <div className="p-4 rounded-2xl bg-[#FAF9F6]/60 dark:bg-blue-900/20 border border-[#E8E4D9] dark:border-blue-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#19344A] dark:text-white">{t.settings.adminSpace} ({m.role})</span>
                          {m.joinCode && (
                            <span className="font-mono text-[11px] bg-white dark:bg-[#1D334D] px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                              {t.settings.codeLabel} {m.joinCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70">
                          {t.settings.adminRightsDesc}
                        </p>
                      </div>
                    )}

                    <div className="pt-1 border-t border-slate-50 dark:border-[#67B7E8]/10 flex justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm(t.settings.leaveChurchConfirm)) {
                            handleLeave(m.churchId);
                          }
                        }}
                        disabled={leavingChurchId === m.churchId}
                        className="text-xs font-bold text-[#19344A] hover:text-[#19344A] hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {leavingChurchId === m.churchId ? (t.settings.processing) : t.settings.leaveChurch}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 7. AIDE & ASSISTANCE =================
  if (currentSection === 'help') {
    const faqs = [
      { q: t.settings.faq1Q, a: t.settings.faq1A },
      { q: t.settings.faq2Q, a: t.settings.faq2A },
      { q: t.settings.faq3Q, a: t.settings.faq3A },
      { q: t.settings.faq4Q, a: t.settings.faq4A },
      { q: t.settings.faq5Q, a: t.settings.faq5A },
      { q: t.settings.faq6Q, a: t.settings.faq6A },
    ];

    const handleSubmitTicket = async (e: React.FormEvent) => {
      e.preventDefault();
      setTicketError(null);
      setTicketSuccessId(null);

      if (!ticketSubject.trim() || !ticketMessage.trim()) {
        setTicketError(t.settings.ticketFillAll);
        return;
      }

      setTicketSubmitting(true);
      try {
        const id = await createSupportTicket({
          userId: user.uid,
          userEmail: user.email || '',
          userName: profile?.displayName || 'Membre ALLORA',
          type: ticketType,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim()
        });
        setTicketSuccessId(id);
        setTicketSubject('');
        setTicketMessage('');
      } catch (err) {
        setTicketError(err instanceof Error ? err.message : t.settings.errorResetEmail);
      } finally {
        setTicketSubmitting(false);
      }
    };

    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.categoryHelp)}
        <div className="p-4 space-y-6">
          {/* Sub-tabs */}
          <div className="flex rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D] p-1">
            <button
              onClick={() => setSupportTab('faq')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${supportTab === 'faq' ? 'bg-white dark:bg-[#19344A] text-[#67B7E8] shadow-xs' : 'text-[#19344A] dark:text-[#FAF9F6]/70'}`}
            >
              {t.settings.faqTitle.split(' ')[0]}
            </button>
            <button
              onClick={() => setSupportTab('guide')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${supportTab === 'guide' ? 'bg-white dark:bg-[#19344A] text-[#67B7E8] shadow-xs' : 'text-[#19344A] dark:text-[#FAF9F6]/70'}`}
            >
              {t.settings.guidesTitle.split(' ')[0]}
            </button>
            <button
              onClick={() => setSupportTab('contact')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${supportTab === 'contact' ? 'bg-white dark:bg-[#19344A] text-[#67B7E8] shadow-xs' : 'text-[#19344A] dark:text-[#FAF9F6]/70'}`}
            >
              {t.settings.reportProblem}
            </button>
          </div>

          {/* Tab 1: FAQ */}
          {supportTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((f, idx) => (
                <div key={idx} className="rounded-2xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#19344A] dark:text-white">{f.q}</span>
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      className={`text-[#19344A] transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-4 pb-4 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 leading-relaxed border-t border-slate-50 dark:border-[#67B7E8]/10 pt-3">
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Guides */}
          {supportTab === 'guide' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center font-black">1</div>
                <h4 className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.guide1Title}</h4>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.guide1Desc}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center font-black">2</div>
                <h4 className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.guide2Title}</h4>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.guide2Desc}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center font-black">3</div>
                <h4 className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.guide3Title}</h4>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.guide3Desc}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center font-black">4</div>
                <h4 className="text-sm font-bold text-[#19344A] dark:text-white">{t.settings.guide4Title}</h4>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.guide4Desc}</p>
              </div>
            </div>
          )}

          {/* Tab 3: Contact & Report */}
          {supportTab === 'contact' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-4">
              <div>
                <h4 className="text-sm font-black text-[#19344A] dark:text-white mb-1">{t.settings.reportProblem}</h4>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70">{t.settings.reportProblemDesc}</p>
              </div>

              {ticketSuccessId ? (
                <div className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3">
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </div>
                  <p className="text-sm font-bold text-[#67B7E8] dark:text-[#67B7E8]">{t.settings.ticketSuccess}</p>
                  <p className="text-xs text-[#67B7E8] dark:text-[#67B7E8] font-mono">Ticket ID: {ticketSuccessId}</p>
                  <button
                    onClick={() => setTicketSuccessId(null)}
                    className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    {t.actions.confirm}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#19344A] mb-1 block">{t.settings.ticketTypeLabel}</label>
                    <select
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-[#19344A] dark:text-white text-xs font-bold"
                    >
                      <option value="contact">{t.settings.ticketContact}</option>
                      <option value="bug">{t.settings.ticketBug}</option>
                      <option value="content_report">{t.settings.ticketContentReport}</option>
                      <option value="question">{t.settings.ticketQuestion}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#19344A] mb-1 block">{t.settings.ticketSubject}</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder={t.settings.ticketSubjectPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-[#19344A] dark:text-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#19344A] mb-1 block">{t.settings.ticketMessage}</label>
                    <textarea
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder={t.settings.ticketMessagePlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] text-[#19344A] dark:text-white text-xs"
                    />
                  </div>

                  {ticketError && (
                    <p className="text-xs font-bold text-[#19344A] bg-[#FAF9F6] p-3 rounded-xl border border-[#19344A]">{ticketError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={ticketSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-[#67B7E8] hover:bg-[#67B7E8] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {ticketSubmitting ? t.settings.requesting : t.settings.sendTicketBtn}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= 8. INFORMATIONS DU PROFIL (COMPTE) =================
  if (currentSection === 'account') {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.profileInfo)}
        <div className="p-4 space-y-4">
          <button 
            onClick={() => {
              if (onEditProfile) {
                onEditProfile();
              } else {
                onClose();
              }
            }} 
            className="w-full flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 group cursor-pointer shadow-xs hover:border-[#67B7E8]"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-[#19344A] dark:text-white">{t.settings.editMyInfo}</p>
                  <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70 font-medium">{t.settings.editMyInfoDesc}</p>
                </div>
             </div>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#19344A] group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <div className="p-6 rounded-3xl bg-[#FAF9F6] dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 space-y-4">
            <h3 className="text-xs font-black text-[#19344A] uppercase tracking-widest">{t.settings.profileInfo}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase font-black text-[#19344A] mb-1">{t.settings.verifiedEmail}</p>
                <p className="text-sm font-bold text-[#19344A] dark:text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-[#19344A] mb-1">{t.settings.phoneNumber}</p>
                <p className="text-sm font-bold text-[#19344A] dark:text-white">{profile?.phoneNumber || t.settings.notSpecified}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-[#19344A] mb-1">{t.settings.accountStatus}</p>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-[#67B7E8] dark:text-[#67B7E8]">
                  {profile?.status === 'deactivated' ? t.settings.statusDeactivated : t.settings.statusActive}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 9. COMMUNAUTÉS AUXQUELLES JE PARTICIPE =================
  if (currentSection === 'community') {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        {renderSectionHeader(t.settings.manageMyCommunities)}
        <div className="p-4 space-y-2">
          <SettingRow title={t.profile.myNeeds} subtitle={t.needs.title} onClick={() => onNavigateTab('needs')} color="bg-[#FAF9F6] dark:bg-blue-950/40" iconColor="text-[#67B7E8]" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>} />
          <SettingRow title={t.profile.myResources} subtitle={t.resources.title} onClick={() => onNavigateTab('resources')} color="bg-[#FAF9F6] dark:bg-blue-950/40" iconColor="text-[#67B7E8]" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21 16-9 5-9-5V8l9-5 9 5v8Z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>} />
          <SettingRow title={t.profile.myOpportunities} subtitle={t.opportunities.title} onClick={() => onNavigateTab('opportunities')} color="bg-[#FAF9F6] dark:bg-blue-950/40" iconColor="text-[#67B7E8]" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} />
          <SettingRow title={t.home.tabs.events} subtitle={t.events.title} onClick={() => onNavigateTab('events')} color="bg-[#FAF9F6] dark:bg-blue-950/40" iconColor="text-[#67B7E8]" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
          <SettingRow title={t.profile.myPosts} subtitle={t.community.title} onClick={() => onNavigateTab('community')} color="bg-[#FAF9F6] dark:bg-blue-950/40" iconColor="text-[#67B7E8]" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
          <SettingRow title={t.home.tabs.collaborations} subtitle={t.home.tabs.collaborations} onClick={() => onClose()} color="bg-[#19344A] dark:bg-[#1D334D]" iconColor="text-white" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>} />
        </div>
      </div>
    );
  }

  // ================= 10. MAIN MENU (CATEGORIES ORGANIZED CLEANLY) =================
  return (
    <div className="animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-[#E8E4D9] dark:border-[#67B7E8]/10 mb-4">
        <h2 className="text-xl font-black text-[#111315] dark:text-white tracking-tight">{t.settings.title}</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-[#FAF9F6] dark:hover:bg-#1D334D transition-colors cursor-pointer" aria-label={t.actions.close}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-8">
        {/* Category 1: Compte */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-[#111315] dark:text-white uppercase tracking-widest px-1">{t.settings.categoryAccount}</h3>
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.settings.editMyInfo} 
              subtitle={t.settings.editMyInfoDesc} 
              onClick={() => {
                if (onEditProfile) {
                  onEditProfile();
                } else {
                  onClose();
                }
              }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} 
              color="bg-[#EAF6FD] dark:bg-[#67B7E8]/15" 
              iconColor="text-[#67B7E8]"
            />
            <SettingRow 
              title={t.settings.profileInfo} 
              subtitle={t.settings.profileInfoSubtitle} 
              onClick={() => setCurrentSection('account')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} 
              color="bg-[#DCEFFA] dark:bg-[#19344A]" 
              iconColor="text-[#19344A] dark:text-[#67B7E8]"
            />
            <SettingRow 
              title={t.settings.accountSecurity} 
              subtitle={t.settings.accountSecurityDesc} 
              onClick={() => setCurrentSection('security')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><circle cx="12" cy="13" r="3"/></svg>} 
              color="bg-[#FAF9F6] dark:bg-[#111315]/60" 
              iconColor="text-[#6F7B85] dark:text-white"
            />
          </div>
        </section>

        {/* Category 2: Préférences */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-[#111315] dark:text-white uppercase tracking-widest px-1">{t.settings.categoryAppearance}</h3>
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.settings.languageTitle} 
              subtitle={language === 'fr' ? 'Français' : language === 'en' ? 'English' : 'Swahili'} 
              onClick={() => setCurrentSection('preferences')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>} 
              color="bg-[#EAF6FD] dark:bg-[#67B7E8]/15" 
              iconColor="text-[#67B7E8]"
            />
            <SettingRow 
              title={t.settings.categoryNotifications} 
              subtitle={t.settings.notifTitleDesc} 
              onClick={() => setCurrentSection('notifications')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} 
              color="bg-[#FFF4DD] dark:bg-[#F59E0B]/15" 
              iconColor="text-[#F59E0B]"
            />
            <SettingRow 
              title={t.settings.displayPrefs} 
              subtitle={theme === 'dark' ? t.settings.darkMode : theme === 'light' ? t.settings.lightMode : t.settings.systemMode} 
              onClick={() => setCurrentSection('preferences')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>} 
              color="bg-[#FAF9F6] dark:bg-[#111315]/60" 
              iconColor="text-[#6F7B85] dark:text-[#FAF9F6]/80"
            />
          </div>
        </section>

        {/* Category 3: Confidentialité */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-[#111315] dark:text-white uppercase tracking-widest px-1">{t.settings.categoryPrivacy}</h3>
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.settings.profileVisibility} 
              subtitle={t.settings.profileVisibilityDesc} 
              onClick={() => setCurrentSection('privacy')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} 
              color="bg-[#FAF9F6] dark:bg-[#111315]/50" 
              iconColor="text-[#19344A] dark:text-[#DCEFFA]"
            />
            <SettingRow 
              title={t.settings.privacyPrefs} 
              subtitle={t.settings.privacyPrefsDesc} 
              onClick={() => setCurrentSection('privacy')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} 
              color="bg-[#EAF7F0] dark:bg-[#22A06B]/15" 
              iconColor="text-[#22A06B]"
            />
            <SettingRow 
              title={t.settings.personalDataManagement} 
              subtitle={t.settings.personalDataManagementDesc} 
              onClick={() => setCurrentSection('privacy')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} 
              color="bg-[#EAF6FD] dark:bg-[#67B7E8]/15" 
              iconColor="text-[#67B7E8]"
            />
          </div>
        </section>

        {/* Category 4: Mes communautés */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-[#111315] dark:text-white uppercase tracking-widest px-1">{t.settings.categoryCommunities}</h3>
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.settings.myChurchesTitle} 
              subtitle={t.settings.myChurchesDesc} 
              onClick={() => setCurrentSection('churches')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} 
              color="bg-[#EAF7F0] dark:bg-[#22A06B]/15" 
              iconColor="text-[#22A06B]"
            />
            <SettingRow 
              title={t.settings.myMemberships} 
              subtitle={t.settings.myMembershipsDesc} 
              onClick={() => setCurrentSection('churches')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} 
              color="bg-[#EAF6FD] dark:bg-[#67B7E8]/15" 
              iconColor="text-[#67B7E8]"
            />
            <SettingRow 
              title={language === 'fr' ? 'Mes demandes' : 'My Requests'} 
              subtitle={language === 'fr' ? 'Suivre mes adhésions en attente' : 'Track pending memberships'} 
              onClick={() => setCurrentSection('churches')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} 
              color="bg-[#FFF4DD] dark:bg-[#F59E0B]/15" 
              iconColor="text-[#F59E0B]"
            />
            <SettingRow 
              title={language === 'fr' ? 'Mes rôles' : 'My Roles'} 
              subtitle={language === 'fr' ? 'Gérer mes responsabilités' : 'Manage my responsibilities'} 
              onClick={() => setCurrentSection('churches')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} 
              color="bg-[#FAF9F6] dark:bg-[#111315]/60" 
              iconColor="text-[#19344A] dark:text-[#67B7E8]"
            />
          </div>
        </section>

        {/* Category 5: Mon activité ALLORA */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-[#111315] dark:text-white uppercase tracking-widest px-1">
            {language === 'fr' ? (
              <>Mon activité <span className="font-['Oswald'] font-bold tracking-wide">ALLORA</span></>
            ) : (
              <>My <span className="font-['Oswald'] font-bold tracking-wide">ALLORA</span> Activity</>
            )}
          </h3>
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.home.tabs.needs} 
              subtitle={language === 'fr' ? 'Mes demandes de soutien et requêtes' : 'My support requests'} 
              onClick={() => { onClose(); onNavigateTab('needs'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>} 
              color="bg-[#FFF4DD] dark:bg-[#F59E0B]/15" 
              iconColor="text-[#F59E0B]"
            />
            <SettingRow 
              title={t.home.tabs.resources} 
              subtitle={language === 'fr' ? 'Mes ressources et matériels partagés' : 'My shared resources'} 
              onClick={() => { onClose(); onNavigateTab('resources'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" /></svg>} 
              color="bg-[#EAF7F0] dark:bg-[#22A06B]/15" 
              iconColor="text-[#22A06B]"
            />
            <SettingRow 
              title={language === 'fr' ? 'Mes collaborations' : 'My Collaborations'} 
              subtitle={language === 'fr' ? 'Projets communs & entraide active' : 'Active projects'} 
              onClick={() => { onClose(); onNavigateTab('community'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} 
              color="bg-[#EAF6FD] dark:bg-[#67B7E8]/15" 
              iconColor="text-[#67B7E8]"
            />
            <SettingRow 
              title={t.nav.events} 
              subtitle={language === 'fr' ? 'Événements suivis & agenda' : 'Followed events'} 
              onClick={() => { onClose(); onNavigateTab('events'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} 
              color="bg-[#DCEFFA] dark:bg-[#19344A]" 
              iconColor="text-[#19344A] dark:text-[#67B7E8]"
            />
            <SettingRow 
              title={t.nav.opportunities} 
              subtitle={language === 'fr' ? 'Mes compétences & annonces' : 'My announcements'} 
              onClick={() => { onClose(); onNavigateTab('opportunities'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} 
              color="bg-[#E0F2FE] dark:bg-[#0284C7]/15" 
              iconColor="text-[#0284C7] dark:text-[#67B7E8]"
            />
          </div>
        </section>

        {/* Category 6: Aide & Support */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-[#111315] dark:text-white uppercase tracking-widest px-1">
            {t.settings.helpAndSupport || (language === 'fr' ? 'Aide & Assistance' : 'Help & Support')}
          </h3>
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.settings.faqTitle || (language === 'fr' ? 'Questions fréquentes (FAQ)' : 'Frequently Asked Questions')} 
              subtitle={language === 'fr' ? 'Tout savoir sur le fonctionnement d’ALLORA' : 'Learn about ALLORA platform'} 
              onClick={() => { setSupportTab('faq'); setCurrentSection('help'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} 
              color="bg-[#EAF6FD] dark:bg-[#67B7E8]/15" 
              iconColor="text-[#67B7E8]"
            />
            <SettingRow 
              title={t.settings.guidesTitle || (language === 'fr' ? 'Guides pratiques' : 'How-to Guides')} 
              subtitle={language === 'fr' ? 'Premiers pas, collaborations et entraide' : 'First steps and guides'} 
              onClick={() => { setSupportTab('guide'); setCurrentSection('help'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>} 
              color="bg-[#EAF7F0] dark:bg-[#22A06B]/15" 
              iconColor="text-[#22A06B]"
            />
            <SettingRow 
              title={t.settings.contactTitle || (language === 'fr' ? 'Contact & Assistance' : 'Contact & Support')} 
              subtitle={t.settings.reportProblemDesc || (language === 'fr' ? 'Contacter l’équipe ou signaler un problème' : 'Contact support or report issue')} 
              onClick={() => { setSupportTab('contact'); setCurrentSection('help'); }} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} 
              color="bg-[#FFF4DD] dark:bg-[#F59E0B]/15" 
              iconColor="text-[#F59E0B]"
            />
          </div>
        </section>

        {/* Category 7: Zone sensible */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-[#DC3545] uppercase tracking-widest px-1">{language === 'fr' ? 'Zone sensible' : 'Sensitive Zone'}</h3>
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#DC3545]/20 dark:border-[#DC3545]/30 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.settings.deactivateAccountTitle} 
              subtitle={t.settings.deactivateAccountTitleDesc} 
              onClick={() => setCurrentSection('manage')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>} 
              color="bg-[#FFF4DD] dark:bg-[#F59E0B]/15" 
              iconColor="text-[#F59E0B]" 
            />
            <SettingRow 
              title={t.settings.deleteAccountTitle} 
              subtitle={t.settings.deleteAccountTitleDesc} 
              onClick={() => setCurrentSection('manage')} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>} 
              color="bg-[#FDECEE] dark:bg-[#DC3545]/15" 
              iconColor="text-[#DC3545]" 
            />
          </div>
        </section>

        {/* Bouton de Déconnexion - Placé tout en bas après toutes les rubriques */}
        <section className="pt-2">
          <div className="bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 overflow-hidden shadow-sm">
            <SettingRow 
              title={t.settings.signOutTitle} 
              subtitle={t.settings.confirmSignOutSubtitle || (language === 'fr' ? 'Fermer ma session sur cet appareil' : 'Sign out on this device')} 
              onClick={() => setSignOutConfirmOpen(true)} 
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>} 
              color="bg-[#FAF9F6] dark:bg-[#111315]/60" 
              iconColor="text-[#6F7B85] dark:text-[#FAF9F6]/70"
            />
          </div>
        </section>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#6F7B85] dark:text-[#FAF9F6]/50 flex items-center justify-center gap-1.5">
          <span className="font-['Oswald'] text-xs font-bold text-[#19344A] dark:text-white tracking-wider">ALLORA</span>
          <span>•</span>
          <span>{t.brand.tagline}</span>
          <span>•</span>
          <span>v1.0.0</span>
        </p>
      </div>

      {/* Modal de Confirmation de Déconnexion fonctionnel */}
      {signOutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#19344A] rounded-3xl p-6 border border-[#E8E4D9] dark:border-[#67B7E8]/20 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] dark:bg-[#111315]/60 text-[#6F7B85] dark:text-[#FAF9F6]/70 mx-auto flex items-center justify-center border border-[#E8E4D9] dark:border-[#67B7E8]/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-[#19344A] dark:text-white">
                {t.settings.signOutTitle}
              </h3>
              <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 leading-relaxed font-medium">
                {t.settings.confirmSignOutSubtitle || (language === 'fr' ? 'Êtes-vous sûr de vouloir vous déconnecter de votre compte ALLORA ?' : 'Are you sure you want to sign out of your ALLORA account?')}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSignOutConfirmOpen(false)}
                disabled={isSigningOut}
                className="flex-1 py-3 px-4 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-bold text-[#6F7B85] dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-[#111315]/50 transition-colors cursor-pointer"
              >
                {t.actions.cancel}
              </button>

              <button
                type="button"
                onClick={handleSignOutExecution}
                disabled={isSigningOut}
                className="flex-1 py-3 px-4 rounded-xl bg-[#19344A] hover:bg-[#112433] dark:bg-[#67B7E8] dark:hover:bg-[#52a3d4] text-white text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSigningOut ? '...' : t.actions.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
