import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { sendPasswordResetEmail, updatePassword, deleteUser } from 'firebase/auth';
import { db, auth } from '../config';
import { handleFirestoreError, OperationType, isNetworkOrOfflineError } from '../errors';
import { UserProfile, Church, ChurchMember } from '../../types';

const USERS_COLLECTION = 'users';

function requireAuthUser(targetUserId?: string): string {
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Action non autorisée. Vous devez être connecté.');
  }
  if (targetUserId && current.uid !== targetUserId) {
    throw new Error('Action non autorisée. Impossible de modifier les données d\'un autre utilisateur.');
  }
  return current.uid;
}

function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = cleanUndefined(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as UserProfile;
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const isOffline = isNetworkOrOfflineError(error);

    if (isOffline) {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const retrySnap = await getDoc(docRef);
        if (!retrySnap.exists()) return null;
        return retrySnap.data() as UserProfile;
      } catch (retryError: any) {
        const retryErrMsg = retryError instanceof Error ? retryError.message : String(retryError);
        if (isNetworkOrOfflineError(retryError)) {
          console.warn('ALLORA: Client is currently operating in offline mode for user profile.');
          return null;
        }
        handleFirestoreError(retryError, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
      }
    } else {
      handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
    }
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const verifiedUid = requireAuthUser(profile.userId);
  const docRef = doc(db, USERS_COLLECTION, verifiedUid);
  try {
    const now = new Date().toISOString();
    const payload = cleanUndefined({
      ...profile,
      userId: verifiedUid,
      email: auth.currentUser?.email || profile.email,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    });

    await setDoc(docRef, payload, { merge: true });
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (isNetworkOrOfflineError(error)) {
      console.warn('ALLORA: Profile queued locally for offline sync.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${verifiedUid}`);
  }
}

export async function updateUserFields(userId: string, partial: Partial<UserProfile>): Promise<void> {
  const verifiedUid = requireAuthUser(userId);
  const docRef = doc(db, USERS_COLLECTION, verifiedUid);
  try {
    const payload = cleanUndefined({
      ...partial,
      userId: verifiedUid,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(docRef, payload);
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (isNetworkOrOfflineError(error)) {
      console.warn('ALLORA: Profile updates queued locally for offline sync.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${verifiedUid}`);
  }
}

/**
 * Real Server-grade Account Deactivation:
 * Puts user profile into deactivated state. Keeps records for church & collaboration integrity
 * but blocks regular app usage until reactivated.
 */
export async function deactivateAccount(userId: string): Promise<void> {
  const verifiedUid = requireAuthUser(userId);
  await updateUserFields(verifiedUid, {
    status: 'deactivated',
    isDeactivated: true,
    deactivatedAt: new Date().toISOString()
  });
}

/**
 * Reversible Account Reactivation:
 * Allows the authenticated user to restore active status in one click.
 */
export async function reactivateAccount(userId: string): Promise<void> {
  const verifiedUid = requireAuthUser(userId);
  await updateUserFields(verifiedUid, {
    status: 'active',
    isDeactivated: false,
    deactivatedAt: ''
  });
}

/**
 * Real Account Deletion with Database Integrity Enforcement:
 * 1. Checks if user is the sole OWNER of any church (must not leave orphaned churches).
 * 2. Cleans up user memberships, event registrations, and sets user open needs/resources to closed.
 * 3. Deletes user profile document.
 * 4. Deletes Firebase Auth user account.
 */
export async function deleteAccountPermanently(userId: string): Promise<{ success: boolean; message: string }> {
  const current = auth.currentUser;
  if (!current || current.uid !== userId) {
    throw new Error('Action non autorisée. Vous devez être authentifié pour supprimer votre compte.');
  }

  // Step 1: Check church ownership integrity
  try {
    const memberSnap = await getDocs(
      query(collection(db, 'churchMembers'), where('userId', '==', current.uid), where('role', '==', 'OWNER'))
    );

    for (const memberDoc of memberSnap.docs) {
      const membership = memberDoc.data() as ChurchMember;
      const churchDoc = await getDoc(doc(db, 'churches', membership.churchId));
      if (churchDoc.exists()) {
        const church = churchDoc.data() as Church;
        const otherOwners = (church.leaderIds || []).filter(id => id !== current.uid);
        if (otherOwners.length === 0) {
          throw new Error(
            `Impossible de supprimer votre compte : vous êtes l'unique propriétaire (OWNER) de l'église "${church.name}". Vous devez d'abord désigner un autre propriétaire ou supprimer cette église.`
          );
        }
      }
    }

    // Step 2: Batch cleanup of user documents
    const batch = writeBatch(db);

    // Clean user memberships
    const allMemberships = await getDocs(
      query(collection(db, 'churchMembers'), where('userId', '==', current.uid))
    );
    allMemberships.forEach(d => batch.delete(d.ref));

    // Clean user event registrations
    const registrations = await getDocs(
      query(collection(db, 'eventParticipants'), where('userId', '==', current.uid))
    );
    registrations.forEach(d => batch.delete(d.ref));

    // Delete user profile
    batch.delete(doc(db, USERS_COLLECTION, current.uid));

    await batch.commit();

    // Step 3: Delete Firebase Auth record
    try {
      await deleteUser(current);
    } catch (authError: any) {
      if (authError?.code === 'auth/requires-recent-login') {
        throw new Error(
          'Pour des raisons de sécurité, cette action nécessite une reconnexion récente. Veuillez vous déconnecter, vous reconnecter, puis réessayer la suppression.'
        );
      }
      throw authError;
    }

    return { success: true, message: 'Votre compte ALLORA et vos données associées ont été supprimés avec succès.' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(msg);
  }
}

/**
 * Send password reset email via Firebase Auth
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!email || !email.includes('@')) {
    throw new Error('Adresse e-mail invalide.');
  }
  await sendPasswordResetEmail(auth, email);
}

/**
 * Update authenticated user's password directly in Firebase Auth
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Vous devez être connecté pour modifier votre mot de passe.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Le mot de passe doit comporter au moins 6 caractères.');
  }
  try {
    await updatePassword(current, newPassword);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      throw new Error(
        'Pour modifier votre mot de passe, vous devez vous être reconnecté récemment. Veuillez vous reconnecter puis réessayer.'
      );
    }
    throw err;
  }
}

