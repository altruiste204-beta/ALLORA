import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile, Church, Collaboration, CommunityEvent, ActiveTab } from '../../types';
import { User } from 'firebase/auth';

interface ProfileMainViewProps {
  user: User;
  profile: UserProfile | null;
  memberships: any[];
  collaborations: Collaboration[];
  userEvents: CommunityEvent[];
  onEdit: () => void;
  onOpenSettings: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenImageViewer: (type: 'avatar' | 'banner', url: string | undefined, title: string) => void;
}

export const ProfileMainView: React.FC<ProfileMainViewProps> = ({
  user,
  profile,
  memberships,
  collaborations,
  userEvents,
  onEdit,
  onOpenSettings,
  onNavigateTab,
  onOpenImageViewer
}) => {
  const { t } = useLanguage();
  const approvedMemberships = memberships.filter(m => m.status === 'approved');
  const userDisplayName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Membre ALLORA';
  const userProfession = profile?.profession || profile?.professionalTitle || t.profile.defaultProfession;
  const primaryChurchName = approvedMemberships.length > 0 ? approvedMemberships[0].churchName : t.profile.defaultChurch;
  const userLocation = profile?.location || t.profile.defaultLocation;
  const userBio = profile?.bio || t.profile.defaultBio;
  const userSkills = profile?.skills || [];
  const userPhoto = (profile && profile.photoUrl !== undefined) ? (profile.photoUrl || '') : (user.photoURL || '');
  const userCover = profile?.coverPhotoUrl || '';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Header Banner */}
      <div 
        onClick={() => onOpenImageViewer('banner', userCover, t.profile.coverPhoto)}
        className="relative h-48 sm:h-56 w-full bg-[#19344A] overflow-hidden flex items-center justify-center group cursor-pointer"
      >
        {userCover ? (
          <img src={userCover} alt="Couverture" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/10">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 50 16 C 32 16 20 34 20 68 C 20 74 26 76 32 76 C 36 76 39 72 40 66 C 42 50 45 36 50 36 C 55 36 58 50 60 66 C 61 72 64 76 68 76 C 74 76 80 74 80 68 C 80 34 68 16 50 16 Z" />
              <circle cx="50" cy="52" r="7" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#19344A]/40" />
      </div>

      {/* 2. Profile Info Area */}
      <div className="px-5 sm:px-8 pb-8 -mt-20 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div 
            onClick={() => onOpenImageViewer('avatar', userPhoto, t.profile.profilePhoto)}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-[#FAF9F6] dark:border-[#19344A] shadow-xl bg-[#E8E4D9] dark:bg-[#1D334D] flex items-center justify-center cursor-pointer group shrink-0"
          >
            {userPhoto ? (
              <img src={userPhoto} alt={userDisplayName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="text-[#19344A] dark:text-[#FAF9F6]/30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pb-1 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[#111315] dark:text-white tracking-tight truncate drop-shadow-sm sm:drop-shadow-none">
                  {userDisplayName}
                </h1>
                <span className="inline-flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M10.82 1.47a1.64 1.64 0 0 1 2.36 0l1.1 1.14a1.64 1.64 0 0 0 1.5.47l1.56-.3a1.64 1.64 0 0 1 1.88 1.42l.2 1.57a1.64 1.64 0 0 0 .96 1.25l1.45.63a1.64 1.64 0 0 1 .9 2.19l-.66 1.44a1.64 1.64 0 0 0 0 1.58l.66 1.44a1.64 1.64 0 0 1-.9 2.19l-1.45.63a1.64 1.64 0 0 0-.96 1.25l-.2 1.57a1.64 1.64 0 0 1-1.88 1.42l-1.56-.3a1.64 1.64 0 0 0-1.5.47l-1.1 1.14a1.64 1.64 0 0 1-2.36 0l-1.1-1.14a1.64 1.64 0 0 0-1.5-.47l-1.56.3a1.64 1.64 0 0 1-1.88-1.42l-.2-1.57a1.64 1.64 0 0 0-.96-1.25l-1.45-.63a1.64 1.64 0 0 1-.9-2.19l.66-1.44a1.64 1.64 0 0 0 0-1.58l-.66-1.44a1.64 1.64 0 0 1 .9-2.19l1.45-.63a1.64 1.64 0 0 0 .96-1.25l.2-1.57a1.64 1.64 0 0 1 1.88-1.42l1.56.3a1.64 1.64 0 0 0 1.5-.47l1.1-1.14z" fill="#67B7E8" />
                    <path d="M16.5 8.5L10 15l-3.5-3.5 1.4-1.4 2.1 2.1 5.1-5.1 1.4 1.4z" fill="#FFFFFF" />
                  </svg>
                </span>
              </div>
              <p className="text-[#6F7B85] dark:text-[#DCEFFA]/80 font-bold text-sm sm:text-base">
                {userProfession}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#67B7E8] hover:opacity-95 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t.profile.editBtn}
          </button>

          <button
            onClick={onOpenSettings}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-[#19344A] hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] text-[#19344A] dark:text-white font-bold text-sm transition-all shadow-xs border border-[#E8E4D9] dark:border-[#67B7E8]/10 active:scale-[0.98] cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {t.profile.settings}
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* About Section */}
          <div className="space-y-6">
            <section className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
              <h2 className="text-lg font-black text-[#111315] dark:text-white mb-4">{t.profile.about}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#DCEFFA] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#6F7B85]">{t.profile.location}</p>
                    <p className="text-sm font-bold text-[#111315] dark:text-white">{userLocation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#DCEFFA] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#6F7B85]">{t.profile.church}</p>
                    <p className="text-sm font-bold text-[#111315] dark:text-white">{primaryChurchName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#DCEFFA] dark:bg-blue-950 text-[#67B7E8] flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#6F7B85]">{t.profile.availability}</p>
                    <p className="text-sm font-bold text-[#111315] dark:text-white">{profile?.availability || t.profile.defaultAvailability}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10">
                <p className="text-sm text-[#111315] dark:text-[#FAF9F6]/70 leading-relaxed italic">
                  "{userBio}"
                </p>
              </div>
            </section>

            <section className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
              <h2 className="text-lg font-black text-[#111315] dark:text-white mb-4">{t.profile.skills}</h2>
              <div className="flex flex-wrap gap-2">
                {userSkills.length > 0 ? (
                  userSkills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 text-xs font-bold border border-[#E8E4D9] dark:border-[#67B7E8]/20">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-[#6F7B85] italic">{t.profile.noSkills}</p>
                )}
              </div>
            </section>
          </div>

          {/* Stats & Activity Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-[#19344A] text-white shadow-lg">
                <div className="text-3xl font-black mb-1">{collaborations.length}</div>
                <div className="text-[10px] uppercase font-black tracking-widest opacity-60">{t.profile.statsCollabs}</div>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
                <div className="text-3xl font-black text-[#111315] dark:text-white mb-1">{userEvents.length}</div>
                <div className="text-[10px] uppercase font-black tracking-widest text-[#6F7B85]">{t.profile.statsEvents}</div>
              </div>
            </div>

            <section className="p-6 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
              <h2 className="text-lg font-black text-[#111315] dark:text-white mb-4">{t.profile.activitiesTitle}</h2>
              <div className="space-y-2">
                <button 
                  onClick={() => onNavigateTab('needs')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DCEFFA] dark:bg-blue-950/40 text-[#67B7E8] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-[#111315] dark:text-[#FAF9F6]/70 group-hover:text-[#67B7E8] transition-colors">{t.profile.myNeeds}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#6F7B85] dark:text-[#FAF9F6]/70 group-hover:translate-x-1 group-hover:text-[#67B7E8] transition-all">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <button 
                  onClick={() => onNavigateTab('resources')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DCEFFA] dark:bg-blue-950/40 text-[#67B7E8] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
                        <path d="M3.27 6.96 12 12.01l8.73-5.05" />
                        <path d="M12 22.08V12" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-[#111315] dark:text-[#FAF9F6]/70 group-hover:text-[#67B7E8] transition-colors">{t.profile.myResources}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#6F7B85] dark:text-[#FAF9F6]/70 group-hover:translate-x-1 group-hover:text-[#67B7E8] transition-all">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <button 
                  onClick={() => onNavigateTab('opportunities')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DCEFFA] dark:bg-blue-950/40 text-[#67B7E8] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-[#111315] dark:text-[#FAF9F6]/70 group-hover:text-[#67B7E8] transition-colors">{t.profile.myOpportunities}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#6F7B85] dark:text-[#FAF9F6]/70 group-hover:translate-x-1 group-hover:text-[#67B7E8] transition-all">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <button 
                  onClick={() => onNavigateTab('community')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF9F6] dark:hover:bg-[#1D334D] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DCEFFA] dark:bg-blue-950/40 text-[#67B7E8] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-[#111315] dark:text-[#FAF9F6]/70 group-hover:text-[#67B7E8] transition-colors">{t.profile.myPosts}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#6F7B85] dark:text-[#FAF9F6]/70 group-hover:translate-x-1 group-hover:text-[#67B7E8] transition-all">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
