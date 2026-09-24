import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, testFirestoreConnection } from '../firebase/config';
import { getUserProfile, saveUserProfile } from '../firebase/services/userService';
import { logoutUser } from '../firebase/services/authService';
import { fetchUserMemberships, fetchUserNotifications, subscribeToUserNotifications } from '../firebase/services/dataService';
import { UserProfile, ChurchMember, ChurchNotification } from '../types';
import { getHumanErrorMessage } from '../firebase/errors';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  memberships: ChurchMember[];
  notifications: ChurchNotification[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  isFirestoreConnected: boolean;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
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

  // Network online/offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firestore connection probe
  useEffect(() => {
    testFirestoreConnection().then(ok => {
      setIsFirestoreConnected(ok);
    });
  }, []);

  const loadUserProfile = async (firebaseUser: User) => {
    try {
      let existingProfile = await getUserProfile(firebaseUser.uid);
      if (!existingProfile) {
        // Create initial profile record
        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Membre ALLORA',
          photoUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          skills: [],
          interests: [],
          churchIds: [],
        };
        await saveUserProfile(newProfile);
        existingProfile = newProfile;
      }
      setProfile(existingProfile);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(getHumanErrorMessage(err));
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
        setNotifications(realtimeNotifs);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

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
      console.error('Auth state change error:', err);
      setError(getHumanErrorMessage(err));
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
        clearError,
        refreshProfile,
        refreshMemberships,
        refreshNotifications,
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
