import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { useNotifications } from '../store/notificationStore';
import { loadRenewables } from '../store/renewableStore';

export default function Notifications() {
  const { notifications, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Notifications · Account Soft';
    loadRenewables();
  }, []);

  // When notifications tab is opened ("read by proxy opened"), mark all current notifications as read
  useEffect(() => {
    if (notifications.length > 0) {
      markAllAsRead();
    }
  }, [notifications, markAllAsRead]);

  return (
    <Layout active="notifications">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Alerts for subscriptions, renewals, and system events requiring attention.
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-medium text-slate-600">
              {notifications.length} active alert{notifications.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-slate-900">All caught up!</h3>
            <p className="mt-1 max-w-sm text-[13px] text-slate-500">
              There are no pending renewal alerts or unread notifications at this time.
            </p>
            <button
              type="button"
              onClick={() => navigate('/renewals')}
              className="mt-5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Go to Renewals
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const isOverdue = item.statusKey === 'Overdue';

              return (
                <div
                  key={item.id}
                  onClick={() => item.link && navigate(item.link)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (item.link) navigate(item.link);
                    }
                  }}
                  className={`group flex cursor-pointer flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
                    isOverdue ? 'border-red-200/90' : 'border-amber-200/90'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                            isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.statusKey}
                        </span>
                        {item.type && (
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {item.type}
                          </span>
                        )}
                        {item.amountFormatted && (
                          <span className="text-[12px] font-semibold text-slate-800">
                            {item.amountFormatted}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 text-[14px] font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {item.name}
                      </h3>

                      <p className="mt-0.5 text-[12.5px] text-slate-500">
                        {item.customer && item.customer !== '—' && (
                          <span className="font-medium text-slate-700">{item.customer} · </span>
                        )}
                        <span className={isOverdue ? 'font-medium text-red-600' : 'font-medium text-amber-600'}>
                          {item.daysText}
                        </span>
                        <span> (Expiry: {item.expiryDateFormatted})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end sm:pl-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                      View Renewal
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

