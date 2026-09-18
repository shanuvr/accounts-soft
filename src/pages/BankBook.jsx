import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';
import { useJournal } from '../store/journalStore';
import { fmtINR, fmtDate } from '../data/mockData';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
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

function BankBook() {
  const journal = useJournal();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const bank = useMemo(() => journal.filter((e) => e.source === 'Bank'), [journal]);

  const summary = useMemo(() => {
    const income = bank.reduce((s, e) => s + e.income, 0);
    const expense = bank.reduce((s, e) => s + e.expense, 0);
    return { income, expense, net: income - expense, count: bank.length };
  }, [bank]);

  const filtered = useMemo(
    () =>
      bank.filter((e) => {
        const q = search.trim().toLowerCase();
        if (q && !`${e.id} ${e.particular}`.toLowerCase().includes(q)) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [bank, search, dateFrom, dateTo]
  );

  const filteredIncome = filtered.reduce((s, e) => s + e.income, 0);
  const filteredExpense = filtered.reduce((s, e) => s + e.expense, 0);

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <Layout active="bankbook">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bank Book</h1>
      <p className="mt-1 text-sm text-slate-500">Bank-only book of the journal — every bank movement recorded in the app appears here automatically.</p>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Bank In" value={fmtINR(summary.income)} sub="credited to bank" tone="text-emerald-700" />
        <Stat label="Bank Out" value={fmtINR(summary.expense)} sub="debited from bank" tone="text-rose-600" />
        <Stat
          label="Bank Balance"
          value={fmtNet(summary.net)}
          sub={summary.net >= 0 ? 'net credited' : 'net debited'}
          tone={summary.net >= 0 ? 'text-sky-700' : 'text-rose-600'}
        />
        <Stat label="Txn" value={summary.count} sub="bank entries" tone="text-sky-600" />
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-[1.6fr_1fr_1fr_auto]">
            <div>
              <label htmlFor="bb-search" className={labelCls}>Search</label>
              <input
                id="bb-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payment id, customer or reference"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="bb-from" className={labelCls}>From</label>
              <input id="bb-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="bb-to" className={labelCls}>To</label>
              <input id="bb-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
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
                <th className="px-4 py-2.5 text-right font-semibold">Bank In</th>
                <th className="px-4 py-2.5 text-right font-semibold">Bank Out</th>
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
                    <p className="text-sm text-slate-400">No bank entries found.</p>
                    <p className="mt-1 text-[12.5px] text-slate-400">
                      Record a payment via a bank method (UPI, NEFT, transfer) and it will appear here.
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
          <span>Showing {filtered.length} of {bank.length} bank entries</span>
          {summary.net > 0 ? <span className="font-medium text-sky-700">Net bank credit {fmtINR(summary.net)}</span> : null}
        </div>
      </div>
    </Layout>
  );
}

export default BankBook;