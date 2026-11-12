import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePendingPopups, dismissPopup, markAsRead } from '../store/notificationStore';
import { loadRenewables } from '../store/renewableStore';

export default function NotificationPopups() {
  const pending = usePendingPopups();
  const navigate = useNavigate();

  useEffect(() => {
    loadRenewables();
  }, []);

  if (!pending || pending.length === 0) {
    return null;
  }

  // Show up to 4 popups at once to prevent screen overflow
  const visiblePopups = pending.slice(0, 4);

  const handleClick = (item) => {
    dismissPopup(item.id);
    markAsRead(item.id);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleDismiss = (e, item) => {
    e.stopPropagation();
    dismissPopup(item.id);
  };

  return (
    <aside
      aria-label="Notifications"
      className="fixed top-5 right-5 z-50 flex max-w-sm w-full flex-col gap-2.5 pointer-events-none"
    >
      {visiblePopups.map((item) => {
        const isError = item.severity === 'error';

        return (
          <div
            key={item.id}
            onClick={() => handleClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(item);
              }
            }}
            className={`pointer-events-auto group relative flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3.5 shadow-xl shadow-slate-900/10 transition-all hover:shadow-2xl hover:scale-[1.01] ${
              isError ? 'border-red-200 hover:border-red-300' : 'border-amber-200 hover:border-amber-300'
            }`}
          >
            {/* Status Icon */}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                isError ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1 pr-5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    isError ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.statusKey}
                </span>
                {item.type && (
                  <span className="text-[11px] font-medium text-slate-400">· {item.type}</span>
                )}
              </div>
              <p className="mt-1 text-[13px] font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                {item.name}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500 line-clamp-2">
                {item.message}
              </p>
              <p className="mt-1 text-[11px] font-medium text-emerald-600">
                Click to view renewal →
              </p>
            </div>

            {/* Dismiss 'x' button */}
            <button
              type="button"
              onClick={(e) => handleDismiss(e, item)}
              aria-label="Dismiss notification popup"
              className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </aside>
  );
}

