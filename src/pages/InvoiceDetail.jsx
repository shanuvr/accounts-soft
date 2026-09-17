import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { useInvoices, getInvoiceById, saveInvoice, setInvoiceStatus, markInvoiceSent, getInvoicePaymentSummary, getInvoiceStatus } from '../store/invoiceStore';
import { usePayments, createPayment } from '../store/paymentStore';
import { usePaymentMethods } from '../store/paymentMethodStore';
import { useTaxMaster } from '../store/taxStore';
import { fmtINR, fmtDate } from '../data/mockData';
import { useAuth } from '../store/authStore';
import { downloadInvoicePdf } from '../utils/invoicePdf';

const INVOICE_STATUS = {
  Draft: 'border-slate-200 bg-slate-100 text-slate-600',
  Issued: 'border-sky-200 bg-sky-50 text-sky-700',
  Sent: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  'Partially Paid': 'border-amber-200 bg-amber-50 text-amber-700',
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Overdue: 'border-red-200 bg-red-50 text-red-700',
  Cancelled: 'border-slate-200 bg-slate-50 text-slate-400',
};

const PAYMENT_TXN_STATUS = {
  Received: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Failed: 'border-red-200 bg-red-50 text-red-700',
  Refunded: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const TERMS = { 'Due on Receipt': 0, 'Net 7': 7, 'Net 15': 15, 'Net 30': 30 };

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (d, n) => {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

function Badge({ status, map }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${map[status] ?? map.Unpaid}`}>
      {status}
    </span>
  );
}

function Info({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{children}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

const fieldCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function EditModal({ invoice, onClose, onSave }) {
  const taxRecords = useTaxMaster();
  const currentTaxRate = String(invoice.taxRate ?? 0);
  const [form, setForm] = useState({
    status: invoice.status,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    terms: invoice.paymentTerms ?? 'Net 7',
    taxRate: String(invoice.taxRate ?? 0),
    discount: String(invoice.discount ?? 0),
    notes: invoice.notes ?? '',
  });

  const subtotal = invoice.subtotal;
  const discountVal = Number(form.discount) || 0;
  const tax = Math.round(((subtotal - discountVal) * (Number(form.taxRate) || 0)) / 100);
  const total = subtotal - discountVal + tax;

  const valid = form.invoiceDate && form.dueDate;

  const submit = () => {
    if (!valid) return;
    onSave({
      status: form.status,
      discount: discountVal,
      tax,
      taxRate: Number(form.taxRate) || 0,
      total,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      paymentTerms: form.terms,
      notes: form.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Edit Invoice</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{invoice.invoiceId} · {invoice.orderId} · {invoice.customer}</p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div>
              <label htmlFor="ei-status" className="mb-1 block text-[12px] font-medium text-slate-600">Document Status</label>
              <select id="ei-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={fieldCls}>
                <option value="Draft">Draft</option>
                <option value="Issued">Issued</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="ei-date" className="mb-1 block text-[12px] font-medium text-slate-600">Invoice Date <span className="text-red-400">*</span></label>
              <input id="ei-date" type="date" value={form.invoiceDate} onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="ei-due" className="mb-1 block text-[12px] font-medium text-slate-600">Due Date <span className="text-red-400">*</span></label>
              <input id="ei-due" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="ei-terms" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Terms</label>
              <select id="ei-terms" value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value, dueDate: addDaysISO(f.invoiceDate, TERMS[e.target.value] ?? 7) }))} className={fieldCls}>
                {Object.keys(TERMS).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ei-tax" className="mb-1 block text-[12px] font-medium text-slate-600">Tax Rate</label>
              <select id="ei-tax" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} className={fieldCls}>
                {taxRecords.map((t) => <option key={t.name} value={t.rate}>{t.name} ({t.rate}%)</option>)}
                {currentTaxRate !== '0' && !taxRecords.some((t) => String(t.rate) === currentTaxRate) && (
                  <option value={currentTaxRate}>Current ({currentTaxRate}%)</option>
                )}
                <option value="0">No Tax (0%)</option>
              </select>
            </div>
            <div>
              <label htmlFor="ei-discount" className="mb-1 block text-[12px] font-medium text-slate-600">Discount (₹)</label>
              <input id="ei-discount" type="number" step="1" min="0" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} className={fieldCls} />
            </div>
          </div>
          <div className="mt-3.5">
            <label htmlFor="ei-notes" className="mb-1 block text-[12px] font-medium text-slate-600">Notes</label>
            <textarea id="ei-notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Terms or instructions shown on the invoice..." className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-[13px]">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-medium text-slate-800">{fmtINR(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Discount</span><span className="font-medium text-slate-800">− {fmtINR(discountVal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Tax ({form.taxRate}%)</span><span className="font-medium text-slate-800">{fmtINR(tax)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-[15px] font-semibold text-slate-900"><span>Total</span><span>{fmtINR(total)}</span></div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!valid} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function RecordPayment({ invoice, user, onClose, onRecord }) {
  const paymentMethods = usePaymentMethods();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const valid = Number(amount) > 0 && date && method;

  const submit = () => {
    if (!valid) return;
    onRecord({ amount: Number(amount), date, method, reference, receivedBy: user.name, notes, planStage: invoice.planStage });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Record Payment for {invoice.invoiceId}</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{invoice.orderId} · {invoice.customer} · Invoice total {fmtINR(invoice.total)}</p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div>
              <label htmlFor="rp-amount" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Amount <span className="text-red-400">*</span></label>
              <div className="relative">
                <input id="rp-amount" type="number" step="1" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${fieldCls} pr-8`} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">₹</span>
              </div>
            </div>
            <div>
              <label htmlFor="rp-date" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Date <span className="text-red-400">*</span></label>
              <input id="rp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="rp-method" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Method <span className="text-red-400">*</span></label>
              <select id="rp-method" value={method} onChange={(e) => setMethod(e.target.value)} className={fieldCls}>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rp-ref" className="mb-1 block text-[12px] font-medium text-slate-600">Transaction / Reference No.</label>
              <input id="rp-ref" type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN-XXXXXXXX" className={fieldCls} />
            </div>
          </div>
          <div className="mt-3.5">
            <label htmlFor="rp-notes" className="mb-1 block text-[12px] font-medium text-slate-600">Notes</label>
            <textarea id="rp-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for this payment..." className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </div>
          {invoice.planStage && (
            <p className="mt-3.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
              Linked to schedule stage: <span className="font-semibold text-slate-700">{invoice.planStage}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!valid} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">Record Payment</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceDetail() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const user = useAuth();
  useInvoices();
  const payments = usePayments();
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);

  const invoice = getInvoiceById(invoiceId);

  if (!invoice) {
    return (
      <Layout active="invoices">
        <div className="p-6 text-[13px] text-slate-500">
          Invoice {invoiceId} was not found.{' '}
          <button type="button" onClick={() => navigate('/invoices')} className="text-emerald-600 hover:underline">Back to Invoices</button>
        </div>
      </Layout>
    );
  }

  const summary = getInvoicePaymentSummary(invoice.invoiceId, payments);
  const status = getInvoiceStatus(invoice, payments);

  const downloadPdf = () => {
    downloadInvoicePdf(invoice, user);
  };

  const save = (patch) => {
    saveInvoice({ ...invoice, ...patch });
    setEditing(false);
  };

  const recordPayment = (payload) => {
    createPayment({ orderId: invoice.orderId, customer: invoice.customer, ...payload, invoiceId: invoice.invoiceId });
    setPaying(false);
  };

  const send = () => {
    markInvoiceSent(invoice.invoiceId, todayISO());
  };

  const issue = () => {
    setInvoiceStatus(invoice.invoiceId, 'Issued');
  };

  return (
    <Layout active="invoices">
      <div className="p-6">
        <button type="button" onClick={() => navigate('/invoices')} className="print:hidden mb-4 flex items-center gap-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Invoices
        </button>

        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{invoice.invoiceId}</h1>
                <Badge status={status} map={INVOICE_STATUS} />
                <span className="text-[12.5px] text-slate-400">{invoice.invoiceType}</span>
              </div>
              <p className="mt-1 text-[14px] text-slate-600">{invoice.customer}</p>
            </div>
            <p className="text-[13px] font-semibold text-slate-800">Total {fmtINR(invoice.total)}</p>
          </div>

          {/* Meta */}
          <div className="mt-5 grid grid-cols-2 gap-x-10 border-t border-slate-100 px-6 pt-4 pb-2 sm:grid-cols-4">
            <div className="pb-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Invoice Date</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-800">{fmtDate(invoice.invoiceDate)}</p>
            </div>
            <div className="pb-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Due Date</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-800">{fmtDate(invoice.dueDate)}</p>
            </div>
            <div className="pb-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Order</p>
              <button type="button" onClick={() => navigate(`/orders/${invoice.orderId}`)} className="mt-0.5 text-[13px] font-medium text-emerald-600 hover:underline">{invoice.orderId}</button>
            </div>
            <div className="pb-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Payment</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-800">{invoice.planStage ?? invoice.invoiceType}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="print:hidden flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Edit
            </button>
            {status === 'Draft' && (
              <button type="button" onClick={issue} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500">
                Mark as Issued
              </button>
            )}
            {invoice.status !== 'Draft' && invoice.status !== 'Cancelled' && (
              <button type="button" onClick={send} disabled={!!invoice.sentAt} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
                {invoice.sentAt ? '✓ Sent' : 'Send'}
              </button>
            )}
            <button
              type="button"
              onClick={downloadPdf}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Items & totals */}
          <div className="lg:col-span-2">
            <Card title='Invoice Items'>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Service</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((it, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{it.name}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{it.quantity}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">{fmtINR(it.price * it.quantity - (it.discount || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 ml-auto max-w-[300px] space-y-1.5 text-[13px]">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-medium text-slate-800">{fmtINR(invoice.subtotal)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Tax</span><span className="font-medium text-slate-800">{fmtINR(invoice.tax)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Discount</span><span className="font-medium text-slate-800">− {fmtINR(invoice.discount)}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-[16px] font-bold text-slate-900"><span>TOTAL</span><span>{fmtINR(invoice.total)}</span></div>
              </div>

              {invoice.notes && (
                <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[12.5px] leading-5 text-slate-600">
                  <span className="font-semibold text-slate-700">Notes: </span>{invoice.notes}
                </p>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card title="Payment Status">
              <div className="divide-y divide-slate-100">
                <Info label="Invoiced">{fmtINR(invoice.total)}</Info>
                <Info label="Received"><span className={summary.received > 0 ? 'text-emerald-700' : ''}>{fmtINR(summary.received)}</span></Info>
                <Info label="Pending"><span className={summary.pending > 0 ? 'text-amber-600' : 'text-emerald-700'}>{fmtINR(summary.pending)}</span></Info>
              </div>
              {summary.overpaid > 0 && (
                <p className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-medium text-violet-700">Overpaid by {fmtINR(summary.overpaid)}</p>
              )}
              <button
                type="button"
                onClick={() => setPaying(true)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                  <path d="M2.5 10h19M6.5 15h4" />
                </svg>
                Record Payment
              </button>
            </Card>

            <Card title="Connections">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Order</p>
                    <p className="mt-0.5 truncate text-[13px] font-medium text-slate-800">{invoice.orderId}</p>
                  </div>
                  <button type="button" onClick={() => navigate(`/orders/${invoice.orderId}`)} className="shrink-0 text-[12px] font-medium text-emerald-600 hover:underline">
                    View Order →
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Payment Plan</p>
                    <p className="mt-0.5 truncate text-[13px] font-medium text-slate-800">{invoice.planStage ? `${invoice.invoiceType} · ${invoice.planStage}` : invoice.invoiceType}</p>
                  </div>
                  <button type="button" onClick={() => navigate(`/orders/${invoice.orderId}`)} className="shrink-0 text-[12px] font-medium text-emerald-600 hover:underline">
                    View Schedule →
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Payments</p>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-800">
                      {summary.payments.length === 0 ? 'No payments yet' : summary.payments.map((p) => p.paymentId).join(', ')}
                    </p>
                  </div>
                  {summary.payments.length > 0 && (
                    <button type="button" onClick={() => navigate(`/payments/${summary.payments[0].paymentId}`)} className="shrink-0 text-[12px] font-medium text-emerald-600 hover:underline">
                      View Payment →
                    </button>
                  )}
                </div>
                {invoice.sentAt && (
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Sent On</p>
                    <p className="text-[13px] font-medium text-slate-800">{fmtDate(invoice.sentAt)}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Linked payments */}
        <div className="mt-6">
          <Card title="Payments Linked to This Invoice">
            {summary.payments.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-slate-400">No payments recorded against this invoice yet. Use Record Payment to link one.</p>
            ) : (
              <div className="space-y-2">
                {summary.payments.map((p) => (
                  <button
                    key={p.paymentId}
                    type="button"
                    onClick={() => navigate(`/payments/${p.paymentId}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-emerald-700 hover:underline">{p.paymentId}</span>
                      <span className="text-[12.5px] text-slate-500">{fmtDate(p.date)}</span>
                      <span className="text-[12.5px] text-slate-500">{p.method}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-slate-800">{fmtINR(p.amount)}</span>
                      <Badge status={p.status} map={PAYMENT_TXN_STATUS} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {editing && <EditModal invoice={invoice} onClose={() => setEditing(false)} onSave={save} />}
      {paying && <RecordPayment invoice={invoice} user={user} onClose={() => setPaying(false)} onRecord={recordPayment} />}
    </Layout>
  );
}

export default InvoiceDetail;