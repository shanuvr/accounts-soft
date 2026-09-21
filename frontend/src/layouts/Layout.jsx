import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../store/authStore';

function Layout({ active, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAuth();

  return (
    <div className="no-print flex h-screen overflow-hidden bg-slate-50">
      <Sidebar active={active} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="z-20 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div className="lg:hidden">
              <p className="text-[15px] font-semibold tracking-tight text-slate-900">Account Soft</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-semibold text-emerald-700">
              {user.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
            </span>
            <span className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {user.name}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;