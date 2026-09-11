import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { usePayments, getPaymentById, getOrderPaymentSummary, updatePayment } from '../store/paymentStore';
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

function EditModal({ payment, onClose, onSave }) {
  const paymentMethods = usePaymentMethods();
  const [form, setForm] = useState({
    amount: String(payment.amount),
    date: payment.date,
    method: payment.method,
    reference: payment.reference ?? '',
    receivedBy: payment.receivedBy ?? '',
    notes: payment.notes ?? '',
    status: payment.status ?? 'Received',
  });

  const valid = Number(form.amount) > 0 && form.date && form.method;

  const submit = () => {
    if (!valid) return;
    onSave({
      amount: Number(form.amount),
      date: form.date,
      method: form.method,
      reference: form.reference,
      receivedBy: form.receivedBy,
      notes: form.notes,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Edit Payment</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{payment.paymentId} · {payment.orderId} · {payment.customer}</p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div>
              <label htmlFor="ep-amount" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Amount <span className="text-red-400">*</span></label>
              <div className="relative">
                <input id="ep-amount" type="number" step="1" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={`${fieldCls} pr-8`} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">₹</span>
              </div>
            </div>
            <div>
              <label htmlFor="ep-date" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Date <span className="text-red-400">*</span></label>
              <input id="ep-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="ep-method" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Method <span className="text-red-400">*</span></label>
              <select id="ep-method" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className={fieldCls}>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ep-status" className="mb-1 block text-[12px] font-medium text-slate-600">Status</label>
              <select id="ep-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={fieldCls}>
                {Object.keys(PAYMENT_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ep-ref" className="mb-1 block text-[12px] font-medium text-slate-600">Transaction / Reference No.</label>
              <input id="ep-ref" type="text" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="TXN-XXXXXXXX" className={fieldCls} />
            </div>
            <div>
              <label htmlFor="ep-receivedby" className="mb-1 block text-[12px] font-medium text-slate-600">Received By</label>
              <input id="ep-receivedby" type="text" value={form.receivedBy} onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))} className={fieldCls} />
            </div>
          </div>
          <div className="mt-3.5">
            <label htmlFor="ep-notes" className="mb-1 block text-[12px] font-medium text-slate-600">Notes</label>
            <textarea id="ep-notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
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

function PaymentDetail() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  usePayments();

  const payment = getPaymentById(paymentId);

  if (!payment) {
    return (
      <Layout active="payments">
        <div className="p-6 text-[13px] text-slate-500">
          Payment {paymentId} was not found.{' '}
          <button type="button" onClick={() => navigate('/payments')} className="text-emerald-600 hover:underline">Back to Payments</button>
        </div>
      </Layout>
    );
  }

  const summary = getOrderPaymentSummary(payment.orderId);
  const previouslyReceived = summary.received - payment.amount;
  const balance = summary.pending;
  const overpaid = summary.overpaid;

  const save = (patch) => {
    updatePayment(payment.paymentId, patch);
    setEditing(false);
  };

  return (
    <Layout active="payments">
      <div className="p-6">
        <button type="button" onClick={() => navigate('/payments')} className="mb-4 flex items-center gap-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Payments
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-emerald-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2.5 7v10L12 22l9.5-5V7L12 2Z" />
                <path d="M2.5 7 12 12l9.5-5M12 12v10" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold text-slate-900">{payment.paymentId}</h1>
                <Badge status={payment.status} />
              </div>
              <p className="mt-1 text-[13px] text-slate-500">{fmtINR(payment.amount)} received · {payment.method} · {fmtDate(payment.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">Edit</button>
            <button
              type="button"
              onClick={() => navigate(`/orders/${payment.orderId}`)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-5Z" />
                <path d="M4 7h16M9 12h6" />
              </svg>
              View Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Payment information */}
          <Card title="Payment Information">
            <div className="divide-y divide-slate-100">
              <Info label="Order">
                <button type="button" onClick={() => navigate(`/orders/${payment.orderId}`)} className="font-medium text-emerald-600 hover:underline">{payment.orderId}</button>
              </Info>
              <Info label="Customer">{payment.customer}</Info>
              <Info label="Payment Amount"><span className="text-emerald-700">{fmtINR(payment.amount)}</span></Info>
              <Info label="Payment Date">{fmtDate(payment.date)}</Info>
              <Info label="Payment Method">{payment.method}</Info>
              <Info label="Schedule Stage">{payment.planStage || '—'}</Info>
              <Info label="Invoice">
                {payment.invoiceId ? (
                  <button type="button" onClick={() => navigate(`/invoices/${payment.invoiceId}`)} className="font-medium text-emerald-600 hover:underline">{payment.invoiceId}</button>
                ) : '—'}
              </Info>
              <Info label="Transaction Reference">{payment.reference || '—'}</Info>
              <Info label="Received By">{payment.receivedBy || '—'}</Info>
              <Info label="Status"><Badge status={payment.status} /></Info>
            </div>
          </Card>

          {/* Order payment summary */}
          <Card title="Order Payment Summary">
            <div className="divide-y divide-slate-100">
              <Info label="Order Value">{fmtINR(summary.orderValue)}</Info>
              <Info label="Previously Received">{fmtINR(previouslyReceived)}</Info>
              <Info label="This Payment"><span className="text-emerald-700">{fmtINR(payment.amount)}</span></Info>
              <Info label="Total Received"><span className="text-emerald-700">{fmtINR(summary.received)}</span></Info>
              <Info label="Balance Pending"><span className={balance > 0 ? 'text-amber-600' : 'text-emerald-700'}>{fmtINR(balance)}</span></Info>
              {overpaid > 0 && (
                <Info label="Overpaid"><span className="text-violet-600">{fmtINR(overpaid)}</span></Info>
              )}
            </div>
          </Card>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="mt-6">
            <Card title="Notes">
              <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-700">{payment.notes}</p>
            </Card>
          </div>
        )}
      </div>

      {editing && (
        <EditModal
          payment={payment}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      )}
    </Layout>
  );
}

export default PaymentDetail;