import { useSyncExternalStore } from 'react';

const SEED_INVOICES = [
  {
    invoiceId: 'INV-001',
    orderId: 'ORD-1024',
    customer: 'ABC Technologies Pvt Ltd',
    invoiceType: 'Full Invoice',
    planId: null,
    planStage: null,
    invoiceDate: '2026-09-06',
    dueDate: '2026-09-20',
    paymentTerms: 'Net 14',
    items: [
      { name: 'Domain Registration', quantity: 1, price: 3000 },
      { name: 'Web Design', quantity: 1, price: 10000 },
      { name: 'Website Programming Dynamic Section', quantity: 1, price: 2000 },
    ],
    subtotal: 15000,
    discount: 0,
    tax: 0,
    taxRate: 0,
    total: 15000,
    status: 'Issued',
    notes: '',
    sentAt: '2026-09-06',
  },
  {
    invoiceId: 'INV-002',
    orderId: 'ORD-1023',
    customer: 'BlueSky Media',
    invoiceType: 'Full Invoice',
    planId: null,
    planStage: null,
    invoiceDate: '2026-09-05',
    dueDate: '2026-08-28',
    paymentTerms: 'Due on Receipt',
    items: [
      { name: 'Domain Registration', quantity: 1, price: 3000 },
      { name: 'Web Design', quantity: 1, price: 10000 },
      { name: 'Website Programming Dynamic Section', quantity: 1, price: 2000 },
    ],
    subtotal: 15000,
    discount: 0,
    tax: 0,
    taxRate: 0,
    total: 15000,
    status: 'Issued',
    notes: '',
    sentAt: '2026-09-05',
  },
  {
    invoiceId: 'INV-003',
    orderId: 'ORD-1021',
    customer: 'Nova Systems',
    invoiceType: 'Full Invoice',
    planId: null,
    planStage: null,
    invoiceDate: '2026-08-26',
    dueDate: '2026-09-02',
    paymentTerms: 'Net 7',
    items: [
      { name: 'Domain Registration', quantity: 1, price: 3000 },
      { name: 'Web Design', quantity: 1, price: 10000 },
      { name: 'Website Programming Dynamic Section', quantity: 1, price: 2000 },
    ],
    subtotal: 15000,
    discount: 0,
    tax: 0,
    taxRate: 0,
    total: 15000,
    status: 'Issued',
    notes: '',
    sentAt: '2026-08-26',
  },
];

let invoices = SEED_INVOICES.map((i) => ({ ...i }));
let invoiceCounter = 10;
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
    auto: data.auto ?? existing?.auto ?? false,
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

export function removeInvoice(id) {
  if (!invoices.some((i) => i.invoiceId === id)) return;
  invoices = invoices.filter((i) => i.invoiceId !== id);
  emit();
}

function addDays(dateISO, days) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getAutoDraftFor(orderId) {
  return invoices.find((i) => i.orderId === orderId && i.auto && i.status === 'Draft') ?? null;
}

export function hasIssuedInvoice(orderId) {
  return invoices.some((i) => i.orderId === orderId && i.status !== 'Draft' && i.status !== 'Cancelled');
}

export function syncAutoDraftInvoice({ orderId, customer, services }) {
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
    if (existing) removeInvoice(existing.invoiceId);
    return null;
  }

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const today = todayISO();
  return saveInvoice({
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