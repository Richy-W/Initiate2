import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type NotificationLevel = 'success' | 'error' | 'info';

interface NotificationItem {
  id: string;
  message: string;
  level: NotificationLevel;
}

interface NotificationContextValue {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

const AUTO_DISMISS_MS = 4500;

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pushNotification = useCallback((message: string, level: NotificationLevel) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [...prev, { id, message, level }]);

    window.setTimeout(() => {
      removeNotification(id);
    }, AUTO_DISMISS_MS);
  }, [removeNotification]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifySuccess: (message: string) => pushNotification(message, 'success'),
    notifyError: (message: string) => pushNotification(message, 'error'),
    notifyInfo: (message: string) => pushNotification(message, 'info'),
  }), [pushNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="app-toast-stack" aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`app-toast app-toast--${notification.level}`}
            role="status"
          >
            <span>{notification.message}</span>
            <button
              type="button"
              className="app-toast-dismiss"
              onClick={() => removeNotification(notification.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used inside NotificationProvider');
  }
  return context;
};
