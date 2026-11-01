import { useEffect } from 'react';
import { useApp } from '../state/AppContext.jsx';

export default function Toast() {
  const { toast, hideToast } = useApp();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <aside aria-label="Notifikasi sistem" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-xl shadow-black/10 animate-[pop_0.2s_ease-out]">
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          toast.type === 'error'
            ? 'bg-[var(--danger)]'
            : toast.type === 'warn'
            ? 'bg-[var(--warn)]'
            : 'bg-[var(--ok)]'
        }`}
      />
      <div className="text-sm font-semibold">{toast.message}</div>
      <button
        type="button"
        onClick={hideToast}
        className="ml-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        ✕
      </button>
    </aside>
  );
}
