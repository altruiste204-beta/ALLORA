export function isNetworkOrOfflineError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  return (
    errMsg.includes('offline') ||
    errMsg.includes('Failed to fetch') ||
    errMsg.includes('NetworkError') ||
    errMsg.includes('network') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
}

export function getHumanErrorMessage(error: unknown): string {
  if (!error) return '';
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Identifiants incorrects. Veuillez vérifier votre adresse email et mot de passe.';
  }
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Votre adresse email n\'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.';
  }
  if (message.includes('User already registered') || message.includes('already registered')) {
    return 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.';
  }
  if (message.includes('Password should be at least') || message.includes('weak_password')) {
    return 'Le mot de passe doit comporter au moins 6 caractères.';
  }
  if (message.includes('permission denied') || message.includes('new row violates row-level security')) {
    return 'Cette action n\'est pas autorisée par vos permissions actuelles.';
  }
  if (message.includes('JWT expired') || message.includes('session_not_found')) {
    return 'Votre session a expiré. Veuillez vous reconnecter.';
  }
  if (isNetworkOrOfflineError(error)) {
    return 'Connexion réseau instable. Vérifiez votre connexion internet.';
  }

  return message || 'Une erreur inattendue est survenue. Veuillez réessayer.';
}
