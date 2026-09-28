import { ChurchNotification } from '../../types';

export function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied' as NotificationPermission);
  }
  return Notification.requestPermission();
}

export async function requestPushNotificationPermission(_userId?: string): Promise<boolean> {
  const perm = await requestBrowserNotificationPermission();
  return perm === 'granted';
}

export function showBrowserNotification(
  notification: ChurchNotification,
  preferences?: Record<string, boolean>
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  // Check user notification preferences
  if (preferences && notification.type in preferences) {
    if (preferences[notification.type] === false) {
      return;
    }
  }

  try {
    new Notification(notification.title, {
      body: notification.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.notificationId,
    });
  } catch (err) {
    console.warn('Browser notification error:', err);
  }
}
