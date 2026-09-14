'use client';
import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'info' | 'scheduled';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// ─── Notification Store ───────────────────────────────────────────────────────
interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              ...n,
              id: Math.random().toString(36).slice(2),
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.notifications.slice(0, 49), // keep max 50
          ],
        })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clear: () => set({ notifications: [] }),
    }),
    { name: 'echo-notifications' }
  )
);

// ─── Bell Button (used in sidebar) ───────────────────────────────────────────
export function NotificationBell({ onClick }: { onClick: () => void }) {
  const { notifications } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
const ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={14} className="text-emerald-400" />,
  error: <AlertCircle size={14} className="text-red-400" />,
  info: <Zap size={14} className="text-sky-400" />,
  scheduled: <Clock size={14} className="text-amber-400" />,
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, markAllRead, clear } = useNotificationStore();

  useEffect(() => {
    if (isOpen) markAllRead();
  }, [isOpen, markAllRead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-80 bg-[#111111] border-l border-white/8 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-zinc-400" />
            <span className="text-sm font-semibold text-white">Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button onClick={clear} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-700">
              <Bell size={24} className="mb-2" />
              <p className="text-xs">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-white/3 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{ICONS[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-300">{n.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.message}</div>
                      <div className="text-xs text-zinc-700 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
