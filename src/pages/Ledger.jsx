import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';
import { useLedger } from '../store/ledgerStore';
import { fmtINR, fmtDate } from '../data/mockData';

const BOOK_BADGE = {
  Bank: 'border-sky-200 bg-sky-50 text-sky-700',
  Cash: 'border-amber-200 bg-amber-50 text-amber-700',
};

function Ledger() {
  const { entries } = useLedger();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [type, setType] = useState('All');

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (type !== 'All' && e.book !== type) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [entries, dateFrom, dateTo, type]
  );

  const totals = useMemo(
    () => ({
      debit: filtered.reduce((s, e) => s + e.debit, 0),
      credit: filtered.reduce((s, e) => s + e.credit, 0),
    }),
    [filtered]
  );

  const inputCls = 'h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400';

  return (
    <Layout active="ledger">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ledger</h1>
      <p className="mt-1 text-sm text-slate-500">Debit and credit entries across the books.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className={labelCls}>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} aria-label="Date from" />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} aria-label="Date to" />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="All">All</option>
              <option value="Bank">Bank</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); setType('All'); }}
              className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Particulars</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Debit</th>
                <th className="px-4 py-3 text-right font-semibold">Credit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={`${e.docId}-${i}`} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(e.date)}</td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-slate-800">
                    <span className="font-semibold">{e.docId}</span>
                    <span className="ml-2 text-slate-500">{e.reference}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${BOOK_BADGE[e.book] ?? 'border-slate-200 bg-slate-100 text-slate-400'}`}>
                      {e.book ?? '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800">
                    {e.debit ? fmtINR(e.debit) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-600">
                    {e.credit ? fmtINR(e.credit) : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-sm text-slate-400">No ledger entries match your filters.</td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td colSpan="3" className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-slate-500">Total</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-800">{fmtINR(totals.debit)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-600">{fmtINR(totals.credit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default Ledger;