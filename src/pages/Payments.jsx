import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { usePayments, getGlobalSummary } from '../store/paymentStore';
import { usePaymentMethods } from '../store/paymentMethodStore';
import { fmtINR, fmtDate } from '../data/mockData';

const PAYMENT_STATUS = {
  Received: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Failed: 'border-red-200 bg-red-50 text-red-700',
  Refunded: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS[status] ?? PAYMENT_STATUS.Pending}`}>
      {status}
    </span>
  );
}

function Payments() {
  const navigate = useNavigate();
  const payments = usePayments();
  const paymentMethods = usePaymentMethods();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [customer, setCustomer] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const global = getGlobalSummary();
  const customers = useMemo(() => [...new Set(payments.map((p) => p.customer))], [payments]);

  const filtered = payments.filter((p) => {
    if (search && !`${p.paymentId} ${p.orderId} ${p.customer} ${p.reference}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status && p.status !== status) return false;
    if (method && p.method !== method) return false;
    if (customer && p.customer !== customer) return false;
    if (dateFrom && p.date < dateFrom) return false;
    if (dateTo && p.date > dateTo) return false;
    return true;
  });

  const cards = [
    { label: 'Total Received', value: fmtINR(global.totalReceived), cls: 'text-emerald-700' },
    { label: 'Pending', value: fmtINR(global.totalPending), cls: global.totalPending > 0 ? 'text-amber-600' : 'text-slate-800' },
    { label: 'Transactions', value: global.transactionCount, cls: 'text-slate-800' },
  ];

  const inputCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <Layout active="payments">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Track customer payments, outstanding amounts and payment history.</p>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{c.label}</p>
            <p className={`mt-1 text-[20px] font-semibold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payment, order, customer..." className={`${inputCls} pl-9`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All payment statuses</option>
            {Object.keys(PAYMENT_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
            <option value="">All payment methods</option>
            {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls}>
            <option value="">All customers</option>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} aria-label="Payment date from" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} aria-label="Payment date to" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Payment ID</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Payment Date</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Schedule Stage</th>
                <th className="px-4 py-3 font-semibold">Invoice</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.paymentId} onClick={() => navigate(`/payments/${p.paymentId}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700 hover:underline">{p.paymentId}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.orderId}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-800">{p.customer}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(p.date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-800">{fmtINR(p.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{p.method}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.planStage || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.invoiceId || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3"><Badge status={p.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/payments/${p.paymentId}`); }}
                      aria-label={`View ${p.paymentId}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-sm text-slate-400">No payments match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-[12px] text-slate-500">
          <span>Showing {filtered.length} of {payments.length} payments</span>
        </div>
      </div>
    </Layout>
  );
}

export default Payments;