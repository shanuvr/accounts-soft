import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { usePtds } from '../store/ptdStore';
import { fmtDate } from '../data/mockData';

const PTD_STATUS_COLORS = {
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  'Not Created': 'border-slate-200 bg-slate-100 text-slate-600',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PTD_STATUS_COLORS[status] ?? PTD_STATUS_COLORS['Not Created']}`}>
      {status}
    </span>
  );
}

function PtdList() {
  const navigate = useNavigate();
  const ptds = usePtds();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [customer, setCustomer] = useState('');

  const services = [...new Set(ptds.map((p) => p.serviceName))];
  const customers = [...new Set(ptds.map((p) => p.customer))];

  const summary = [
    { label: 'Total PTDs', count: ptds.length, color: 'bg-emerald-600', icon: 'file' },
    { label: 'Completed', count: ptds.filter((p) => p.status === 'Completed').length, color: 'bg-emerald-500', icon: 'check' },
    { label: 'Draft', count: ptds.filter((p) => p.status === 'Draft').length, color: 'bg-amber-500', icon: 'clock' },
  ];

  const filtered = ptds.filter((p) => {
    if (search && !`${p.id} ${p.orderId} ${p.customer} ${p.serviceName} ${p.status}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status && p.status !== status) return false;
    if (service && p.serviceName !== service) return false;
    if (customer && p.customer !== customer) return false;
    return true;
  });

  const icons = {
    file: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4.5 4.5L19 7.5" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  };

  const inputCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <Layout active="ptd">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">PTD</h1>
        <p className="mt-1 text-sm text-slate-500">Manage project technical data sheets.</p>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-500">{s.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${s.color}`}>{icons[s.icon]}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PTD, order, customer..." className={`${inputCls} pl-9`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All statuses</option>
            {['Completed', 'Draft'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={service} onChange={(e) => setService(e.target.value)} className={inputCls}>
            <option value="">All services</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls}>
            <option value="">All customers</option>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">PTD ID</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Billing</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/ptd/${p.id}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700 hover:underline">{p.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.orderId}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-800">{p.customer}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{p.serviceName}</td>
                  <td className="whitespace-nowrap px-4 py-3"><Badge status={p.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.billable === false ? (
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">Non-Billable</span>
                    ) : (
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">Billable</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(p.updatedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/ptd/${p.id}`); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label={`View ${p.id}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/ptd/${p.id}?edit=1`); }}
                      className="ml-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      aria-label={`Edit ${p.id}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-400">No PTDs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-[12px] text-slate-500">
          <span>Showing {filtered.length} of {ptds.length} PTDs</span>
        </div>
      </div>
    </Layout>
  );
}

export default PtdList;