import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  fetchCollaborations, 
  fetchEvents
} from '../../firebase/services/dataService';
import { saveUserProfile, updateUserFields } from '../../firebase/services/userService';
import { getHumanErrorMessage } from '../../firebase/errors';
import { Collaboration, ActiveTab, CommunityEvent, UserProfile } from '../../types';
import { compressAndResizeImage } from '../../utils/imageUtils';
import { ProfileMainView } from './ProfileMainView';
import { SettingsView } from './SettingsView';

interface ProfileViewProps {
  onOpenAuth: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenAuth,
  onNavigateTab
}) => {
  const { user, profile, memberships, refreshProfile, refreshMemberships, signOut } = useAuth();
  const { t } = useLanguage();
  
  // View states: 'profile' | 'edit' | 'settings'
  const [viewMode, setViewMode] = useState<'profile' | 'edit' | 'settings'>('profile');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // File input refs for image uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form edit fields
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editProfession, setEditProfession] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvailability, setEditAvailability] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editCoverPhotoUrl, setEditCoverPhotoUrl] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Real Firestore data states
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [userEvents, setUserEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Full-screen Image Viewer Modal state
  const [viewingImage, setViewingImage] = useState<{
    type: 'avatar' | 'banner';
    url?: string;
    title: string;
  } | null>(null);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [imageModalToast, setImageModalToast] = useState<string | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Synchronize edit fields when profile or user changes
  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.displayName || '');
      setEditProfession(profile.profession || profile.professionalTitle || '');
      setEditPhoneNumber(profile.phoneNumber || '');
      setEditBirthDate(profile.birthDate || '');
      setEditLocation(profile.location || '');
      setEditBio(profile.bio || '');
      setEditAvailability(profile.availability || '');
      setEditPhotoUrl(profile.photoUrl || '');
      setEditCoverPhotoUrl(profile.coverPhotoUrl || '');
      setEditSkills(profile.skills || []);
    } else if (user) {
      setEditDisplayName(user.displayName || '');
      setEditPhotoUrl(user.photoURL || '');
    }
  }, [profile, user, viewMode]);

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [collabsList, eventsList] = await Promise.all([
          fetchCollaborations(100, user.uid).catch(() => []),
          fetchEvents().catch(() => [])
        ]);

        if (isMounted) {
          setCollaborations(collabsList);
          const myEvents = eventsList.filter(e => e.organizerId === user.uid);
          setUserEvents(myEvents);
        }
      } catch (err) {
        console.warn('Profile data load note:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle direct avatar upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingImage(true);
    try {
      const dataUrl = await compressAndResizeImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.75 });
      setEditPhotoUrl(dataUrl);
      if (viewingImage && viewingImage.type === 'avatar') {
        setViewingImage({ ...viewingImage, url: dataUrl });
      }

      if (profile) {
        await updateUserFields(user.uid, { photoUrl: dataUrl });
      } else {
        const initialProfile: UserProfile = {
          userId: user.uid,
          email: user.email || '',
          displayName: (user.displayName || user.email?.split('@')[0] || 'Membre ALLORA').substring(0, 100),
          photoUrl: dataUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          skills: [],
          interests: [],
          churchIds: [],
        };
        await saveUserProfile(initialProfile);
      }

      await refreshProfile();
      setImageModalToast(t.profile.saveSuccess);
      setTimeout(() => setImageModalToast(null), 2500);
    } catch (err: any) {
      const errMsg = getHumanErrorMessage(err);
      setImageModalToast(errMsg);
      setTimeout(() => setImageModalToast(null), 3500);
    } finally {
      setIsUploadingImage(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Handle direct cover upload
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingImage(true);
    try {
      const dataUrl = await compressAndResizeImage(file, { maxWidth: 1000, maxHeight: 500, quality: 0.70 });
      setEditCoverPhotoUrl(dataUrl);
      if (viewingImage && viewingImage.type === 'banner') {
        setViewingImage({ ...viewingImage, url: dataUrl });
      }

      if (profile) {
        await updateUserFields(user.uid, { coverPhotoUrl: dataUrl });
      } else {
        const initialProfile: UserProfile = {
          userId: user.uid,
          email: user.email || '',
          displayName: (user.displayName || user.email?.split('@')[0] || 'Membre ALLORA').substring(0, 100),
          coverPhotoUrl: dataUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          skills: [],
          interests: [],
          churchIds: [],
        };
        await saveUserProfile(initialProfile);
      }

      await refreshProfile();
      setImageModalToast(t.profile.saveSuccess);
      setTimeout(() => setImageModalToast(null), 2500);
    } catch (err: any) {
      const errMsg = getHumanErrorMessage(err);
      setImageModalToast(errMsg);
      setTimeout(() => setImageModalToast(null), 3500);
    } finally {
      setIsUploadingImage(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (type: 'avatar' | 'banner') => {
    if (!user) return;
    setIsDeletingImage(true);
    try {
      if (type === 'avatar') {
        setEditPhotoUrl('');
        if (profile) await updateUserFields(user.uid, { photoUrl: '' });
      } else {
        setEditCoverPhotoUrl('');
        if (profile) await updateUserFields(user.uid, { coverPhotoUrl: '' });
      }
      await refreshProfile();
      setIsImageMenuOpen(false);
      setViewingImage(null);
    } catch (err: any) {
      setImageModalToast(getHumanErrorMessage(err));
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updatedProfile: UserProfile = {
        userId: user.uid,
        email: user.email || '',
        displayName: editDisplayName.trim() || 'Membre ALLORA',
        professionalTitle: editProfession.trim() || undefined,
        profession: editProfession.trim() || undefined,
        phoneNumber: editPhoneNumber.trim() || undefined,
        birthDate: editBirthDate.trim() || undefined,
        location: editLocation.trim(),
        bio: editBio.trim(),
        availability: editAvailability.trim(),
        skills: editSkills,
        photoUrl: profile?.photoUrl || editPhotoUrl || undefined,
        coverPhotoUrl: profile?.coverPhotoUrl || editCoverPhotoUrl || undefined,
        servicesOffered: profile?.servicesOffered || [],
        interests: profile?.interests || [],
        churchIds: profile?.churchIds || [],
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveUserProfile(updatedProfile);
      await refreshProfile();
      setSaveSuccess(t.profile.saveSuccess);
      setTimeout(() => {
        setViewMode('profile');
        setSaveSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 600);
    } catch (err) {
      setSaveError(getHumanErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfilePartial = async (partial: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateUserFields(user.uid, partial);
      await refreshProfile();
    } catch (err) {
      console.error('Error updating partial profile:', err);
    }
  };

  if (!user) {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#19344A] border border-[#19344A]/10 dark:border-[#67B7E8]/10 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF9F6] dark:bg-blue-900/30 border border-[#E8E4D9] dark:border-blue-800 flex items-center justify-center mx-auto mb-5 text-[#67B7E8]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#19344A] dark:text-white tracking-tight mb-2">{t.profile.unauthenticatedTitle}</h2>
        <p className="text-sm text-[#19344A] dark:text-[#FAF9F6]/70 leading-relaxed mb-6">{t.profile.unauthenticatedSubtitle}</p>
        <button onClick={onOpenAuth} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#67B7E8] hover:bg-[#67B7E8] text-white text-sm font-bold transition-all shadow-md">
          <span>{t.actions.signIn} / {t.actions.signUp}</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#67B7E8] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-widest">{t.profile.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <input type="file" ref={avatarInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverFileChange} accept="image/*" className="hidden" />

      {viewMode === 'profile' && (
        <ProfileMainView 
          user={user}
          profile={profile}
          memberships={memberships}
          collaborations={collaborations}
          userEvents={userEvents}
          onEdit={() => setViewMode('edit')}
          onOpenSettings={() => setViewMode('settings')}
          onNavigateTab={onNavigateTab}
          onOpenImageViewer={(type, url, title) => setViewingImage({ type, url, title })}
        />
      )}

      {viewMode === 'settings' && (
        <SettingsView 
          user={user}
          profile={profile}
          memberships={memberships}
          onRefreshMemberships={refreshMemberships}
          onClose={() => setViewMode('profile')}
          onNavigateTab={onNavigateTab}
          onSignOut={() => signOut()}
          onUpdateProfile={handleUpdateProfilePartial}
          onEditProfile={() => setViewMode('edit')}
        />
      )}

      {viewMode === 'edit' && (
        <div className="p-5 sm:p-8 bg-white dark:bg-[#19344A] rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm animate-in fade-in duration-300">
           <div className="flex items-center gap-3 mb-8">
              <button 
                onClick={() => setViewMode('profile')}
                className="w-10 h-10 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] flex items-center justify-center text-[#19344A] dark:text-[#FAF9F6]/70 hover:bg-slate-200 dark:hover:bg-#253C5A transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 className="text-2xl font-black text-[#19344A] dark:text-white tracking-tight">{t.profile.editTitle}</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {saveError && <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-blue-950/40 text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-bold border border-[#19344A] dark:border-[#19344A]">{saveError}</div>}
              {saveSuccess && <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-blue-950/40 text-[#67B7E8] dark:text-[#67B7E8] text-xs font-bold border border-[#E8E4D9] dark:border-blue-800">{saveSuccess}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-widest mb-2">{t.profile.fullName}</label>
                  <input type="text" value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} required className="w-full px-4 py-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] focus:border-[#67B7E8] outline-none text-sm font-bold text-[#19344A] dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-widest mb-2">{t.profile.profession}</label>
                  <input type="text" value={editProfession} onChange={e => setEditProfession(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] focus:border-[#67B7E8] outline-none text-sm font-bold text-[#19344A] dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-widest mb-2">{t.profile.bio}</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] focus:border-[#67B7E8] outline-none text-sm font-bold text-[#19344A] dark:text-white resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-widest mb-2">{t.profile.location}</label>
                  <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] focus:border-[#67B7E8] outline-none text-sm font-bold text-[#19344A] dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-widest mb-2">{t.profile.phone}</label>
                  <input type="tel" value={editPhoneNumber} onChange={e => setEditPhoneNumber(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-white dark:bg-[#1D334D] focus:border-[#67B7E8] outline-none text-sm font-bold text-[#19344A] dark:text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-[#67B7E8]/10">
                <button type="button" onClick={() => setViewMode('profile')} className="px-6 py-3 rounded-2xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 font-bold text-sm hover:bg-slate-200 dark:hover:bg-#253C5A transition-all">{t.actions.cancel}</button>
                <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl bg-[#67B7E8] text-white font-bold text-sm hover:bg-[#67B7E8] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50">
                  {saving ? t.profile.saving : t.profile.saveBtn}
                </button>
              </div>
            </form>
        </div>
      )}

      {/* Full-screen Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#19344A]/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setViewingImage(null)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
              <h3 className="text-white font-black tracking-tight">{viewingImage.title}</h3>
            </div>
            
            <div className="relative">
              <button onClick={() => setIsImageMenuOpen(!isImageMenuOpen)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>

              {isImageMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#19344A] rounded-3xl shadow-2xl overflow-hidden py-2 animate-in zoom-in-95 duration-200 border border-[#E8E4D9] dark:border-[#67B7E8]/10">
                  <button onClick={() => { if (viewingImage.type === 'avatar') avatarInputRef.current?.click(); else coverInputRef.current?.click(); setIsImageMenuOpen(false); }} className="w-full px-5 py-3 text-left hover:bg-[#FAF9F6] dark:hover:bg-#1D334D flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#67B7E8]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span className="text-sm font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{t.profile.replaceImage}</span>
                  </button>
                  <button onClick={() => handleDeleteImage(viewingImage.type)} disabled={isDeletingImage} className="w-full px-5 py-3 text-left hover:bg-[#FAF9F6] dark:hover:bg-[#19344A]/20 flex items-center gap-3 text-[#19344A]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    <span className="text-sm font-bold">{isDeletingImage ? t.profile.deleting : t.profile.deleteImage}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-2xl aspect-square sm:aspect-video flex items-center justify-center overflow-hidden rounded-3xl bg-black/20 shadow-2xl border border-white/10">
            {viewingImage.url ? (
              <img src={viewingImage.url} alt={viewingImage.title} className="w-full h-full object-contain" />
            ) : (
              <div className="text-white/20 flex flex-col items-center gap-4">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <p className="font-bold uppercase tracking-widest text-xs opacity-50">{t.profile.noImage}</p>
              </div>
            )}
          </div>

          {imageModalToast && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl text-white text-xs font-bold border border-white/20 shadow-xl animate-in slide-in-from-bottom-2 duration-300">
              {imageModalToast}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
