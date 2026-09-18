import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';
import { useJournal } from '../store/journalStore';
import { fmtINR, fmtDate } from '../data/mockData';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400';

const fmtNet = (v) => (v < 0 ? `-${fmtINR(Math.abs(v))}` : fmtINR(v));

function Stat({ label, value, sub, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-[17px] font-semibold tracking-tight ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10.5px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Cashbook() {
  const journal = useJournal();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const cash = useMemo(() => journal.filter((e) => e.source === 'Cash'), [journal]);

  const summary = useMemo(() => {
    const income = cash.reduce((s, e) => s + e.income, 0);
    const expense = cash.reduce((s, e) => s + e.expense, 0);
    return { income, expense, net: income - expense, count: cash.length };
  }, [cash]);

  const filtered = useMemo(
    () =>
      cash.filter((e) => {
        const q = search.trim().toLowerCase();
        if (q && !`${e.id} ${e.particular}`.toLowerCase().includes(q)) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [cash, search, dateFrom, dateTo]
  );

  const filteredIncome = filtered.reduce((s, e) => s + e.income, 0);
  const filteredExpense = filtered.reduce((s, e) => s + e.expense, 0);

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <Layout active="cashbook">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cashbook</h1>
      <p className="mt-1 text-sm text-slate-500">Cash-only book of the journal — every cash movement recorded in the app appears here automatically.</p>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Cash In" value={fmtINR(summary.income)} sub="cash received" tone="text-emerald-700" />
        <Stat label="Cash Out" value={fmtINR(summary.expense)} sub="cash spent" tone="text-rose-600" />
        <Stat
          label="Cash Position"
          value={fmtNet(summary.net)}
          sub={summary.net >= 0 ? 'in hand' : 'overdrawn'}
          tone={summary.net >= 0 ? 'text-amber-700' : 'text-rose-600'}
        />
        <Stat label="Txn" value={summary.count} sub="cash entries" tone="text-sky-600" />
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-[1.6fr_1fr_1fr_auto]">
            <div>
              <label htmlFor="cb-search" className={labelCls}>Search</label>
              <input
                id="cb-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payment id, customer or reference"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="cb-from" className={labelCls}>From</label>
              <input id="cb-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="cb-to" className={labelCls}>To</label>
              <input id="cb-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-semibold">Payment ID</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Particular</th>
                <th className="px-4 py-2.5 text-right font-semibold">Cash In</th>
                <th className="px-4 py-2.5 text-right font-semibold">Cash Out</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">{e.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(e.date)}</td>
                  <td className="max-w-[400px] truncate px-4 py-3 text-slate-800">{e.particular}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-700">
                    {e.income ? fmtINR(e.income) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">
                    {e.expense ? fmtINR(e.expense) : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-400">No cash entries found.</p>
                    <p className="mt-1 text-[12.5px] text-slate-400">
                      Record a payment with method <span className="font-medium text-slate-500">Cash</span> and it will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td colSpan="3" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">{fmtINR(filteredIncome)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-600">{fmtINR(filteredExpense)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-[12px] text-slate-400">
          <span>Showing {filtered.length} of {cash.length} cash entries</span>
          {summary.net > 0 ? <span className="font-medium text-amber-700">Cash in hand {fmtINR(summary.net)}</span> : null}
        </div>
      </div>
    </Layout>
  );
}

export default Cashbook;