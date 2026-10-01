import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import {
  useReports,
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_TYPE_LABELS,
  addReport,
  updateReport,
  deleteReport,
} from '../store/reportStore';
import { fmtDate } from '../data/mockData';
import ConfirmDialog from '../components/ConfirmDialog';

const TYPE_COLORS = {
  orders: 'border-sky-200 bg-sky-50 text-sky-700',
  ptda: 'border-violet-200 bg-violet-50 text-violet-700',
  assignments: 'border-amber-200 bg-amber-50 text-amber-700',
  deliveries: 'border-teal-200 bg-teal-50 text-teal-700',
  finance: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const FORMAT_COLORS = {
  excel: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  csv: 'border-slate-200 bg-slate-100 text-slate-600',
  pdf: 'border-rose-200 bg-rose-50 text-rose-700',
};

const RUN_PATHS = {
  orders: '/orders',
  ptda: '/ptd',
  assignments: '/assignments',
  deliveries: '/delivery',
  finance: '/ledger',
};

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400';

function Badge({ text, map }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${map[text] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      {text}
    </span>
  );
}

function ReportModal({ record, onClose, onSave }) {
  const [name, setName] = useState(record?.name ?? '');
  const [reportType, setReportType] = useState(record?.reportType ?? 'orders');
  const [format, setFormat] = useState(record?.format ?? 'pdf');
  const [isActive, setIsActive] = useState(record?.isActive !== false);
  const [filtersText, setFiltersText] = useState(JSON.stringify(record?.filters ?? {}, null, 2));
  const [columnsText, setColumnsText] = useState(
    JSON.stringify(Array.isArray(record?.columns) && record.columns.length ? record.columns : ['id', 'name'], null, 2)
  );
  const [jsonError, setJsonError] = useState('');

  const valid = name.trim() && !jsonError;

  const submit = () => {
    let filters;
    let columns;
    try {
      filters = JSON.parse(filtersText || '{}');
      columns = JSON.parse(columnsText || '[]');
    } catch {
      setJsonError('Filters and columns must be valid JSON.');
      return;
    }
    onSave({ name: name.trim(), reportType, format, isActive, filters, columns });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">{record ? 'Edit Report' : 'New Report'}</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">Save a report configuration so it can be regenerated anytime.</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="space-y-3.5">
            <div>
              <label htmlFor="rp-name" className={labelCls}>Report Name <span className="text-red-400">*</span></label>
              <input id="rp-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Orders Summary" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="rp-type" className={labelCls}>Report Type</label>
                <select id="rp-type" value={reportType} onChange={(e) => setReportType(e.target.value)} className={inputCls}>
                  {REPORT_TYPES.map((t) => <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rp-format" className={labelCls}>Format</label>
                <select id="rp-format" value={format} onChange={(e) => setFormat(e.target.value)} className={inputCls}>
                  {REPORT_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="rp-filters" className={labelCls}>Filters (JSON object)</label>
              <textarea id="rp-filters" value={filtersText} onChange={(e) => { setFiltersText(e.target.value); setJsonError(''); }} rows="3" spellCheck="false" className={`w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-[12px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100`} placeholder='{ "from_date": "2026-01-01", "status": "active" }' />
            </div>
            <div>
              <label htmlFor="rp-columns" className={labelCls}>Columns (JSON array)</label>
              <textarea id="rp-columns" value={columnsText} onChange={(e) => { setColumnsText(e.target.value); setJsonError(''); }} rows="3" spellCheck="false" className={`w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-[12px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100`} placeholder='["id", "customer", "total"]' />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
              <span className="text-[13px] font-medium text-slate-700">Active</span>
            </label>
            {jsonError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{jsonError}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!valid} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{record ? 'Save Changes' : 'Create Report'}</button>
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const records = useReports();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const q = search.trim().toLowerCase();
  const filtered = records.filter((r) => {
    if (q && !`${r.name} ${r.createdBy}`.toLowerCase().includes(q)) return false;
    if (typeFilter && r.reportType !== typeFilter) return false;
    return true;
  });

  const activeCount = records.filter((r) => r.isActive).length;

  const save = async (payload) => {
    const res = editing ? await updateReport(editing.id, payload) : await addReport(payload);
    if (res.ok) {
      setModalOpen(false);
      setEditing(null);
    }
  };

  const toggleActive = async (r) => {
    await updateReport(r.id, { isActive: !r.isActive });
  };

  const edit = (r) => {
    setEditing(r);
    setModalOpen(true);
  };

  const remove = (r) => {
    setConfirm({
      title: 'Delete Report',
      message: `This will permanently remove "${r.name}" from saved reports. This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await deleteReport(r.id);
        setConfirm(null);
      },
    });
  };

  const stats = [
    { label: 'Total Reports', count: records.length, color: 'bg-emerald-600' },
    { label: 'Active', count: activeCount, color: 'bg-sky-500' },
    { label: 'Inactive', count: records.length - activeCount, color: 'bg-slate-400' },
  ];

  return (
    <Layout active="reports">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
          <p className="mt-1 text-[13px] text-slate-500">Saved report configurations — run any saved report to open the related module with its pre-set columns and filters.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Report
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

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9h16M6 13h12M10 17h4" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports…"
              aria-label="Search reports"
              className="h-9 w-[180px] rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type" className="h-9 w-[150px] rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
              <option value="">All Types</option>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>)}
            </select>
            {(search || typeFilter) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setTypeFilter(''); }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}
          </div>
          <span className="ml-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600">Showing {filtered.length} of {records.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-2.5 py-2 font-semibold">Report</th>
                <th className="px-2.5 py-2 font-semibold">Type</th>
                <th className="px-2.5 py-2 font-semibold">Format</th>
                <th className="px-2.5 py-2 text-center font-semibold">Columns</th>
                <th className="px-2.5 py-2 font-semibold">Created</th>
                <th className="px-2.5 py-2 text-center font-semibold">Active</th>
                <th className="px-2.5 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-2.5 py-2">
                    <p className="font-semibold text-slate-800">{r.name}</p>
                    {r.createdBy && <p className="mt-0.5 text-[11px] text-slate-400">{r.createdBy}</p>}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2"><Badge text={REPORT_TYPE_LABELS[r.reportType] ?? r.reportType} map={TYPE_COLORS} /></td>
                  <td className="whitespace-nowrap px-2.5 py-2"><Badge text={r.format.toUpperCase()} map={FORMAT_COLORS} /></td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-center text-slate-600">{r.columns.length}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-slate-600">{fmtDate(r.createdAt)}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(r)}
                      aria-label={`Toggle ${r.name}`}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${r.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(RUN_PATHS[r.reportType] || '/reports')}
                      aria-label={`Run ${r.name}`}
                      title="Run report"
                      className="mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 3l14 9-14 9V3Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => edit(r)}
                      aria-label={`Edit ${r.name}`}
                      title="Edit"
                      className="mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                      </svg>
                    </button>
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
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-400">No report configurations found.</p>
                    <p className="mt-1 text-[12.5px] text-slate-400">
                      {records.length ? 'Try a different search or filter.' : 'Save your first report so it can be rerun anytime — or '}
                      <button type="button" onClick={() => { setEditing(null); setModalOpen(true); }} className="font-medium text-emerald-600 hover:underline">create one</button>.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-2.5 py-2 text-[12px] text-slate-500">
          <span>Run opens the {REPORT_TYPES.map((t) => REPORT_TYPE_LABELS[t]).join(' · ')} module with the saved configuration.</span>
        </div>
      </div>

      {modalOpen && <ReportModal record={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={save} />}
      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} confirmLabel={confirm?.confirmLabel} destructive={confirm?.destructive} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </Layout>
  );
}

export default Reports;