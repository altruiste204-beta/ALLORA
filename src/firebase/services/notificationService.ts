import { UserProfile, ChurchNotification } from '../../types';
import { updateUserFields } from './userService';

/**
 * Checks if a specific notification type is allowed by the user's notification preferences
 */
export function isNotificationAllowed(
  type: ChurchNotification['type'],
  preferences?: UserProfile['notificationPreferences']
): boolean {
  if (!preferences) return true; // Default enabled

  switch (type) {
    case 'needs':
      return preferences.needs !== false;
    case 'resources':
      return preferences.resources !== false;
    case 'membership_request':
    case 'membership_approved':
    case 'membership_rejected':
    case 'role_changed':
    case 'churches':
      return preferences.churches !== false;
    case 'collaborations':
      return preferences.collaborations !== false;
    case 'events':
      return preferences.events !== false;
    case 'community':
      return preferences.community !== false;
    case 'system':
    case 'info':
      return preferences.system !== false;
    default:
      return true;
  }
}

/**
 * Request Browser Push Notification permission and persist state in UserProfile
 */
export async function requestPushNotificationPermission(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('ALLORA: Ce navigateur ne supporte pas les notifications push.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';

    if (isGranted) {
      await updateUserFields(userId, {
        pushNotificationsEnabled: true
      });
      // Trigger a gentle welcome push confirmation
      new Notification('ALLORA Réseau', {
        body: 'Les notifications push sont désormais activées pour votre compte.',
        icon: '/favicon.ico'
      });
    } else {
      await updateUserFields(userId, {
        pushNotificationsEnabled: false
      });
    }

    return isGranted;
  } catch (error) {
    console.warn('Erreur lors de la demande de permission de notification:', error);
    return false;
  }
}

/**
 * Display native browser push notification if permitted and category is allowed
 */
export function showBrowserNotification(
  notification: ChurchNotification,
  preferences?: UserProfile['notificationPreferences']
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  if (!isNotificationAllowed(notification.type, preferences)) {
    return;
  }

  try {
    new Notification(notification.title, {
      body: notification.body,
      icon: '/favicon.ico'
    });
  } catch {
    // Graceful fallback if in unsupported iframe
  }
}
