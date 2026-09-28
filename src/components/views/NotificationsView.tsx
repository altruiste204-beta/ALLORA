import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { markAllNotificationsAsRead } from '../../supabase/services/dataService';
import { ChurchNotification } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

export const NotificationsView: React.FC = () => {
  const { user, notifications, refreshNotifications } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (user) {
      const uid = user.id || (user as any).uid;
      // Mark all as read when opening the view
      markAllNotificationsAsRead(uid).then(() => {
        refreshNotifications();
      });
    }
  }, [user, refreshNotifications]);

  const getIconForType = (type: ChurchNotification['type']) => {
    switch (type) {
      case 'membership_approved':
      case 'membership_request':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#67B7E8] dark:text-[#67B7E8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          </div>
        );
      case 'community':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#67B7E8] dark:text-[#67B7E8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        );
      case 'events':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#67B7E8] dark:text-[#67B7E8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] text-[#19344A] dark:text-[#FAF9F6]/70 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-[#19344A] dark:text-white font-sans tracking-tight">
          {t.notifications.title}
        </h1>
        <span className="text-xs font-medium text-[#19344A] dark:text-[#FAF9F6]/70 bg-[#FAF9F6] dark:bg-[#1D334D] px-2 py-1 rounded-lg">
          {notifications.length} {t.notifications.total}
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#FAF9F6] dark:bg-[#1D334D] rounded-full flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#19344A] dark:text-[#FAF9F6]/70">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{t.notifications.emptyTitle}</h3>
          <p className="text-sm text-[#19344A] dark:text-[#FAF9F6]/70 mt-1 max-w-xs">
            {t.notifications.emptySubtitle}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.notificationId}
              className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                notification.read 
                  ? 'bg-white dark:bg-[#19344A] border-[#E8E4D9] dark:border-[#67B7E8]/10 opacity-80' 
                  : 'bg-white dark:bg-[#19344A] border-[#E8E4D9] dark:border-blue-900/50 shadow-sm ring-1 ring-blue-50 dark:ring-blue-900/20'
              }`}
            >
              <div className="shrink-0">
                {getIconForType(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-bold truncate ${notification.read ? 'text-[#19344A] dark:text-white' : 'text-[#19344A] dark:text-[#DCEFFA]'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-[10px] font-medium text-[#19344A] dark:text-[#FAF9F6]/70 shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(notification.createdAt), { 
                      addSuffix: true, 
                      locale: language === 'fr' ? fr : enUS 
                    })}
                  </span>
                </div>
                <p className="text-xs text-[#19344A] dark:text-[#FAF9F6]/70 mt-1 leading-relaxed">
                  {notification.body}
                </p>
                {notification.churchName && (
                  <div className="inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded text-[9px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 uppercase tracking-wider">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {notification.churchName}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 text-center">
        <p className="text-[11px] text-[#19344A] dark:text-[#FAF9F6]/70 font-medium">
          {t.notifications.footerNotice}
        </p>
      </div>
    </div>
  );
};
