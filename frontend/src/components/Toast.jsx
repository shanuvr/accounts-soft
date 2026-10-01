import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50">
      <div
        role="status"
        className={`anim-chip pointer-events-auto flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-lg shadow-black/5 ${
          isError
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-600/30'
        }`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            isError ? 'bg-rose-500/15 text-rose-600' : 'bg-white/20 text-white'
          }`}
        >
          {isError ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </span>
        <p className="text-[13px] font-medium">{toast.message}</p>
      </div>
    </div>
  );
}