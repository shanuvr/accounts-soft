import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { useInvoices, getAllInvoices, getInvoiceStatus } from '../store/invoiceStore';
import { usePayments } from '../store/paymentStore';
import { fmtINR, fmtDate } from '../data/mockData';

const INVOICE_STATUS = {
  Draft: 'border-slate-200 bg-slate-100 text-slate-600',
  Issued: 'border-sky-200 bg-sky-50 text-sky-700',
  Sent: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  'Partially Paid': 'border-amber-200 bg-amber-50 text-amber-700',
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Overdue: 'border-red-200 bg-red-50 text-red-700',
  Cancelled: 'border-slate-200 bg-slate-50 text-slate-400',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${INVOICE_STATUS[status] ?? INVOICE_STATUS.Draft}`}>
      {status}
    </span>
  );
}

function InvoiceList() {
  const navigate = useNavigate();
  const invoices = useInvoices();
  const payments = usePayments();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customer, setCustomer] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const rows = useMemo(
    () => getAllInvoices().map((inv) => ({ inv, status: getInvoiceStatus(inv, payments) })),
    [payments]
  );

  const customers = useMemo(() => [...new Set(invoices.map((i) => i.customer))], [invoices]);

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const paid = rows.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.inv.total, 0);
  const outstanding = Math.max(0, totalInvoiced - paid);

  const filtered = rows.filter(({ inv, status: st }) => {
    if (search && !`${inv.invoiceId} ${inv.orderId} ${inv.customer}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status && st !== status) return false;
    if (customer && inv.customer !== customer) return false;
    if (dateFrom && inv.invoiceDate < dateFrom) return false;
    if (dateTo && inv.invoiceDate > dateTo) return false;
    return true;
  });

  const cards = [
    { label: 'Total Invoiced', value: fmtINR(totalInvoiced), cls: 'text-slate-800' },
    { label: 'Paid', value: fmtINR(paid), cls: 'text-emerald-700' },
    { label: 'Outstanding', value: fmtINR(outstanding), cls: outstanding > 0 ? 'text-amber-600' : 'text-slate-800' },
  ];

  const inputCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <Layout active="invoices">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Invoices</h1>
        <p className="mt-1 text-sm text-slate-500">View, search and manage all invoices generated from orders.</p>
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, order, customer..." className={`${inputCls} pl-9`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All Statuses</option>
            {Object.keys(INVOICE_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls}>
            <option value="">All Customers</option>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Invoice date from" className={inputCls} />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Invoice date to" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Invoice No.</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ inv, status: st }) => (
                <tr key={inv.invoiceId} onClick={() => navigate(`/invoices/${inv.invoiceId}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700 hover:underline">{inv.invoiceId}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{inv.orderId}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-800">{inv.customer}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(inv.invoiceDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(inv.dueDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-800">{fmtINR(inv.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3"><Badge status={st} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.invoiceId}`); }}
                      aria-label={`View ${inv.invoiceId}`}
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
                  <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-400">
                    No invoices match your filters. Generate one from Order Detail → Generate Invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-[12px] text-slate-500">
          <span>Showing {filtered.length} of {invoices.length} invoices</span>
        </div>
      </div>
    </Layout>
  );
}

export default InvoiceList;