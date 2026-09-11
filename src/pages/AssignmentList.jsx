import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { useAssignments, ASSIGNMENT_STATUSES } from '../store/assignmentStore';
import { fmtDate } from '../data/mockData';

const ASSIGNMENT_STATUS_COLORS = {
  Assigned: 'border-sky-200 bg-sky-50 text-sky-700',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'On Hold': 'border-orange-200 bg-orange-50 text-orange-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${ASSIGNMENT_STATUS_COLORS[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function AssignmentList() {
  const navigate = useNavigate();
  const assignments = useAssignments();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [team, setTeam] = useState('');

  const summary = [
    { label: 'Total Assignments', count: assignments.length, color: 'bg-emerald-600', icon: 'file' },
    { label: 'Assigned', count: assignments.filter((a) => a.status === 'Assigned').length, color: 'bg-sky-500', icon: 'check' },
    { label: 'In Progress', count: assignments.filter((a) => a.status === 'In Progress').length, color: 'bg-blue-500', icon: 'clock' },
    { label: 'Completed', count: assignments.filter((a) => a.status === 'Completed').length, color: 'bg-emerald-500', icon: 'check' },
  ];

  const teams = [...new Set(assignments.map((a) => a.assignedTeam).filter(Boolean))];

  const filtered = assignments.filter((a) => {
    if (search && !`${a.id} ${a.orderId} ${a.customer} ${a.serviceName} ${a.assignedTo} ${a.status}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status && a.status !== status) return false;
    if (team && a.assignedTeam !== team) return false;
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

  const inputCls = 'h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <Layout active="assignments">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">Who is responsible for the work, across all orders.</p>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{s.label}</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-white ${s.color}`}>{icons[s.icon]}</span>
            </div>
            <p className="mt-1 text-[17px] font-semibold tracking-tight text-slate-900">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          <div className="relative col-span-2 md:col-span-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignment, order..." className={`${inputCls} pl-9`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All statuses</option>
            {ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={inputCls}>
            <option value="">All teams</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3.5 py-2.5 font-semibold">Assignment</th>
                <th className="px-3.5 py-2.5 font-semibold">Order</th>
                <th className="px-3.5 py-2.5 font-semibold">Customer</th>
                <th className="px-3.5 py-2.5 font-semibold">Service</th>
                <th className="px-3.5 py-2.5 font-semibold">Assigned To / Team</th>
                <th className="px-3.5 py-2.5 font-semibold">Assigned Date</th>
                <th className="px-3.5 py-2.5 font-semibold">Expected Delivery</th>
                <th className="px-3.5 py-2.5 font-semibold">Status</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => navigate(`/assignments/${a.id}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-emerald-700 hover:underline">{a.id}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-600">{a.orderId}</td>
                  <td className="max-w-[160px] truncate px-3.5 py-2.5 text-slate-600">{a.customer}</td>
                  <td className="max-w-[160px] truncate px-3.5 py-2.5 text-slate-700">{a.serviceName}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5">
                    <span className="font-medium text-slate-800">{a.assignedTo}</span>
                    {a.assignedTeam && <span className="ml-1.5 text-[12px] text-slate-400">· {a.assignedTeam}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-600">{fmtDate(a.assignedOn)}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-600">{a.expectedDelivery ? fmtDate(a.expectedDelivery) : '—'}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5"><Badge status={a.status} /></td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/assignments/${a.id}`); }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label={`View ${a.id}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-sm text-slate-400">
                    No assignments found. Assign a service from an order and it will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-[12px] text-slate-500">
          <span>Showing {filtered.length} of {assignments.length} assignments</span>
        </div>
      </div>
    </Layout>
  );
}

export default AssignmentList;