function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', destructive = false, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${destructive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {destructive ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              </svg>
            )}
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{message}</p>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition-colors ${
              destructive ? 'bg-red-500 hover:bg-red-400' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;