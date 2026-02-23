import { create } from 'zustand';

interface Notification {
  id: number;
  message: string;
}

interface NotificationState {
  notifications: Notification[];
  push: (message: string) => void;
  dismiss: (id: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  push: (message) =>
    set((state) => ({ notifications: [...state.notifications, { id: Date.now(), message }] })),
  dismiss: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }))
}));
