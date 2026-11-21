'use client';
import { create } from 'zustand';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string; action?: { label: string; onClick: () => void } }

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string, action?: ToastItem['action']) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message, action) => {
    const id = nextId++;
    set(s => ({ toasts: [...s.toasts.slice(-3), { id, kind, message, action }] }));
    setTimeout(() => get().dismiss(id), kind === 'error' ? 7000 : 4000);
  },
  dismiss: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

/** Fire-and-forget toasts from anywhere: toast.success('Saved'). */
export const toast = {
  success: (m: string, action?: ToastItem['action']) => useToastStore.getState().push('success', m, action),
  error: (m: string) => useToastStore.getState().push('error', m),
  info: (m: string) => useToastStore.getState().push('info', m),
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]" aria-live="polite">
      {toasts.map(t => {
        const Icon = t.kind === 'success' ? CheckCircle : t.kind === 'error' ? AlertCircle : Info;
        const tone = t.kind === 'success' ? 'text-emerald-400' : t.kind === 'error' ? 'text-red-400' : 'text-indigo-400';
        return (
          <div key={t.id} role="status" className="flex items-start gap-2.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3.5 py-3 shadow-2xl">
            <Icon size={15} className={`${tone} mt-0.5 shrink-0`} />
            <p className="text-[13px] text-[#e4e4e7] flex-1 leading-snug">{t.message}</p>
            {t.action && (
              <button onClick={() => { t.action!.onClick(); dismiss(t.id); }} className="text-[12px] font-medium text-indigo-400 hover:text-indigo-300 shrink-0">
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-zinc-600 hover:text-zinc-300 shrink-0"><X size={13} /></button>
          </div>
        );
      })}
    </div>
  );
}
