import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, testFirestoreConnection } from '../firebase/config';
import { getUserProfile, saveUserProfile, reactivateAccount } from '../firebase/services/userService';
import { logoutUser } from '../firebase/services/authService';
import { fetchUserMemberships, fetchUserNotifications, subscribeToUserNotifications } from '../firebase/services/dataService';
import { showBrowserNotification } from '../firebase/services/notificationService';
import { UserProfile, ChurchMember, ChurchNotification } from '../types';
import { getHumanErrorMessage, isNetworkOrOfflineError } from '../firebase/errors';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  memberships: ChurchMember[];
  notifications: ChurchNotification[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  isFirestoreConnected: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<ChurchMember[]>([]);
  const [notifications, setNotifications] = useState<ChurchNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const previousNotifIdsRef = useRef<Set<string>>(new Set());

  const isAccountDeactivated = Boolean(profile?.isDeactivated || profile?.status === 'deactivated');

  // Network online/offline monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        loadUserProfile(user);
        loadUserMembershipsAndNotifications(user.uid);
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

  // Firestore connection probe
  useEffect(() => {
    let isMounted = true;
    testFirestoreConnection().then(ok => {
      if (isMounted) {
        setIsFirestoreConnected(ok);
        if (ok && user && (!profile || !profile.displayName)) {
          loadUserProfile(user);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const loadUserProfile = async (firebaseUser: User) => {
    try {
      const existingProfile = await getUserProfile(firebaseUser.uid);
      if (existingProfile) {
        setProfile(existingProfile);
        return;
      }

      // If document doesn't exist or client is offline, provide valid default profile
      const defaultProfile: UserProfile = {
        userId: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Membre ALLORA',
        photoUrl: firebaseUser.photoURL || undefined,
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
          // Handled gracefully in offline queue
        }
      }
      setProfile(defaultProfile);
    } catch (err) {
      console.warn('Notice loading user profile from Firestore:', err);
      // Fallback profile from Firebase Auth so the user can continue using the application
      const fallbackProfile: UserProfile = {
        userId: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Membre ALLORA',
        photoUrl: firebaseUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        skills: [],
        interests: [],
        churchIds: [],
      };
      setProfile(fallbackProfile);

      const msg = err instanceof Error ? err.message : String(err);
      if (!isNetworkOrOfflineError(err) && !msg.includes('offline') && !msg.includes('unavailable')) {
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
      console.error('Error loading user memberships/notifications:', err);
    }
  };

  // Real-time notifications listener for active user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      user.uid,
      (realtimeNotifs) => {
        // Trigger browser notification for newly arrived notifications if enabled
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await currentUser.getIdToken();
        } catch {
          // Token ready fallback
        }
        await loadUserProfile(currentUser);
        await loadUserMembershipsAndNotifications(currentUser.uid);
      } else {
        setProfile(null);
        setMemberships([]);
        setNotifications([]);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Auth state change notice:', err);
      if (!isNetworkOrOfflineError(err)) {
        setError(getHumanErrorMessage(err));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  const refreshMemberships = async () => {
    if (user) {
      const mList = await fetchUserMemberships(user.uid);
      setMemberships(mList);
    }
  };

  const refreshNotifications = async () => {
    if (user) {
      const nList = await fetchUserNotifications(user.uid);
      setNotifications(nList);
    }
  };

  const reactivateCurrentUser = async () => {
    if (!user) return;
    try {
      await reactivateAccount(user.uid);
      await refreshProfile();
    } catch (err) {
      setError(getHumanErrorMessage(err));
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
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
        profile,
        memberships,
        notifications,
        loading,
        error,
        isOnline,
        isFirestoreConnected,
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
