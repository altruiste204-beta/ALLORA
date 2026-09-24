import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config';
import { handleFirestoreError, OperationType } from '../errors';
import { UserProfile } from '../../types';

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
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const verifiedUid = requireAuthUser(profile.userId);
  const docRef = doc(db, USERS_COLLECTION, verifiedUid);
  try {
    const payload = cleanUndefined({
      ...profile,
      userId: verifiedUid,
      email: auth.currentUser?.email || profile.email,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
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
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${verifiedUid}`);
  }
}
