import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  limit,
  startAfter,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  runTransaction,
  increment,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db, auth } from '../config';
import { handleFirestoreError, OperationType, isNetworkOrOfflineError } from '../errors';

// Helper to strictly require authenticated user
function requireAuthUser(targetUserId?: string): { uid: string; email?: string | null; displayName?: string | null } {
  const current = auth.currentUser;
  if (!current) {
    throw new Error('Action non autorisée. Vous devez être connecté.');
  }
  if (targetUserId && current.uid !== targetUserId) {
    throw new Error('Action non autorisée. Identifiant utilisateur non conforme.');
  }
  return current;
}
import {
  Need,
  Resource,
  Church,
  CommunityEvent,
  Collaboration,
  CollaborationStatus,
  ChurchMember,
  ChurchNotification,
  VerificationStatus,
  MemberRole,
  MemberStatus,
  NeedResponse,
  NeedResponseStatus,
  EventParticipant,
  Post,
  PostCategory,
  Comment,
  Opportunity,
  OpportunityType,
  OpportunityStatus,
  OpportunityResponse,
  OpportunityResponseStatus,
  UserProfile,
  SupportTicket,
  PaginatedResult
} from '../../types';

// Helper to clean undefined values from objects before writing to Firestore
export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
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
  return clean as T;
}

// Random string generator for unique join code
function generateJoinCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // High legibility characters, no confusing 1/I/O/0
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ALLORA-${code}`;
}

export async function fetchNeeds(maxItems = 100): Promise<Need[]> {
  const colRef = collection(db, 'needs');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ needId: d.id, ...d.data() } as Need));
    // Sort descending by createdAt manually to avoid indexing requirement on dynamic filters
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, maxItems);
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'needs');
    return [];
  }
}

/**
 * Fetch needs with cursor-based pagination
 */
export async function fetchNeedsPaginated(
  pageSize = 12,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<PaginatedResult<Need>> {
  try {
    const colRef = collection(db, 'needs');
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(pageSize));
    if (startAfterDoc) {
      q = query(colRef, orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
    }
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ needId: d.id, ...d.data() } as Need));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      lastDoc,
      hasMore: snap.docs.length === pageSize
    };
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return { items: [], lastDoc: null, hasMore: false };
    handleFirestoreError(error, OperationType.LIST, 'needs');
    return { items: [], lastDoc: null, hasMore: false };
  }
}

export async function createNeed(needData: Omit<Need, 'needId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const user = requireAuthUser();
  const id = doc(collection(db, 'needs')).id;
  const now = new Date().toISOString();
  const need: Need = cleanUndefined({
    ...needData,
    createdBy: user.uid,
    needId: id,
    status: 'open',
    createdAt: now,
    updatedAt: now
  });
  try {
    await setDoc(doc(db, 'needs', id), need);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'needs');
    throw error;
  }
}

export async function updateNeed(needId: string, updates: Partial<Need>): Promise<void> {
  const user = requireAuthUser();
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(doc(db, 'needs', needId));
    if (!snap.exists()) throw new Error('Besoin introuvable.');
    const need = snap.data() as Need;
    if (need.createdBy !== user.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce besoin.');
    }

    const payload = cleanUndefined({
      ...updates,
      updatedAt: now
    });
    await updateDoc(doc(db, 'needs', needId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'needs');
    throw error;
  }
}

export async function deleteNeed(needId: string): Promise<void> {
  const user = requireAuthUser();
  try {
    const snap = await getDoc(doc(db, 'needs', needId));
    if (!snap.exists()) throw new Error('Besoin introuvable.');
    const need = snap.data() as Need;
    if (need.createdBy !== user.uid) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer ce besoin.');
    }

    await deleteDoc(doc(db, 'needs', needId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'needs');
    throw error;
  }
}

export async function fetchResources(maxItems = 100): Promise<Resource[]> {
  const colRef = collection(db, 'resources');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ resourceId: d.id, ...d.data() } as Resource));
    // Sort descending by createdAt manually to avoid indexing requirement on dynamic filters
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, maxItems);
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'resources');
    return [];
  }
}

/**
 * Fetch resources with cursor-based pagination
 */
export async function fetchResourcesPaginated(
  pageSize = 12,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<PaginatedResult<Resource>> {
  try {
    const colRef = collection(db, 'resources');
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(pageSize));
    if (startAfterDoc) {
      q = query(colRef, orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
    }
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ resourceId: d.id, ...d.data() } as Resource));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      lastDoc,
      hasMore: snap.docs.length === pageSize
    };
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return { items: [], lastDoc: null, hasMore: false };
    handleFirestoreError(error, OperationType.LIST, 'resources');
    return { items: [], lastDoc: null, hasMore: false };
  }
}

export async function createResource(resourceData: Omit<Resource, 'resourceId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const user = requireAuthUser();
  const id = doc(collection(db, 'resources')).id;
  const now = new Date().toISOString();
  const resource: Resource = cleanUndefined({
    ...resourceData,
    ownerId: user.uid,
    resourceId: id,
    status: 'available',
    createdAt: now,
    updatedAt: now
  });
  try {
    await setDoc(doc(db, 'resources', id), resource);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'resources');
    throw error;
  }
}

export async function updateResource(resourceId: string, updates: Partial<Resource>): Promise<void> {
  const user = requireAuthUser();
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(doc(db, 'resources', resourceId));
    if (!snap.exists()) throw new Error('Ressource introuvable.');
    const res = snap.data() as Resource;
    if (res.ownerId !== user.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier cette ressource.');
    }

    const payload = cleanUndefined({
      ...updates,
      updatedAt: now
    });
    await updateDoc(doc(db, 'resources', resourceId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'resources');
    throw error;
  }
}

export async function deleteResource(resourceId: string): Promise<void> {
  const user = requireAuthUser();
  try {
    const snap = await getDoc(doc(db, 'resources', resourceId));
    if (!snap.exists()) throw new Error('Ressource introuvable.');
    const res = snap.data() as Resource;
    if (res.ownerId !== user.uid) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cette ressource.');
    }

    await deleteDoc(doc(db, 'resources', resourceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'resources');
    throw error;
  }
}

/**
 * Need Responses lifecycle functions
 */
export async function createNeedResponse(
  needId: string,
  needAuthorId: string,
  needTitle: string,
  responderId: string,
  responderName: string,
  message: string,
  quantityProposed: number,
  resourceId?: string
): Promise<string> {
  const user = requireAuthUser(responderId);
  const responseId = doc(collection(db, 'needs', needId, 'responses')).id;
  const now = new Date().toISOString();
  
  const response: NeedResponse = cleanUndefined({
    responseId,
    needId,
    needAuthorId,
    responderId: user.uid,
    responderName: responderName || user.displayName || 'Membre ALLORA',
    message,
    quantityProposed,
    status: 'pending',
    resourceId: resourceId || undefined,
    createdAt: now,
    updatedAt: now
  });

  try {
    const batch = writeBatch(db);
    
    // 1. Set the response document
    batch.set(doc(db, 'needs', needId, 'responses', responseId), response);

    // 2. Notify the owner of the need
    const notifId = doc(collection(db, 'notifications')).id;
    const notification: ChurchNotification = {
      notificationId: notifId,
      userId: needAuthorId,
      title: 'Nouvelle proposition d\'aide !',
      body: `${responderName} propose son aide pour votre besoin : "${needTitle}"`,
      read: false,
      type: 'info',
      createdAt: now
    };
    batch.set(doc(db, 'notifications', notifId), notification);

    await batch.commit();
    return responseId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `needs/${needId}/responses`);
    throw error;
  }
}

export async function fetchNeedResponses(needId: string): Promise<NeedResponse[]> {
  try {
    const colRef = collection(db, 'needs', needId, 'responses');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ responseId: d.id, ...d.data() } as NeedResponse));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, `needs/${needId}/responses`);
    return [];
  }
}

export async function updateNeedResponseStatus(
  needId: string,
  responseId: string,
  status: NeedResponseStatus,
  quantityProposed: number,
  responderId: string,
  resourceId?: string
): Promise<void> {
  const now = new Date().toISOString();
  
  try {
    if (status === 'accepted' && resourceId) {
      // Run transaction to atomically prevent double booking / verify quantities
      await runTransaction(db, async (transaction) => {
        const resourceRef = doc(db, 'resources', resourceId);
        const resourceSnap = await transaction.get(resourceRef);
        
        if (!resourceSnap.exists()) {
          throw new Error('La ressource associée n\'existe plus.');
        }
        
        const resourceData = resourceSnap.data();
        if (resourceData.status !== 'available') {
          throw new Error('Cette ressource n\'est plus disponible.');
        }

        const availableQty = resourceData.quantity || 0;
        if (availableQty < quantityProposed) {
          throw new Error(`Quantité insuffisante disponible sur cette ressource. Disponible: ${availableQty}, Demandé: ${quantityProposed}`);
        }

        const needRef = doc(db, 'needs', needId);
        const needSnap = await transaction.get(needRef);
        if (!needSnap.exists()) {
          throw new Error('Le besoin associé n\'existe plus.');
        }
        const needData = needSnap.data();

        const responseRef = doc(db, 'needs', needId, 'responses', responseId);
        
        // 1. Update Resource Quantity & Status
        const newQuantity = availableQty - quantityProposed;
        const newStatus = newQuantity <= 0 ? 'reserved' : 'available';
        transaction.update(resourceRef, {
          quantity: newQuantity,
          status: newStatus,
          updatedAt: now
        });

        // 2. Update Need Status
        const needQty = needData.quantity || 0;
        const newNeedQty = Math.max(0, needQty - quantityProposed);
        transaction.update(needRef, {
          quantity: newNeedQty,
          status: newNeedQty <= 0 ? 'fulfilled' : 'partially_fulfilled',
          updatedAt: now
        });

        // 3. Update Response Status
        transaction.update(responseRef, {
          status: 'accepted',
          updatedAt: now
        });

        // 4. Create Collaboration Document
        const collabId = doc(collection(db, 'collaborations')).id;
        const collaboration: Collaboration = {
          collaborationId: collabId,
          needId,
          resourceId,
          needOwnerId: needData.createdBy,
          resourceOwnerId: resourceData.ownerId,
          churchId: resourceData.churchId || needData.churchId || null,
          status: 'accepted',
          quantity: quantityProposed,
          message: `Proposition d'aide acceptée pour le besoin "${needData.title}"`,
          createdAt: now,
          updatedAt: now,
          title: `Entraide : ${needData.title}`,
          description: `Proposition d'aide acceptée pour la ressource : ${resourceData.title}`,
          needTitle: needData.title,
          resourceTitle: resourceData.title,
          needOwnerName: needData.authorName || 'Créateur du besoin',
          resourceOwnerName: resourceData.ownerName || 'Propriétaire de la ressource',
          churchName: resourceData.churchName || needData.churchName || 'Communauté ALLORA',
          unit: resourceData.unit || needData.unit || 'unités'
        };
        transaction.set(doc(db, 'collaborations', collabId), collaboration);
      });
    } else {
      // Normal non-transaction status update (rejected, withdrawn, or accepted with no resourceId)
      await updateDoc(doc(db, 'needs', needId, 'responses', responseId), {
        status,
        updatedAt: now
      });
    }

    // Send notification to the responder
    const notifId = doc(collection(db, 'notifications')).id;
    const msgMap: Record<NeedResponseStatus, string> = {
      accepted: 'Votre proposition d\'aide a été acceptée par le propriétaire du besoin ! Une collaboration a été créée.',
      rejected: 'Votre proposition d\'aide n\'a pas été retenue pour le moment.',
      withdrawn: 'Vous avez retiré votre proposition d\'aide.',
      pending: 'Votre proposition d\'aide est en attente d\'examen.'
    };
    
    const notification: ChurchNotification = {
      notificationId: notifId,
      userId: responderId,
      title: status === 'accepted' ? 'Proposition acceptée !' : 'Mise à jour de proposition',
      body: msgMap[status],
      read: false,
      type: 'info',
      createdAt: now
    };
    await setDoc(doc(db, 'notifications', notifId), notification);

  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `needs/${needId}/responses`);
    throw error;
  }
}

export async function fetchChurches(maxItems = 100): Promise<Church[]> {
  const colRef = collection(db, 'churches');
  try {
    const q = query(colRef, limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ churchId: d.id, ...d.data() } as Church));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'churches');
    return [];
  }
}

export async function fetchCollaborations(maxItems = 100, userId?: string): Promise<Collaboration[]> {
  const colRef = collection(db, 'collaborations');
  try {
    const snap = await getDocs(colRef);
    let list = snap.docs.map(d => ({ collaborationId: d.id, ...d.data() } as Collaboration));
    
    if (userId) {
      list = list.filter(c => c.needOwnerId === userId || c.resourceOwnerId === userId);
    }
    
    // Sort descending by createdAt manually
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, maxItems);
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'collaborations');
    return [];
  }
}

export async function createCollaboration(
  needId: string,
  resourceId: string,
  needOwnerId: string,
  resourceOwnerId: string,
  quantity: number,
  message: string,
  churchId: string | null,
  cachedData: {
    needTitle: string;
    resourceTitle: string;
    needOwnerName?: string;
    resourceOwnerName?: string;
    churchName?: string;
  }
): Promise<string> {
  const collaborationId = doc(collection(db, 'collaborations')).id;
  const now = new Date().toISOString();

  const collaboration: Collaboration = {
    collaborationId,
    needId,
    resourceId,
    needOwnerId,
    resourceOwnerId,
    churchId,
    status: 'proposed',
    quantity,
    message,
    createdAt: now,
    updatedAt: now,
    title: `Entraide : ${cachedData.needTitle}`,
    description: message,
    needTitle: cachedData.needTitle,
    resourceTitle: cachedData.resourceTitle,
    needOwnerName: cachedData.needOwnerName,
    resourceOwnerName: cachedData.resourceOwnerName,
    churchName: cachedData.churchName
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'collaborations', collaborationId), collaboration);

    // Notify the owner of the resource or need (recipient of the proposal)
    // If the initiator is the need owner, notify the resource owner. Otherwise, notify the need owner.
    const senderId = needOwnerId === resourceOwnerId ? needOwnerId : (needOwnerId === resourceOwnerId ? resourceOwnerId : needOwnerId);
    // Let's notify both or find the other party safely
    const notificationId = doc(collection(db, 'notifications')).id;
    const notification: ChurchNotification = {
      notificationId,
      userId: resourceOwnerId, // Default notify the resource owner, or need owner depending on who proposed
      title: 'Nouvelle collaboration proposée !',
      body: `Une proposition de collaboration a été créée pour le besoin "${cachedData.needTitle}" avec la ressource "${cachedData.resourceTitle}".`,
      read: false,
      type: 'info',
      createdAt: now
    };
    batch.set(doc(db, 'notifications', notificationId), notification);

    await batch.commit();
    return collaborationId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'collaborations');
    throw error;
  }
}

export async function updateCollaborationStatus(
  collaborationId: string,
  newStatus: CollaborationStatus,
  currentUserId: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await runTransaction(db, async (transaction) => {
      const collabRef = doc(db, 'collaborations', collaborationId);
      const collabSnap = await transaction.get(collabRef);
      if (!collabSnap.exists()) {
        throw new Error('La collaboration spécifiée n\'existe pas.');
      }
      const collab = collabSnap.data() as Collaboration;
      const currentStatus = collab.status;

      // 1. Validate status transition
      const allowedTransitions: Record<CollaborationStatus, CollaborationStatus[]> = {
        draft: ['proposed'],
        proposed: ['accepted', 'rejected', 'cancelled'],
        accepted: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
        completed: [],
        rejected: [],
        cancelled: [],
        archived: []
      };

      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Transition de statut invalide : ${currentStatus} vers ${newStatus}`);
      }

      // 2. Validate authorization
      const isNeedOwner = collab.needOwnerId === currentUserId;
      const isResourceOwner = collab.resourceOwnerId === currentUserId;
      if (!isNeedOwner && !isResourceOwner) {
        throw new Error('Vous n\'êtes pas autorisé à modifier cette collaboration.');
      }

      // 3. Atomically check and update need and resource status/quantity if needed
      if (newStatus === 'accepted') {
        const resourceRef = doc(db, 'resources', collab.resourceId);
        const resourceSnap = await transaction.get(resourceRef);
        if (!resourceSnap.exists()) {
          throw new Error('La ressource associée n\'existe plus.');
        }
        const resourceData = resourceSnap.data();
        if (resourceData.status !== 'available') {
          throw new Error('Cette ressource n\'est plus disponible.');
        }
        const availableQty = resourceData.quantity || 0;
        if (availableQty < collab.quantity) {
          throw new Error(`La quantité demandée (${collab.quantity}) dépasse la quantité disponible (${availableQty}).`);
        }

        // Deduct quantity from resource
        const newQty = availableQty - collab.quantity;
        transaction.update(resourceRef, {
          quantity: newQty,
          status: newQty <= 0 ? 'reserved' : 'available',
          updatedAt: now
        });

        // Optionally update need status
        const needRef = doc(db, 'needs', collab.needId);
        const needSnap = await transaction.get(needRef);
        if (needSnap.exists()) {
          const needData = needSnap.data();
          const needQty = needData.quantity || 0;
          const newNeedQty = Math.max(0, needQty - collab.quantity);
          transaction.update(needRef, {
            quantity: newNeedQty,
            status: newNeedQty <= 0 ? 'fulfilled' : 'partially_fulfilled',
            updatedAt: now
          });
        }
      } else if (newStatus === 'cancelled' && (currentStatus === 'accepted' || currentStatus === 'active')) {
        // Restore quantity to resource if cancelled after acceptance
        const resourceRef = doc(db, 'resources', collab.resourceId);
        const resourceSnap = await transaction.get(resourceRef);
        if (resourceSnap.exists()) {
          const resourceData = resourceSnap.data();
          const newQty = (resourceData.quantity || 0) + collab.quantity;
          transaction.update(resourceRef, {
            quantity: newQty,
            status: 'available',
            updatedAt: now
          });
        }

        // Restore quantity to need
        const needRef = doc(db, 'needs', collab.needId);
        const needSnap = await transaction.get(needRef);
        if (needSnap.exists()) {
          const needData = needSnap.data();
          const newNeedQty = (needData.quantity || 0) + collab.quantity;
          transaction.update(needRef, {
            quantity: newNeedQty,
            status: 'open',
            updatedAt: now
          });
        }
      }

      // 4. Update collaboration status
      transaction.update(collabRef, {
        status: newStatus,
        updatedAt: now
      });

      // 5. Send Notification to other party
      const recipientId = isNeedOwner ? collab.resourceOwnerId : collab.needOwnerId;
      const notifId = doc(collection(db, 'notifications')).id;
      const statusLabels: Record<CollaborationStatus, string> = {
        draft: 'brouillon',
        proposed: 'proposée',
        accepted: 'acceptée',
        active: 'activée',
        completed: 'terminée',
        rejected: 'refusée',
        cancelled: 'annulée',
        archived: 'archivée'
      };
      const notification: ChurchNotification = {
        notificationId: notifId,
        userId: recipientId,
        title: `Collaboration ${statusLabels[newStatus]} !`,
        body: `Le statut de votre collaboration pour "${collab.needTitle}" est passé à : ${statusLabels[newStatus]}.`,
        read: false,
        type: 'info',
        createdAt: now
      };
      transaction.set(doc(db, 'notifications', notifId), notification);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `collaborations/${collaborationId}`);
    throw error;
  }
}

/** ==========================================================
 *  CHURCH MANAGEMENT FUNCTIONS
 *  ========================================================== */

/**
 * Creates a new Church and automatically approves the creator as OWNER
 */
export async function createChurch(
  churchData: Omit<Church, 'churchId' | 'joinCode' | 'leaderIds' | 'verificationStatus' | 'createdBy' | 'createdAt' | 'updatedAt'>,
  userId: string,
  userDisplayName: string,
  userEmail: string
): Promise<string> {
  const verifiedUser = requireAuthUser(userId);
  const churchId = doc(collection(db, 'churches')).id;
  const joinCode = generateJoinCode();
  const now = new Date().toISOString();

  const church: Church = cleanUndefined({
    ...churchData,
    churchId,
    joinCode,
    leaderIds: [verifiedUser.uid],
    verificationStatus: 'pending',
    createdBy: verifiedUser.uid,
    createdAt: now,
    updatedAt: now
  });

  const membershipId = `${churchId}_${verifiedUser.uid}`;
  const membership: ChurchMember = cleanUndefined({
    membershipId,
    churchId,
    churchName: church.name,
    userId: verifiedUser.uid,
    displayName: userDisplayName || verifiedUser.displayName || 'Membre ALLORA',
    email: userEmail || verifiedUser.email || '',
    role: 'OWNER',
    status: 'approved',
    joinedAt: now,
    updatedAt: now
  });

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'churches', churchId), church);
    batch.set(doc(db, 'churchMembers', membershipId), membership);
    await batch.commit();
    return churchId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'churches');
    throw error;
  }
}

/**
 * Fetch a single church by ID
 */
export async function fetchChurchById(churchId: string): Promise<Church | null> {
  try {
    const snap = await getDoc(doc(db, 'churches', churchId));
    if (snap.exists()) {
      return { churchId: snap.id, ...snap.data() } as Church;
    }
    return null;
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return null;
    handleFirestoreError(error, OperationType.GET, 'churches');
    return null;
  }
}

/**
 * Fetch all memberships of a single user with retry resilience
 */
export async function fetchUserMemberships(userId: string): Promise<ChurchMember[]> {
  try {
    const colRef = collection(db, 'churchMembers');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ membershipId: d.id, ...d.data() } as ChurchMember));
  } catch (error) {
    // Retry once in case of transient auth token propagation
    try {
      await new Promise(r => setTimeout(r, 400));
      const colRef = collection(db, 'churchMembers');
      const q = query(colRef, where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ membershipId: d.id, ...d.data() } as ChurchMember));
    } catch {
      // Graceful fallback for initial guest or newly created user
      return [];
    }
  }
}

/**
 * Fetch all members belonging to a church
 */
export async function fetchChurchMembers(churchId: string): Promise<ChurchMember[]> {
  try {
    const colRef = collection(db, 'churchMembers');
    const q = query(colRef, where('churchId', '==', churchId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ membershipId: d.id, ...d.data() } as ChurchMember));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'churchMembers');
    return [];
  }
}

/**
 * Directly join a church by supplying its unique verbal code
 */
export async function joinChurchWithCode(
  churchId: string,
  joinCode: string,
  user: { uid: string; displayName: string; email: string; photoURL?: string }
): Promise<void> {
  const verifiedUser = requireAuthUser(user.uid);
  const membershipId = `${churchId}_${verifiedUser.uid}`;
  const now = new Date().toISOString();

  try {
    // Read the church first to double check the code is valid
    const churchSnap = await getDoc(doc(db, 'churches', churchId));
    if (!churchSnap.exists()) {
      throw new Error('L\'église spécifiée n\'existe pas.');
    }
    const church = churchSnap.data() as Church;
    if (church.joinCode.toUpperCase() !== joinCode.trim().toUpperCase()) {
      throw new Error('Code de rejoindre invalide. Veuillez réessayer.');
    }

    const membership: ChurchMember = cleanUndefined({
      membershipId,
      churchId,
      churchName: church.name,
      userId: verifiedUser.uid,
      displayName: user.displayName || verifiedUser.displayName || 'Membre ALLORA',
      email: user.email || verifiedUser.email || '',
      photoUrl: user.photoURL || undefined,
      role: 'MEMBER',
      status: 'approved',
      joinCode: joinCode.trim().toUpperCase(),
      joinedAt: now,
      updatedAt: now
    });

    await setDoc(doc(db, 'churchMembers', membershipId), membership);

    // Create confirmation notification
    const notificationId = doc(collection(db, 'notifications')).id;
    const notification: ChurchNotification = {
      notificationId,
      userId: verifiedUser.uid,
      title: `Bienvenue chez ${church.name}`,
      body: `Vous avez rejoint la communauté d'église en tant que membre.`,
      churchId,
      churchName: church.name,
      type: 'membership_approved',
      read: false,
      createdAt: now
    };
    await setDoc(doc(db, 'notifications', notificationId), notification);

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'churchMembers');
    throw error;
  }
}

/**
 * Create a pending request to join a church
 */
export async function requestToJoinChurch(
  churchId: string,
  user: { uid: string; displayName: string; email: string; photoURL?: string }
): Promise<void> {
  const verifiedUser = requireAuthUser(user.uid);
  const membershipId = `${churchId}_${verifiedUser.uid}`;
  const now = new Date().toISOString();

  try {
    const churchSnap = await getDoc(doc(db, 'churches', churchId));
    if (!churchSnap.exists()) {
      throw new Error('L\'église spécifiée n\'existe pas.');
    }
    const church = churchSnap.data() as Church;

    const membership: ChurchMember = cleanUndefined({
      membershipId,
      churchId,
      churchName: church.name,
      userId: verifiedUser.uid,
      displayName: user.displayName || verifiedUser.displayName || 'Membre ALLORA',
      email: user.email || verifiedUser.email || '',
      photoUrl: user.photoURL || undefined,
      role: 'MEMBER',
      status: 'pending',
      joinedAt: now,
      updatedAt: now
    });

    await setDoc(doc(db, 'churchMembers', membershipId), membership);

    // Create notifications for all leaders of the church
    const batch = writeBatch(db);
    for (const leaderId of church.leaderIds) {
      const notifId = doc(collection(db, 'notifications')).id;
      const leaderNotif: ChurchNotification = {
        notificationId: notifId,
        userId: leaderId,
        title: `Demande d'adhésion chez ${church.name}`,
        body: `${membership.displayName} souhaite rejoindre votre église.`,
        churchId,
        churchName: church.name,
        type: 'membership_request',
        read: false,
        createdAt: now
      };
      batch.set(doc(db, 'notifications', notifId), leaderNotif);
    }
    await batch.commit();

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'churchMembers');
    throw error;
  }
}

/**
 * Update member status (OWNER/ADMIN only)
 */
export async function updateMemberStatus(
  membershipId: string,
  status: 'approved' | 'rejected' | 'removed',
  churchId: string,
  affectedUserId: string,
  churchName: string
): Promise<void> {
  const currentLeader = requireAuthUser();
  const now = new Date().toISOString();
  try {
    // Check leader authorization
    const churchSnap = await getDoc(doc(db, 'churches', churchId));
    if (!churchSnap.exists()) throw new Error('Église introuvable.');
    const church = churchSnap.data() as Church;
    if (!church.leaderIds || !church.leaderIds.includes(currentLeader.uid)) {
      throw new Error('Vous devez être administrateur ou responsable de l\'église pour effectuer cette action.');
    }

    if (status === 'removed') {
      await deleteDoc(doc(db, 'churchMembers', membershipId));
    } else {
      await updateDoc(doc(db, 'churchMembers', membershipId), {
        status,
        updatedAt: now
      });
    }

    // Send notification to the affected user
    const notifId = doc(collection(db, 'notifications')).id;
    const typeMap = {
      approved: 'membership_approved' as const,
      rejected: 'membership_rejected' as const,
      removed: 'membership_rejected' as const
    };

    const textMap = {
      approved: `Votre demande d'adhésion chez ${churchName} a été acceptée !`,
      rejected: `Votre demande d'adhésion chez ${churchName} n'a pas été retenue.`,
      removed: `Vous ne faites plus partie de l'église ${churchName}.`
    };

    const notification: ChurchNotification = {
      notificationId: notifId,
      userId: affectedUserId,
      title: status === 'approved' ? 'Demande acceptée !' : 'Mise à jour d\'adhésion',
      body: textMap[status],
      churchId,
      churchName,
      type: typeMap[status],
      read: false,
      createdAt: now
    };
    await setDoc(doc(db, 'notifications', notifId), notification);

  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'churchMembers');
    throw error;
  }
}

/**
 * Promotes or Demotes member to/from ADMIN
 */
export async function updateMemberRole(
  membershipId: string,
  role: 'ADMIN' | 'MEMBER',
  churchId: string,
  affectedUserId: string,
  churchName: string
): Promise<void> {
  const currentLeader = requireAuthUser();
  const now = new Date().toISOString();
  try {
    const churchSnap = await getDoc(doc(db, 'churches', churchId));
    if (!churchSnap.exists()) throw new Error('Église introuvable.');
    const church = churchSnap.data() as Church;
    if (!church.leaderIds || !church.leaderIds.includes(currentLeader.uid)) {
      throw new Error('Vous devez être administrateur ou responsable de l\'église pour modifier les rôles.');
    }

    const batch = writeBatch(db);

    // 1. Update membership role
    batch.update(doc(db, 'churchMembers', membershipId), {
      role,
      updatedAt: now
    });

    // 2. Synchronize church leaderIds array
    const churchRef = doc(db, 'churches', churchId);
    if (role === 'ADMIN') {
      batch.update(churchRef, {
        leaderIds: arrayUnion(affectedUserId),
        updatedAt: now
      });
    } else {
      batch.update(churchRef, {
        leaderIds: arrayRemove(affectedUserId),
        updatedAt: now
      });
    }

    // 3. Notify user
    const notifId = doc(collection(db, 'notifications')).id;
    const notification: ChurchNotification = {
      notificationId: notifId,
      userId: affectedUserId,
      title: 'Mise à jour de rôle',
      body: `Votre rôle chez ${churchName} est désormais : ${role === 'ADMIN' ? 'Administrateur' : 'Membre'}.`,
      churchId,
      churchName,
      type: 'role_changed',
      read: false,
      createdAt: now
    };
    batch.set(doc(db, 'notifications', notifId), notification);

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'churchMembers');
    throw error;
  }
}


/**
 * Fetch notifications for a single user with retry resilience
 */
export async function fetchUserNotifications(userId: string): Promise<ChurchNotification[]> {
  try {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    // Sort manually by date to avoid requiring a custom composite index immediately
    return snap.docs
      .map(d => ({ notificationId: d.id, ...d.data() } as ChurchNotification))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    // Retry once in case of transient auth token propagation
    try {
      await new Promise(r => setTimeout(r, 400));
      const colRef = collection(db, 'notifications');
      const q = query(colRef, where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ notificationId: d.id, ...d.data() } as ChurchNotification))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      // Graceful fallback for initial guest or newly created user
      return [];
    }
  }
}

/**
 * Subscribe to real-time user notifications via onSnapshot
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: ChurchNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, where('userId', '==', userId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map(d => ({ notificationId: d.id, ...d.data() } as ChurchNotification))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        callback(list);
      },
      (err) => {
        console.warn('Realtime notifications listener error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to attach notifications snapshot:', err);
    return () => {};
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}

/**
 * Fetch all events
 */
export async function fetchEvents(maxItems = 100): Promise<CommunityEvent[]> {
  try {
    const colRef = collection(db, 'events');
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ eventId: d.id, ...d.data() } as CommunityEvent));
    // Sort descending by startAt
    return list.sort((a, b) => b.startAt.localeCompare(a.startAt)).slice(0, maxItems);
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'events');
    return [];
  }
}

/**
 * Create a new event
 */
export async function createEvent(
  eventData: Omit<CommunityEvent, 'eventId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const user = requireAuthUser();
  const eventId = doc(collection(db, 'events')).id;
  const now = new Date().toISOString();
  const event: CommunityEvent = cleanUndefined({
    ...eventData,
    organizerId: user.uid,
    eventId,
    createdAt: now,
    updatedAt: now
  });

  try {
    await setDoc(doc(db, 'events', eventId), event);
    return eventId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'events');
    throw error;
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CommunityEvent>,
  userId: string
): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  const now = new Date().toISOString();
  try {
    const eventRef = doc(db, 'events', eventId);
    const snap = await getDoc(eventRef);
    if (!snap.exists()) throw new Error('Événement introuvable.');
    const event = snap.data() as CommunityEvent;

    // Check authorization: organizer or church leader
    if (event.organizerId !== verifiedUser.uid) {
      if (event.organizerType === 'church' && event.churchId) {
        const churchSnap = await getDoc(doc(db, 'churches', event.churchId));
        const churchData = churchSnap.exists() ? churchSnap.data() as Church : null;
        if (!churchData || !churchData.leaderIds || !churchData.leaderIds.includes(verifiedUser.uid)) {
          throw new Error('Vous n\'êtes pas autorisé à modifier cet événement.');
        }
      } else {
        throw new Error('Vous n\'êtes pas autorisé à modifier cet événement.');
      }
    }

    const payload = cleanUndefined({
      ...updates,
      updatedAt: now
    });

    await updateDoc(eventRef, payload);

    // Notify registered participants if cancelled or modified
    if (updates.status === 'cancelled') {
      const participants = await fetchEventParticipants(eventId);
      const activeParticipants = participants.filter(p => p.status === 'registered');
      for (const p of activeParticipants) {
        const notifId = doc(collection(db, 'notifications')).id;
        const notification: ChurchNotification = {
          notificationId: notifId,
          userId: p.userId,
          title: `Événement annulé : ${event.title}`,
          body: `L'événement "${event.title}" auquel vous étiez inscrit a été annulé par l'organisateur.`,
          type: 'info',
          read: false,
          createdAt: now
        };
        await setDoc(doc(db, 'notifications', notifId), notification);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'events');
    throw error;
  }
}

/**
 * Fetch participants for an event
 */
export async function fetchEventParticipants(eventId: string): Promise<EventParticipant[]> {
  try {
    const colRef = collection(db, 'eventParticipants');
    const q = query(colRef, where('eventId', '==', eventId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as EventParticipant);
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'eventParticipants');
    return [];
  }
}

/**
 * Register a user for an event
 */
export async function registerForEvent(
  eventId: string,
  userId: string,
  displayName: string,
  email: string
): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  const now = new Date().toISOString();
  const participantId = `${eventId}_${verifiedUser.uid}`;
  const participantRef = doc(db, 'eventParticipants', participantId);
  const eventRef = doc(db, 'events', eventId);

  try {
    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) throw new Error('Événement introuvable.');
      const event = eventSnap.data() as CommunityEvent;

      if (event.status !== 'published') {
        throw new Error('Cet événement n\'est plus ouvert aux inscriptions.');
      }

      const partSnap = await transaction.get(participantRef);
      if (partSnap.exists() && partSnap.data().status === 'registered') {
        throw new Error('Vous êtes déjà inscrit à cet événement.');
      }

      // Check capacity
      if (event.capacity && event.capacity > 0) {
        const querySnap = await getDocs(query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'registered')));
        const currentCount = querySnap.size;
        if (currentCount >= event.capacity) {
          throw new Error('La capacité maximale de cet événement a été atteinte.');
        }
      }

      const participant: EventParticipant = cleanUndefined({
        participantId,
        eventId,
        userId: verifiedUser.uid,
        displayName: displayName || verifiedUser.displayName || 'Membre ALLORA',
        email: email || verifiedUser.email || '',
        status: 'registered',
        createdAt: now,
        updatedAt: now
      });

      transaction.set(participantRef, participant);
    });

    // Notify registered user
    const notifId = doc(collection(db, 'notifications')).id;
    const notification: ChurchNotification = {
      notificationId: notifId,
      userId: verifiedUser.uid,
      title: 'Inscription confirmée !',
      body: `Votre inscription à l'événement a bien été enregistrée.`,
      read: false,
      type: 'info',
      createdAt: now
    };
    await setDoc(doc(db, 'notifications', notifId), notification);

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'eventParticipants');
    throw error;
  }
}

/**
 * Cancel user participation
 */
export async function cancelEventParticipation(eventId: string, userId: string): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  const now = new Date().toISOString();
  const participantId = `${eventId}_${verifiedUser.uid}`;
  try {
    await updateDoc(doc(db, 'eventParticipants', participantId), {
      status: 'cancelled',
      updatedAt: now
    });

    // Notify user
    const notifId = doc(collection(db, 'notifications')).id;
    const notification: ChurchNotification = {
      notificationId: notifId,
      userId: verifiedUser.uid,
      title: 'Participation annulée',
      body: `Vous avez annulé votre participation à l'événement.`,
      read: false,
      type: 'info',
      createdAt: now
    };
    await setDoc(doc(db, 'notifications', notifId), notification);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'eventParticipants');
    throw error;
  }
}

// --- PHASE 6: COMMUNITY & NOTIFICATIONS ---

/**
 * Fetch community posts
 */
export async function fetchPosts(
  category?: PostCategory,
  churchId?: string,
  limitCount = 50
): Promise<Post[]> {
  try {
    const colRef = collection(db, 'posts');
    let q = query(colRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(limitCount));

    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    if (churchId) {
      q = query(q, where('churchId', '==', churchId));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ postId: d.id, ...d.data() } as Post));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'posts');
    return [];
  }
}

/**
 * Fetch community posts with cursor-based pagination
 */
export async function fetchPostsPaginated(
  pageSize = 12,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null,
  category?: PostCategory,
  churchId?: string
): Promise<PaginatedResult<Post>> {
  try {
    const colRef = collection(db, 'posts');
    let q = query(colRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(pageSize));

    if (category) {
      q = query(colRef, where('status', '==', 'published'), where('category', '==', category), orderBy('createdAt', 'desc'), limit(pageSize));
    } else if (churchId) {
      q = query(colRef, where('status', '==', 'published'), where('churchId', '==', churchId), orderBy('createdAt', 'desc'), limit(pageSize));
    }

    if (startAfterDoc) {
      if (category) {
        q = query(colRef, where('status', '==', 'published'), where('category', '==', category), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
      } else if (churchId) {
        q = query(colRef, where('status', '==', 'published'), where('churchId', '==', churchId), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
      } else {
        q = query(colRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
      }
    }

    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ postId: d.id, ...d.data() } as Post));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      lastDoc,
      hasMore: snap.docs.length === pageSize
    };
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return { items: [], lastDoc: null, hasMore: false };
    handleFirestoreError(error, OperationType.LIST, 'posts');
    return { items: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Create a new post
 */
export async function createPost(postData: Omit<Post, 'postId' | 'createdAt' | 'updatedAt' | 'commentCount' | 'reactions'>): Promise<string> {
  const user = requireAuthUser();
  const now = new Date().toISOString();
  const postRef = doc(collection(db, 'posts'));
  const post: Post = cleanUndefined({
    ...postData,
    authorId: user.uid,
    postId: postRef.id,
    commentCount: 0,
    reactions: {},
    createdAt: now,
    updatedAt: now
  });

  try {
    await setDoc(postRef, post);
    return postRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'posts');
    throw error;
  }
}

/**
 * Update a post
 */
export async function updatePost(postId: string, updates: Partial<Post>, userId: string): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  const now = new Date().toISOString();
  try {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) throw new Error('Publication introuvable.');
    const post = snap.data() as Post;

    if (post.authorId !== verifiedUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier cette publication.');
    }

    const payload = cleanUndefined({
      ...updates,
      updatedAt: now
    });

    await updateDoc(postRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'posts');
    throw error;
  }
}

/**
 * Add or remove a reaction from a post
 */
export async function togglePostReaction(postId: string, userId: string, reaction: string): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  const postRef = doc(db, 'posts', postId);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(postRef);
      if (!snap.exists()) throw new Error('Publication introuvable.');
      const post = snap.data() as Post;
      const reactions = post.reactions || {};
      const userList = reactions[reaction] || [];

      if (userList.includes(verifiedUser.uid)) {
        // Remove reaction
        reactions[reaction] = userList.filter(id => id !== verifiedUser.uid);
      } else {
        // Add reaction
        reactions[reaction] = [...userList, verifiedUser.uid];
      }

      transaction.update(postRef, { reactions, updatedAt: new Date().toISOString() });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'posts');
    throw error;
  }
}

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId: string): Promise<Comment[]> {
  try {
    const colRef = collection(db, 'comments');
    const q = query(colRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ commentId: d.id, ...d.data() } as Comment));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'comments');
    return [];
  }
}

/**
 * Create a comment
 */
export async function createComment(
  commentData: Omit<Comment, 'commentId' | 'createdAt' | 'updatedAt'>,
  postAuthorId: string
): Promise<string> {
  const user = requireAuthUser();
  const now = new Date().toISOString();
  const commentRef = doc(collection(db, 'comments'));
  const comment: Comment = cleanUndefined({
    ...commentData,
    authorId: user.uid,
    commentId: commentRef.id,
    createdAt: now,
    updatedAt: now
  });

  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(commentRef, comment);
      const postRef = doc(db, 'posts', commentData.postId);
      transaction.update(postRef, { 
        commentCount: increment(1),
        updatedAt: now 
      });
    });

    // Notify post author if it's not the commenter
    if (postAuthorId !== user.uid) {
      await createInternalNotification({
        userId: postAuthorId,
        title: 'Nouveau commentaire',
        body: `${commentData.authorName || 'Un membre'} a commenté votre publication.`,
        type: 'community',
        relatedId: commentData.postId
      });
    }

    return commentRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'comments');
    throw error;
  }
}

/**
 * Internal helper to create a notification
 */
async function createInternalNotification(data: Omit<ChurchNotification, 'notificationId' | 'read' | 'createdAt'>): Promise<void> {
  const now = new Date().toISOString();
  const notifRef = doc(collection(db, 'notifications'));
  const notification: ChurchNotification = {
    ...data,
    notificationId: notifRef.id,
    read: false,
    createdAt: now
  };
  try {
    await setDoc(notifRef, notification);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    throw error;
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId: string, userId: string): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  try {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) throw new Error('Publication introuvable.');
    const post = snap.data() as Post;

    if (post.authorId !== verifiedUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cette publication.');
    }

    await deleteDoc(postRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'posts');
    throw error;
  }
}

/** ==========================================================
 *  PHASE 7 : OPPORTUNITÉS PROFESSIONNELLES & SERVICES
 *  ========================================================== */

/**
 * Fetch all opportunities
 */
export async function fetchOpportunities(maxItems = 100): Promise<Opportunity[]> {
  try {
    const colRef = collection(db, 'opportunities');
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ opportunityId: d.id, ...d.data() } as Opportunity));
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, maxItems);
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'opportunities');
    return [];
  }
}

/**
 * Fetch opportunities with cursor-based pagination
 */
export async function fetchOpportunitiesPaginated(
  pageSize = 12,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null,
  type?: OpportunityType,
  churchId?: string
): Promise<PaginatedResult<Opportunity>> {
  try {
    const colRef = collection(db, 'opportunities');
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(pageSize));

    if (type) {
      q = query(colRef, where('type', '==', type), orderBy('createdAt', 'desc'), limit(pageSize));
    } else if (churchId) {
      q = query(colRef, where('churchId', '==', churchId), orderBy('createdAt', 'desc'), limit(pageSize));
    }

    if (startAfterDoc) {
      if (type) {
        q = query(colRef, where('type', '==', type), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
      } else if (churchId) {
        q = query(colRef, where('churchId', '==', churchId), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
      } else {
        q = query(colRef, orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize));
      }
    }

    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ opportunityId: d.id, ...d.data() } as Opportunity));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return {
      items,
      lastDoc,
      hasMore: snap.docs.length === pageSize
    };
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return { items: [], lastDoc: null, hasMore: false };
    handleFirestoreError(error, OperationType.LIST, 'opportunities');
    return { items: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Fetch single opportunity by ID
 */
export async function getOpportunityById(opportunityId: string): Promise<Opportunity | null> {
  try {
    const snap = await getDoc(doc(db, 'opportunities', opportunityId));
    if (snap.exists()) {
      return { opportunityId: snap.id, ...snap.data() } as Opportunity;
    }
    return null;
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return null;
    handleFirestoreError(error, OperationType.GET, `opportunities/${opportunityId}`);
    return null;
  }
}

/**
 * Create a new professional opportunity or service proposal
 */
export async function createOpportunity(
  opportunityData: Omit<Opportunity, 'opportunityId' | 'createdAt' | 'updatedAt' | 'responseCount'>
): Promise<string> {
  const user = requireAuthUser();
  const oppRef = doc(collection(db, 'opportunities'));
  const now = new Date().toISOString();
  const opportunity = cleanUndefined({
    ...opportunityData,
    authorId: user.uid,
    opportunityId: oppRef.id,
    responseCount: 0,
    createdAt: now,
    updatedAt: now
  });

  try {
    await setDoc(oppRef, opportunity);
    return oppRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'opportunities');
    throw error;
  }
}

/**
 * Update an existing opportunity
 */
export async function updateOpportunity(
  opportunityId: string,
  updates: Partial<Opportunity>,
  userId: string
): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  const now = new Date().toISOString();
  try {
    const oppRef = doc(db, 'opportunities', opportunityId);
    const snap = await getDoc(oppRef);
    if (!snap.exists()) throw new Error('Opportunité introuvable.');
    const opp = snap.data() as Opportunity;

    if (opp.authorId !== verifiedUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier cette opportunité.');
    }

    const payload = cleanUndefined({
      ...updates,
      updatedAt: now
    });

    await updateDoc(oppRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `opportunities/${opportunityId}`);
    throw error;
  }
}

/**
 * Delete an opportunity
 */
export async function deleteOpportunity(opportunityId: string, userId: string): Promise<void> {
  const verifiedUser = requireAuthUser(userId);
  try {
    const oppRef = doc(db, 'opportunities', opportunityId);
    const snap = await getDoc(oppRef);
    if (!snap.exists()) throw new Error('Opportunité introuvable.');
    const opp = snap.data() as Opportunity;

    if (opp.authorId !== verifiedUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cette opportunité.');
    }

    await deleteDoc(oppRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `opportunities/${opportunityId}`);
    throw error;
  }
}

/**
 * Fetch responses for a given opportunity (author only)
 */
export async function fetchOpportunityResponses(opportunityId: string): Promise<OpportunityResponse[]> {
  try {
    const colRef = collection(db, 'opportunityResponses');
    const q = query(colRef, where('opportunityId', '==', opportunityId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ responseId: d.id, ...d.data() } as OpportunityResponse))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'opportunityResponses');
    return [];
  }
}

/**
 * Fetch responses sent by a specific user
 */
export async function fetchUserOpportunityResponses(userId: string): Promise<OpportunityResponse[]> {
  try {
    const colRef = collection(db, 'opportunityResponses');
    const q = query(colRef, where('responderId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ responseId: d.id, ...d.data() } as OpportunityResponse))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'opportunityResponses');
    return [];
  }
}

/**
 * Create a response / application to an opportunity (Mise en relation)
 */
export async function createOpportunityResponse(
  responseData: Omit<OpportunityResponse, 'responseId' | 'createdAt' | 'updatedAt' | 'status'>,
  opportunityTitle?: string,
  opportunityAuthorId?: string
): Promise<string> {
  const verifiedUser = requireAuthUser(responseData.responderId);
  const respRef = doc(collection(db, 'opportunityResponses'));
  const now = new Date().toISOString();
  const response = cleanUndefined({
    ...responseData,
    responderId: verifiedUser.uid,
    responderName: responseData.responderName || verifiedUser.displayName || 'Membre ALLORA',
    responseId: respRef.id,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  });

  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(respRef, response);
      const oppRef = doc(db, 'opportunities', responseData.opportunityId);
      transaction.update(oppRef, {
        responseCount: increment(1),
        updatedAt: now
      });
    });

    // Notify the opportunity author
    const targetAuthorId = opportunityAuthorId || responseData.opportunityAuthorId;
    if (targetAuthorId && targetAuthorId !== verifiedUser.uid) {
      await createInternalNotification({
        userId: targetAuthorId,
        title: 'Nouvelle proposition reçue',
        body: `${response.responderName} a répondu à votre opportunité "${opportunityTitle || 'Opportunité'}".`,
        type: 'opportunities',
        relatedId: responseData.opportunityId
      });
    }

    return respRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'opportunityResponses');
    throw error;
  }
}

/**
 * Update opportunity response status (accept, reject, withdraw)
 */
export async function updateOpportunityResponseStatus(
  responseId: string,
  status: OpportunityResponseStatus,
  responderId: string,
  opportunityTitle: string
): Promise<void> {
  requireAuthUser();
  const now = new Date().toISOString();
  try {
    const respRef = doc(db, 'opportunityResponses', responseId);
    await updateDoc(respRef, {
      status,
      updatedAt: now
    });

    // Notify the responder if accepted or rejected
    if (status === 'accepted' || status === 'rejected') {
      const statusLabel = status === 'accepted' ? 'acceptée' : 'déclinée';
      await createInternalNotification({
        userId: responderId,
        title: `Réponse ${statusLabel}`,
        body: `Votre proposition pour "${opportunityTitle}" a été ${statusLabel}.`,
        type: 'opportunities',
        relatedId: responseId
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `opportunityResponses/${responseId}`);
    throw error;
  }
}

/**
 * Fetch all user profiles that have skills or professional services
 * Enforces user privacy settings (respects profileVisibility, locationVisibility, skillsVisibility)
 */
export async function fetchProfessionalProfiles(skillFilter?: string): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const currentUserId = auth.currentUser?.uid;

    let list = snap.docs.map(d => ({ userId: d.id, ...d.data() } as UserProfile));
    
    // Privacy: Exclude deactivated profiles and private profiles (unless own)
    list = list.filter(u => {
      if (u.isDeactivated || u.status === 'deactivated') return false;
      if (u.privacySettings?.profileVisibility === 'private' && u.userId !== currentUserId) {
        return false;
      }
      return true;
    });

    // Mask fields according to privacy flags if not current user
    list = list.map(u => {
      if (u.userId === currentUserId) return u;
      return {
        ...u,
        location: u.privacySettings?.locationVisibility === false ? undefined : u.location,
        skills: u.privacySettings?.skillsVisibility === false ? [] : u.skills,
        professionalTitle: u.privacySettings?.professionalInfoVisibility === 'private' ? undefined : u.professionalTitle,
        phoneNumber: u.privacySettings?.contactVisibility === 'private' ? undefined : u.phoneNumber,
        email: u.privacySettings?.contactVisibility === 'private' ? '' : u.email,
      };
    });

    // Filter profiles that have filled out skills, title or bio
    list = list.filter(u => 
      (u.skills && u.skills.length > 0) || 
      (u.servicesOffered && u.servicesOffered.length > 0) ||
      Boolean(u.professionalTitle)
    );

    if (skillFilter && skillFilter.trim()) {
      const q = skillFilter.toLowerCase().trim();
      list = list.filter(u => 
        (u.skills && u.skills.some(s => s.toLowerCase().includes(q))) ||
        (u.servicesOffered && u.servicesOffered.some(s => s.toLowerCase().includes(q))) ||
        (u.professionalTitle && u.professionalTitle.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.location && u.location.toLowerCase().includes(q))
      );
    }

    return list;
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

/**
 * Leave a church with role integrity checks:
 * - Prevents an OWNER from abandoning an orphaned church if they are the sole owner.
 * - Removes member association and updates church leaderIds and user churchIds.
 */
export async function leaveChurch(churchId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const verifiedUser = requireAuthUser(userId);
  const membershipId = `${churchId}_${verifiedUser.uid}`;

  // 1. Get church member record
  const memberRef = doc(db, 'churchMembers', membershipId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    throw new Error('Vous n\'êtes pas membre de cette église.');
  }
  const membership = memberSnap.data() as ChurchMember;

  // 2. Get church record
  const churchRef = doc(db, 'churches', churchId);
  const churchSnap = await getDoc(churchRef);
  if (!churchSnap.exists()) {
    throw new Error('L\'église spécifiée n\'existe pas.');
  }
  const church = churchSnap.data() as Church;

  // 3. If OWNER, check if there are other OWNERs
  if (membership.role === 'OWNER') {
    const ownersSnap = await getDocs(
      query(collection(db, 'churchMembers'), where('churchId', '==', churchId), where('role', '==', 'OWNER'))
    );
    const otherOwners = ownersSnap.docs.filter(d => d.data().userId !== verifiedUser.uid);
    if (otherOwners.length === 0) {
      throw new Error(
        'Vous êtes le seul propriétaire (OWNER) de cette église. Vous devez d\'abord nommer un autre propriétaire dans l\'onglet Églises avant de pouvoir la quitter.'
      );
    }
  }

  // 4. Update church leaderIds if user was a leader
  if (church.leaderIds && church.leaderIds.includes(verifiedUser.uid)) {
    const newLeaders = church.leaderIds.filter(id => id !== verifiedUser.uid);
    await updateDoc(churchRef, { leaderIds: newLeaders, updatedAt: new Date().toISOString() });
  }

  // 5. Delete membership document
  await deleteDoc(memberRef);

  // 6. Update user's profile churchIds
  const userRef = doc(db, 'users', verifiedUser.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const uData = userSnap.data() as UserProfile;
    const updatedChurches = (uData.churchIds || []).filter(id => id !== churchId);
    await updateDoc(userRef, { churchIds: updatedChurches, updatedAt: new Date().toISOString() });
  }

  return { success: true, message: `Vous avez quitté l'église "${church.name}".` };
}

/**
 * Create a real persistent Support Ticket or Content Report in Firestore
 */
export async function createSupportTicket(
  ticket: Omit<SupportTicket, 'ticketId' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const verifiedUser = requireAuthUser(ticket.userId);
  const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const payload: SupportTicket = {
    ticketId,
    userId: verifiedUser.uid,
    userEmail: ticket.userEmail,
    userName: ticket.userName,
    type: ticket.type,
    subject: ticket.subject,
    message: ticket.message,
    status: 'open',
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'supportTickets', ticketId), payload);
    return ticketId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'supportTickets');
    throw error;
  }
}

/**
 * Fetch support tickets submitted by current user
 */
export async function fetchUserSupportTickets(userId: string): Promise<SupportTicket[]> {
  const verifiedUser = requireAuthUser(userId);
  try {
    const q = query(collection(db, 'supportTickets'), where('userId', '==', verifiedUser.uid));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data() as SupportTicket)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    if (isNetworkOrOfflineError(error)) return [];
    handleFirestoreError(error, OperationType.LIST, 'supportTickets');
    return [];
  }
}

