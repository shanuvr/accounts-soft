import { useSyncExternalStore } from 'react';

let invoices = [];
let invoiceCounter = 1;
const listeners = new Set();

const todayISO = () => new Date().toISOString().slice(0, 10);

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return invoices;
}

export function useInvoices() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getInvoiceById(id) {
  return invoices.find((r) => r.invoiceId === id);
}

export function getInvoicesFor(orderId) {
  return invoices
    .filter((r) => r.orderId === orderId)
    .sort((a, b) => (a.invoiceId < b.invoiceId ? 1 : a.invoiceId > b.invoiceId ? -1 : 0));
}

export function getAllInvoices() {
  return [...invoices].sort((a, b) => (a.invoiceId < b.invoiceId ? 1 : a.invoiceId > b.invoiceId ? -1 : 0));
}

export function getInvoicedAmount(orderId) {
  return getInvoicesFor(orderId).reduce((s, i) => s + i.total, 0);
}

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

export function saveInvoice(data) {
  const existing = data.invoiceId ? invoices.find((i) => i.invoiceId === data.invoiceId) : null;
  const record = {
    invoiceId: existing?.invoiceId ?? `INV-${String(invoiceCounter).padStart(3, '0')}`,
    orderId: data.orderId,
    customer: data.customer,
    invoiceType: data.invoiceType ?? 'Full Invoice',
    planId: data.planId ?? null,
    planStage: data.planStage ?? null,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    paymentTerms: data.paymentTerms ?? 'Net 7',
    items: data.items ?? [],
    subtotal: data.subtotal ?? 0,
    discount: data.discount ?? 0,
    tax: data.tax ?? 0,
    taxRate: data.taxRate ?? 0,
    total: data.total ?? 0,
    status: data.status ?? 'Draft',
    notes: data.notes ?? '',
    sentAt: data.sentAt ?? existing?.sentAt ?? null,
  };
  if (!existing) invoiceCounter += 1;
  invoices = existing ? invoices.map((i) => (i.invoiceId === existing.invoiceId ? record : i)) : [...invoices, record];
  emit();
  return record;
}

export function setInvoiceStatus(id, status) {
  const target = invoices.find((i) => i.invoiceId === id);
  if (!target) return null;
  invoices = invoices.map((i) => (i.invoiceId === id ? { ...i, status } : i));
  emit();
  return invoices.find((i) => i.invoiceId === id);
}

export function markInvoiceSent(id, date) {
  const target = invoices.find((i) => i.invoiceId === id);
  if (!target) return null;
  invoices = invoices.map((i) => (i.invoiceId === id ? { ...i, sentAt: date } : i));
  emit();
  return invoices.find((i) => i.invoiceId === id);
}