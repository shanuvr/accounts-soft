import { createApiStore } from './createApiStore';
import * as api from '../api/data';
import { ensureLocalOrder } from './orderStore';

function mapRecord(r) {
  return {
    id: r.id,
    invoiceId: r.invoice_id || '',
    orderId: r.order_id || '',
    customer: r.customer_name || '',
    invoiceType: r.invoice_type || 'Full Invoice',
    planId: null,
    planStage: r.plan_stage || null,
    invoiceDate: (r.invoice_date || '').slice(0, 10),
    dueDate: (r.due_date || '').slice(0, 10),
    paymentTerms: r.payment_terms || 'Net 7',
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: Number(r.subtotal) || 0,
    discount: Number(r.discount) || 0,
    tax: Number(r.tax) || 0,
    taxRate: Number(r.tax_rate) || 0,
    total: Number(r.total) || 0,
    status: r.status || 'Draft',
    sentAt: r.sent_at || null,
    notes: r.notes || '',
    auto: r.auto || false,
  };
}

const store = createApiStore({
  fetchList: api.getInvoices,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function useInvoices() {
  return store.useItems();
}

export function getAllInvoices() {
  return [...store.all()].sort((a, b) => (a.invoiceId < b.invoiceId ? 1 : a.invoiceId > b.invoiceId ? -1 : 0));
}

export function getInvoiceById(id) {
  return store.all().find((r) => String(r.invoiceId) === String(id));
}

export function getInvoicesFor(orderId) {
  return store
    .all()
    .filter((r) => r.orderId === orderId)
    .sort((a, b) => (a.invoiceId < b.invoiceId ? 1 : a.invoiceId > b.invoiceId ? -1 : 0));
}

export function getInvoicedAmount(orderId) {
  return getInvoicesFor(orderId).reduce((s, i) => s + i.total, 0);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function getInvoicePaymentSummary(invoiceId, payments) {
  const invoice = getInvoiceById(invoiceId);
  const linked = payments.filter(
    (p) => p.invoiceId === invoiceId && p.status !== 'Refunded' && p.status !== 'Failed'
  );
  const received = linked.reduce((s, p) => s + p.amount, 0);
  const total = invoice?.total ?? 0;
  let status;
  if (received <= 0) status = 'Unpaid';
  else if (received < total) status = 'Partially Paid';
  else status = 'Paid';
  if (invoice && invoice.dueDate < todayISO() && received < total) status = 'Overdue';
  return { received, pending: Math.max(0, total - received), overpaid: Math.max(0, received - total), status, payments: linked };
}

export function getInvoiceStatus(invoice, payments) {
  if (!invoice) return 'Draft';
  if (invoice.status === 'Cancelled') return 'Cancelled';
  if (invoice.status === 'Draft') return 'Draft';
  const linked = payments.filter(
    (p) => p.invoiceId === invoice.invoiceId && p.status !== 'Refunded' && p.status !== 'Failed'
  );
  const received = linked.reduce((s, p) => s + p.amount, 0);
  const pastDue = invoice.dueDate < todayISO();
  if (invoice.total > 0 && received >= invoice.total) return 'Paid';
  if (received > 0) return pastDue ? 'Overdue' : 'Partially Paid';
  if (invoice.sentAt) return 'Sent';
  return pastDue ? 'Overdue' : 'Issued';
}

function buildPayload(data, orderPk) {
  return {
    order: orderPk,
    invoice_type: data.invoiceType ?? 'Full Invoice',
    plan_stage: data.planStage ?? '',
    invoice_date: data.invoiceDate,
    due_date: data.dueDate,
    payment_terms: data.paymentTerms ?? 'Net 7',
    items: data.items ?? [],
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    tax: Number(data.tax) || 0,
    tax_rate: Number(data.taxRate) || 0,
    total: Number(data.total) || 0,
    status: data.status ?? 'Draft',
    sent_at: data.sentAt || null,
    notes: data.notes ?? '',
    auto: data.auto ?? false,
  };
}

async function upsertInvoice(data) {
  const existing = data.id ? store.all().find((i) => i.id === data.id) : null;
  const orderPk = await ensureLocalOrder(data.orderId);
  if (!orderPk) return { ok: false, reason: 'notfound' };
  const payload = buildPayload(data, orderPk);
  if (existing) return store.run(() => api.updateInvoice(existing.id, payload));
  return store.run(() => api.createInvoice(payload));
}

export async function saveInvoice(data) {
  return upsertInvoice(data);
}

export async function setInvoiceStatus(id, status) {
  const target = store.all().find((i) => i.invoiceId === id);
  if (!target) return null;
  const res = await store.run(() => api.updateInvoice(target.id, { status }));
  return res.ok ? res.record : null;
}

export async function markInvoiceSent(id, date) {
  const target = store.all().find((i) => i.invoiceId === id);
  if (!target) return null;
  const res = await store.run(() => api.updateInvoice(target.id, { sent_at: date || null }));
  return res.ok ? res.record : null;
}

export async function removeInvoice(id) {
  const target = store.all().find((i) => i.invoiceId === id);
  if (!target) return;
  await store.run(() => api.deleteInvoice(target.id));
}

function addDays(dateISO, days) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getAutoDraftFor(orderId) {
  return store.all().find((i) => i.orderId === orderId && i.auto && i.status === 'Draft') ?? null;
}

export function hasIssuedInvoice(orderId) {
  return store.all().some((i) => i.orderId === orderId && i.status !== 'Draft' && i.status !== 'Cancelled');
}

export async function syncAutoDraftInvoice({ orderId, customer, services }) {
  if (hasIssuedInvoice(orderId)) return null;
  const existing = getAutoDraftFor(orderId);
  const items = services
    .filter((s) => s.ptdStatus === 'Completed' && Number(s.price) > 0)
    .map((s) => ({
      name: s.name,
      quantity: 1,
      price: Number(s.price) || 0,
      discount: 0,
      taxRate: 0,
      amount: Number(s.price) || 0,
    }));

  if (items.length === 0) {
    if (existing) await removeInvoice(existing.invoiceId);
    return null;
  }

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const today = todayISO();
  return upsertInvoice({
    id: existing?.id,
    invoiceId: existing?.invoiceId,
    orderId,
    customer,
    invoiceType: 'Full Invoice',
    invoiceDate: existing?.invoiceDate ?? today,
    dueDate: existing?.dueDate ?? addDays(today, 7),
    paymentTerms: existing?.paymentTerms ?? 'Net 7',
    items,
    subtotal,
    discount: 0,
    tax: 0,
    taxRate: 0,
    total: subtotal,
    status: 'Draft',
    auto: true,
  });
}