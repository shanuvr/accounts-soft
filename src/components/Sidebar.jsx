import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';

const stroke = { stroke: 'currentColor', strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

const I = {
  dashboard: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-5Z" />
      <path d="M4 7h16M9 12h6" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 6.9M17.5 19a5 5 0 0 0-2.6-4.4" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M12 2 2.5 7v10L12 22l9.5-5V7L12 2Z" />
      <path d="M2.5 7 12 12l9.5-5M12 12v10" />
    </svg>
  ),
  ptd: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  assignments: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M9 4V3h6v1M8 12l2.5 2.5L16 9" />
    </svg>
  ),
  delivery: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M3 6h11v10H3z" />
      <path d="M14 9h4l3 3v4h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6.5 15h4" />
    </svg>
  ),
  ledger: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M6 3h12v18H6z" />
      <path d="M9 7h6M9 11h6M9 15h3M6 3l-2 3 2 3M18 3l2 3-2 3" />
    </svg>
  ),
  invoices: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  ),
  renewals: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M4 15h3l1.5-4 2 6 2-8 2 6 1.5-4h4" />
      <path d="M21 9V4l-2 2a8 8 0 1 0 1 4h1Z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  masters: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <circle cx="5" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M5 8v12M12 6v8M19 4v6" />
    </svg>
  ),
  usersRoles: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M12 2 3 7v5c0 5 3.5 8.5 9 10 5.5-1.5 9-5 9-10V7l-9-5Z" />
      <circle cx="12" cy="10" r="3" />
      <path d="M9 16.5c1.8 1.2 4.2 1.2 6 0" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-4 w-4">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" {...stroke} className="h-[18px] w-[18px]">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

const MAIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'orders', label: 'Orders', icon: 'orders' },
  { id: 'ptd', label: 'PTD', icon: 'ptd' },
  { id: 'customers', label: 'Customers', icon: 'customers' },
  { id: 'assignments', label: 'Assignments', icon: 'assignments' },
  { id: 'delivery', label: 'Delivery Tracking', icon: 'delivery' },
  { id: 'invoices', label: 'Invoices', icon: 'invoices' },
  { id: 'payments', label: 'Receipts', icon: 'payments' },
  { id: 'ledger', label: 'Ledger', icon: 'ledger' },
  { id: 'renewals', label: 'Renewals', icon: 'renewals' },
];

const PATHS = {
  dashboard: '/dashboard',
  orders: '/orders',
  customers: '/customers',
  ptd: '/ptd',
  assignments: '/assignments',
  delivery: '/delivery',
  payments: '/payments',
  ledger: '/ledger',
  invoices: '/invoices',
  renewals: '/renewals',
};

const MASTER_NAV = [
  { label: 'Product / Service Master', path: '/products-services' },
  { label: 'Service Category', path: '/service-categories' },
  { label: 'Payment Methods', path: '/payment-methods' },
  { label: 'Tax Master', path: '/tax-master' },
  { label: 'Employee Master', path: '/employee-master' },
  { label: 'Department Master', path: '/department-master' },
];

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        active ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {I[icon]}
      <span className="truncate">{label}</span>
    </button>
  );
}

function Sidebar({ active = 'dashboard', mobileOpen = false, onClose }) {
  const [mastersOpen, setMastersOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path d="M4 4h11a4 4 0 0 1 4 4v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 14l2.5-2.5 2 2L15.5 9.5 17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">Account Soft</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Order · Delivery · Finance</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-1">
            {MAIN_NAV.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={active === item.id}
                onClick={() => navigate(PATHS[item.id])}
              />
            ))}
          </div>

          {/* Masters */}
          <div>
            <button
              type="button"
              onClick={() => setMastersOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="flex items-center gap-3">
                {I.masters}
                <span>Masters</span>
              </span>
              <span className={`text-slate-400 transition-transform ${mastersOpen ? 'rotate-180' : ''}`}>{I.chevron}</span>
            </button>
            {mastersOpen && (
              <div className="mt-1 space-y-0.5 border-l border-slate-200 pl-4">
                {MASTER_NAV.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => navigate(m.path)}
                    className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[12.5px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              {user.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-800">{user.name}</p>
            </div>
            <button type="button" className="text-slate-400 transition-colors hover:text-slate-600" aria-label="Sign out">
              {I.logout}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;