import { useState } from 'react';
import Layout from '../layouts/Layout';
import {
  useRenewables,
  RENEWAL_TYPES,
  addRenewable,
  markRenewableNotified,
  renewRenewable,
  deleteRenewable,
  getRenewalStatus,
} from '../store/renewableStore';
import { CUSTOMERS, fmtINR, fmtDate } from '../data/mockData';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_COLORS = {
  Overdue: 'border-red-200 bg-red-50 text-red-700',
  'Expiring Soon': 'border-amber-200 bg-amber-50 text-amber-700',
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const TYPE_COLORS = {
  Domain: 'border-sky-200 bg-sky-50 text-sky-700',
  Hosting: 'border-violet-200 bg-violet-50 text-violet-700',
  Email: 'border-teal-200 bg-teal-50 text-teal-700',
  SMS: 'border-pink-200 bg-pink-50 text-pink-700',
  SSL: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  Other: 'border-slate-200 bg-slate-100 text-slate-600',
};

function Badge({ status, map }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${map[status] ?? map.Active ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function AddRenewalModal({ onClose, onSave }) {
  const [type, setType] = useState('Domain');
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');

  const valid = name.trim() && expiryDate;
  const submit = () => {
    if (!valid) return;
    onSave({ type, name: name.trim(), customer: customer || '—', expiryDate, amount: Number(amount) || 0 });
  };

  const fieldCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Register Renewal</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">Track a subscription so you get reminded before it expires.</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="rnw-type" className="mb-1 block text-[12px] font-medium text-slate-600">Type <span className="text-red-400">*</span></label>
              <select id="rnw-type" value={type} onChange={(e) => setType(e.target.value)} className={fieldCls}>
                {RENEWAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rnw-customer" className="mb-1 block text-[12px] font-medium text-slate-600">Customer</label>
              <select id="rnw-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} className={fieldCls}>
                <option value="">—</option>
                {CUSTOMERS.map((c) => <option key={c.customerId} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rnw-name" className="mb-1 block text-[12px] font-medium text-slate-600">Item <span className="text-red-400">*</span></label>
              <input id="rnw-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. abctech.com, Google Workspace, Bulk SMS pack" className={fieldCls} />
            </div>
            <div>
              <label htmlFor="rnw-expiry" className="mb-1 block text-[12px] font-medium text-slate-600">Expiry Date <span className="text-red-400">*</span></label>
              <input id="rnw-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="rnw-amount" className="mb-1 block text-[12px] font-medium text-slate-600">Renewal Amount (₹)</label>
              <input id="rnw-amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={fieldCls} />
            </div>
          </div>
          <p className="mt-3.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
            This item will be highlighted as <span className="font-semibold">Expiring Soon</span> once it is within 30 days of expiry, and as <span className="font-semibold">Overdue</span> after the date passes.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!valid} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">Add Renewal</button>
        </div>
      </div>
    </div>
  );
}

function RenewModal({ record, onClose, onSave }) {
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [amount, setAmount] = useState(record.amount ?? '');

  const valid = expiryDate;
  const submit = () => {
    if (!valid) return;
    onSave({ expiryDate, amount: Number(amount) || 0 });
  };

  const fieldCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Renew Item</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">Set the new expiry date so the item stops triggering renewal alerts.</p>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TYPE_COLORS[record.type] ?? TYPE_COLORS.Other}`}>{record.type}</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800">{record.name}</p>
              <p className="truncate text-[11.5px] text-slate-500">{record.customer} · Expires {fmtDate(record.expiryDate)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="rnw-renew-expiry" className="mb-1 block text-[12px] font-medium text-slate-600">New Expiry Date <span className="text-red-400">*</span></label>
              <input id="rnw-renew-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="rnw-renew-amount" className="mb-1 block text-[12px] font-medium text-slate-600">Renewal Amount (₹)</label>
              <input id="rnw-renew-amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={fieldCls} />
            </div>
          </div>
          <p className="mt-3.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] text-sky-700">
            Renewing updates the expiry date, records a renewal and clears the <span className="font-semibold">Called</span> status so the next cycle starts fresh.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!valid} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">Renew Item</button>
        </div>
      </div>
    </div>
  );
}

function Renewals() {
  const records = useRenewables();
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [calledFilter, setCalledFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [renewing, setRenewing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const withStatus = records.map((r) => ({ ...r, status: getRenewalStatus(r) }));
  const filtered = withStatus.filter((r) => {
    if (filter && r.type !== filter) return false;
    if (statusFilter && r.status.key !== statusFilter) return false;
    if (calledFilter === 'called' && !r.notified) return false;
    if (calledFilter === 'not-called' && r.notified) return false;
    if (fromDate && r.expiryDate < fromDate) return false;
    if (toDate && r.expiryDate > toDate) return false;
    return true;
  });

  const expiringSoon = withStatus.filter((r) => r.status.key === 'Expiring Soon').length;
  const overdue = withStatus.filter((r) => r.status.key === 'Overdue').length;

  const save = (payload) => {
    const res = addRenewable(payload);
    if (res.ok) setModalOpen(false);
  };

  const handleRenew = (payload) => {
    const res = renewRenewable(renewing.id, payload);
    if (res.ok) setRenewing(null);
  };

  const markCalled = (r) => {
    setConfirm({
      title: 'Mark as Called',
      message: `You have contacted the customer about "${r.name}". Mark it as called so the renewal is recorded as notified?`,
      confirmLabel: 'Mark as Called',
      destructive: false,
      onConfirm: () => {
        markRenewableNotified(r.id);
        setConfirm(null);
      },
    });
  };

  const remove = (r) => {
    setConfirm({
      title: 'Delete Renewal',
      message: `This will permanently remove "${r.name}" from the renewals list. This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        deleteRenewable(r.id);
        setConfirm(null);
      },
    });
  };

  const filterFieldCls = 'h-9 w-[150px] flex-none rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  const stats = [
    { label: 'Total Items', count: records.length, color: 'bg-emerald-600' },
    { label: 'Expiring (≤30 days)', count: expiringSoon, color: 'bg-amber-500' },
    { label: 'Overdue', count: overdue, color: 'bg-red-500' },
  ];

  return (
    <Layout active="renewals">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Renewals</h1>
          <p className="mt-1 text-[13px] text-slate-500">Domains, hosting, email, SMS and more that need renewal — everything within 30 days of expiry shows up here so you can call the customer in time.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Register Renewal
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color} text-[13px] font-bold text-white`}>{s.count}</span>
              <p className="text-[13px] font-medium text-slate-600">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9h16M6 13h12M10 17h4" />
            </svg>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={filterFieldCls} aria-label="Filter by type">
              <option value="">All Types</option>
              {RENEWAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterFieldCls} aria-label="Filter by status">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Overdue">Overdue</option>
            </select>
            <select value={calledFilter} onChange={(e) => setCalledFilter(e.target.value)} className={filterFieldCls} aria-label="Filter by notified">
              <option value="">All (Notified)</option>
              <option value="called">Called / Notified</option>
              <option value="not-called">Not Called Yet</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="Expiry from" className={filterFieldCls} />
            <span>to</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="Expiry to" className={filterFieldCls} />
            {(filter || statusFilter || calledFilter || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => { setFilter(''); setStatusFilter(''); setCalledFilter(''); setFromDate(''); setToDate(''); }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}
            <span className="ml-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600">Showing {filtered.length} of {records.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-2.5 py-2 font-semibold">Item</th>
                <th className="px-2.5 py-2 font-semibold">Type</th>
                <th className="px-2.5 py-2 font-semibold">Customer</th>
                <th className="px-2.5 py-2 font-semibold">Expiry</th>
                <th className="px-2.5 py-2 font-semibold">Status</th>
                <th className="px-2.5 py-2 text-right font-semibold">Amount</th>
                <th className="px-2.5 py-2 font-semibold">Notified</th>
                <th className="px-2.5 py-2 text-right font-semibold">Renew</th>
                <th className="px-2.5 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-slate-800">{r.name}</td>
                  <td className="whitespace-nowrap px-2.5 py-2"><Badge status={r.type} map={TYPE_COLORS} /></td>
                  <td className="max-w-[200px] truncate px-2.5 py-2 text-slate-600">{r.customer}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-slate-600">
                    <span className="block">{fmtDate(r.expiryDate)}</span>
                    {r.lastRenewedAt && (
                      <span className="mt-0.5 block text-[11px] text-emerald-600">Renewed {fmtDate(r.lastRenewedAt)}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2">
                    <span className="flex items-center gap-1.5">
                      <Badge status={r.status.key} map={STATUS_COLORS} />
                      {r.status.key === 'Active' && r.status.daysLeft > 0 && (
                        <span className="text-[11px] text-slate-400">{r.status.daysLeft}d</span>
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-right font-medium text-slate-800">{r.amount ? fmtINR(r.amount) : '—'}</td>
                  <td className="whitespace-nowrap px-2.5 py-2">
                    {r.notified ? (
                      <Badge status="Notified" map={{ Notified: 'border-emerald-200 bg-emerald-50 text-emerald-700' }} />
                    ) : (
                      <span className="text-[11px] text-slate-400">No</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setRenewing(r)}
                      aria-label={`Renew ${r.name}`}
                      title="Renew"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
                      </svg>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-right">
                    {!r.notified && (
                      <button
                        type="button"
                        onClick={() => markCalled(r)}
                        className="mr-1.5 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11.5px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
                        </svg>
                        Called
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(r)}
                      aria-label={`Delete ${r.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-300 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-sm text-slate-400">
                    No renewal items found.
                    {filter && ` Try a different type, or `}
                    <button type="button" onClick={() => setModalOpen(true)} className="font-medium text-emerald-600 hover:underline">register one</button>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-2.5 py-2 text-[12px] text-slate-500">
          <span>Expiring Soon = within 30 days · Overdue = past expiry date</span>
        </div>
      </div>

      {modalOpen && <AddRenewalModal onClose={() => setModalOpen(false)} onSave={save} />}
      {renewing && <RenewModal record={renewing} onClose={() => setRenewing(null)} onSave={handleRenew} />}
      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} confirmLabel={confirm?.confirmLabel} destructive={confirm?.destructive} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </Layout>
  );
}

export default Renewals;