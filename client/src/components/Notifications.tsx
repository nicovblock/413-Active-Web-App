import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';

export const Notifications = () => {
  const { notifications, dismiss } = useNotificationStore();

  useEffect(() => {
    const timers = notifications.map((n) => setTimeout(() => dismiss(n.id), 3500));
    return () => timers.forEach(clearTimeout);
  }, [notifications, dismiss]);

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2" aria-live="polite">
      {notifications.map((n) => (
        <div key={n.id} className="card bg-emerald-500/90 text-white">
          {n.message}
        </div>
      ))}
    </div>
  );
};
