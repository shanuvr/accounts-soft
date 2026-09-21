import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { CUSTOMERS, ORDERS, PAYMENTS, fmtINR } from '../data/mockData';

const STATUS_COLORS = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Inactive: 'border-slate-200 bg-slate-100 text-slate-500',
  Lead: 'border-blue-200 bg-blue-50 text-blue-700',
  Suspended: 'border-red-200 bg-red-50 text-red-700',
};

const TYPE_COLORS = {
  Corporate: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  SME: 'border-teal-200 bg-teal-50 text-teal-700',
  Individual: 'border-amber-200 bg-amber-50 text-amber-700',
  Government: 'border-slate-200 bg-slate-100 text-slate-600',
};

function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.Inactive}`}>{status}</span>;
}

function TypeBadge({ type }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TYPE_COLORS[type] ?? TYPE_COLORS.SME}`}>{type}</span>;
}

const inputCls =
  'h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const rows = useMemo(
    () =>
      CUSTOMERS.map((c) => {
        const orders = ORDERS.filter((o) => o.customer === c.name);
        const received = PAYMENTS.filter((p) => p.customer === c.name).reduce((s, p) => s + p.amount, 0);
        const value = orders.reduce((s, o) => s + o.value, 0);
        return { ...c, orderCount: orders.length, value, pending: Math.max(0, value - received) };
      }),
    []
  );

  const filtered = rows.filter((r) => {
    if (search && !`${r.customerId} ${r.name} ${r.contactPerson} ${r.phone} ${r.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (type && r.type !== type) return false;
    if (status && r.status !== status) return false;
    return true;
  });

  const totals = rows.reduce((acc, r) => ({ value: acc.value + r.value, pending: acc.pending + r.pending }), { value: 0, pending: 0 });

  return (
    <Layout active="customers">
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Customers</h1>
            <p className="mt-1 text-[13px] text-slate-500">Complete customer profile and history — orders, services, payments and activity.</p>
          </div>
        </div>

        {/* Summary strip */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">Total Clients</p>
            <p className="mt-1 text-[17px] font-semibold text-slate-800">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">Order Value</p>
            <p className="mt-1 truncate text-[17px] font-semibold text-emerald-700">{fmtINR(totals.value)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">Pending</p>
            <p className="mt-1 truncate text-[17px] font-semibold text-amber-600">{fmtINR(totals.pending)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <div className="relative col-span-2 md:col-span-2">
            <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, ID, contact, phone or email..." className={`${inputCls} pl-9`} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="">Customer Type: All</option>
            {['Corporate', 'SME', 'Individual', 'Government'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">Status: All</option>
            {['Active', 'Inactive', 'Lead', 'Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-2 font-semibold">Customer ID</th>
                  <th className="px-2 py-2 font-semibold">Customer</th>
                  <th className="px-2 py-2 font-semibold">Contact</th>
                  <th className="px-2 py-2 font-semibold">Phone</th>
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 text-right font-semibold">Orders</th>
                  <th className="px-2 py-2 text-right font-semibold">Order Value</th>
                  <th className="px-2 py-2 text-right font-semibold">Pending</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-slate-400">No customers match your filters.</td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr
                    key={c.customerId}
                    onClick={() => navigate(`/customers/${c.customerId}`)}
                    className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-emerald-50/40"
                  >
                    <td className="px-2 py-2 font-medium text-slate-500">{c.customerId}</td>
                    <td className="px-2 py-2 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-2 py-2 text-slate-600">{c.contactPerson}</td>
                    <td className="px-2 py-2 text-slate-500">{c.phone}</td>
                    <td className="px-2 py-2 text-slate-500">{c.email}</td>
                    <td className="px-2 py-2"><TypeBadge type={c.type} /></td>
                    <td className="px-2 py-2 text-right font-semibold text-slate-700">{c.orderCount}</td>
                    <td className="px-2 py-2 text-right text-slate-600">{fmtINR(c.value)}</td>
                    <td className={`px-2 py-2 text-right font-semibold ${c.pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmtINR(c.pending)}</td>
                    <td className="px-2 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.customerId}`); }}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11.5px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Customers;