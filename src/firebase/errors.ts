import { auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isNetworkOrOfflineError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'unavailable' ||
    code === 'auth/network-request-failed' ||
    errMsg.includes('offline') ||
    errMsg.includes('unavailable') ||
    errMsg.includes('network-request-failed') ||
    errMsg.includes('Fetching auth token failed') ||
    errMsg.includes('Could not reach Cloud Firestore backend') ||
    errMsg.includes('Failed to get document because the client is offline') ||
    errMsg.includes('Failed to fetch') ||
    errMsg.includes('NetworkError') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
}

export function isPermissionError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'permission-denied' ||
    errMsg.includes('permission-denied') ||
    errMsg.includes('Missing or insufficient permissions') ||
    errMsg.includes('insufficient permissions')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getHumanErrorMessage(error: unknown): string {
  if (!error) return '';
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return "Cette action n'est pas disponible pour votre compte ou vos autorisations actuelles.";
  }
  if (message.includes('unauthenticated')) {
    return "Veuillez vous connecter pour effectuer cette action.";
  }
  if (isNetworkOrOfflineError(error) || message.includes('network') || message.includes('the client is offline')) {
    return "Connexion réseau instable. Vos données seront synchronisées dès que la connexion sera rétablie.";
  }
  if (message.includes('auth/invalid-email')) {
    return "L'adresse email saisie n'est pas valide.";
  }
  if (message.includes('auth/user-not-found') || message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
    return "Identifiants incorrects. Veuillez vérifier votre email et mot de passe.";
  }
  if (message.includes('auth/email-already-in-use')) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  return "Une erreur inattendue est survenue. Veuillez réessayer.";
}
