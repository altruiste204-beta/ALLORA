import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { getUserProfile, saveUserProfile, reactivateAccount } from '../supabase/services/userService';
import { logoutUser } from '../supabase/services/authService';
import { fetchUserMemberships, fetchUserNotifications, subscribeToUserNotifications } from '../supabase/services/dataService';
import { showBrowserNotification } from '../supabase/services/notificationService';
import { UserProfile, ChurchMember, ChurchNotification, AppUser } from '../types';
import { getHumanErrorMessage, isNetworkOrOfflineError } from '../supabase/errors';

export function transformSupabaseUser(sbUser: User | null): AppUser | null {
  if (!sbUser) return null;
  const displayName = sbUser.user_metadata?.display_name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Membre ALLORA';
  const photoURL = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || undefined;
  const isGoogle = sbUser.app_metadata?.provider === 'google' || sbUser.identities?.some(i => i.provider === 'google');
  
  return {
    ...sbUser,
    id: sbUser.id,
    uid: sbUser.id,
    email: sbUser.email,
    displayName,
    photoURL,
    providerData: [
      {
        providerId: isGoogle ? 'google.com' : 'password',
        email: sbUser.email,
      }
    ],
  };
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  profile: UserProfile | null;
  memberships: ChurchMember[];
  notifications: ChurchNotification[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  isSupabaseConnected: boolean;
  isAccountDeactivated: boolean;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  reactivateCurrentUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<ChurchMember[]>([]);
  const [notifications, setNotifications] = useState<ChurchNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const previousNotifIdsRef = useRef<Set<string>>(new Set());

  const isAccountDeactivated = Boolean(profile?.isDeactivated || profile?.status === 'deactivated');

  // Network online/offline monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        loadUserProfile(user);
        loadUserMembershipsAndNotifications(user.id);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const loadUserProfile = async (authUser: AppUser | User) => {
    try {
      const existingProfile = await getUserProfile(authUser.id);
      if (existingProfile) {
        setProfile(existingProfile);
        return;
      }

      // Default profile from Supabase Auth metadata
      const defaultProfile: UserProfile = {
        userId: authUser.id,
        email: authUser.email || '',
        displayName: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Membre ALLORA',
        photoUrl: authUser.user_metadata?.avatar_url || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        skills: [],
        interests: [],
        churchIds: [],
      };

      if (navigator.onLine) {
        try {
          await saveUserProfile(defaultProfile);
        } catch {
          // Handled gracefully
        }
      }
      setProfile(defaultProfile);
    } catch (err) {
      console.warn('Notice loading user profile from Supabase:', err);
      const fallbackProfile: UserProfile = {
        userId: authUser.id,
        email: authUser.email || '',
        displayName: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Membre ALLORA',
        photoUrl: authUser.user_metadata?.avatar_url || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        skills: [],
        interests: [],
        churchIds: [],
      };
      setProfile(fallbackProfile);
      if (!isNetworkOrOfflineError(err)) {
        setError(getHumanErrorMessage(err));
      }
    }
  };

  const loadUserMembershipsAndNotifications = async (uid: string) => {
    try {
      const [mList, nList] = await Promise.all([
        fetchUserMemberships(uid),
        fetchUserNotifications(uid)
      ]);
      setMemberships(mList);
      setNotifications(nList);
    } catch (err) {
      console.warn('Notice loading user memberships/notifications:', err);
    }
  };

  // Real-time notifications listener for active user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      user.id,
      (realtimeNotifs) => {
        if (previousNotifIdsRef.current.size > 0) {
          const newOnes = realtimeNotifs.filter(
            n => !n.read && !previousNotifIdsRef.current.has(n.notificationId)
          );
          if (newOnes.length > 0) {
            showBrowserNotification(newOnes[0], profile?.notificationPreferences);
          }
        }
        previousNotifIdsRef.current = new Set(realtimeNotifs.map(n => n.notificationId));
        setNotifications(realtimeNotifs);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, profile?.notificationPreferences]);

  // Supabase Auth State Change Listener
  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      const currentUser = transformSupabaseUser(initSession?.user || null);
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser);
        loadUserMembershipsAndNotifications(currentUser.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      const currentUser = transformSupabaseUser(currentSession?.user || null);
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser);
        await loadUserMembershipsAndNotifications(currentUser.id);
      } else {
        setProfile(null);
        setMemberships([]);
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  const refreshMemberships = async () => {
    if (user) {
      const mList = await fetchUserMemberships(user.id);
      setMemberships(mList);
    }
  };

  const refreshNotifications = async () => {
    if (user) {
      const nList = await fetchUserNotifications(user.id);
      setNotifications(nList);
    }
  };

  const reactivateCurrentUser = async () => {
    if (!user) return;
    try {
      await reactivateAccount(user.id);
      await refreshProfile();
    } catch (err) {
      setError(getHumanErrorMessage(err));
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
      setSession(null);
      setProfile(null);
      setMemberships([]);
      setNotifications([]);
    } catch (err) {
      setError(getHumanErrorMessage(err));
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        memberships,
        notifications,
        loading,
        error,
        isOnline,
        isSupabaseConnected: true,
        isAccountDeactivated,
        clearError,
        refreshProfile,
        refreshMemberships,
        refreshNotifications,
        reactivateCurrentUser,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
