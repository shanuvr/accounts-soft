import { useMemo } from 'react';
import { useInvoices } from './invoiceStore';
import { usePayments } from './paymentStore';

const todayISO = () => new Date().toISOString().slice(0, 10);

const AGING_BUCKETS = ['Current', '1-30', '31-60', '61-90', '90+'];

function daysBetween(from, to) {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function entryForInvoice(inv) {
  return {
    date: inv.invoiceDate,
    docId: inv.invoiceId,
    docType: 'Invoice',
    orderId: inv.orderId,
    customer: inv.customer,
    reference: inv.invoiceType || 'Invoice',
    projectReference: inv.orderId,
    invoiceId: inv.invoiceId,
    invoiceAmount: Number(inv.total) || 0,
    taxTds: Number(inv.tax) || 0,
    paymentId: null,
    method: null,
    book: 'Bank',
    debit: Number(inv.total) || 0,
    credit: 0,
  };
}

function bookFor(method) {
  return method === 'Cash' ? 'Cash' : method ? 'Bank' : null;
}

export function entryForPayment(p, invoiceIndex = new Map()) {
  const linked = p.invoiceId ? invoiceIndex.get(p.invoiceId) : null;
  if (p.status === 'Failed') return null;
  if (p.status === 'Refunded') {
    return {
      date: p.date,
      docId: p.paymentId,
      docType: 'Refund',
      orderId: p.orderId,
      customer: p.customer,
      reference: p.reference || `Refund ${p.paymentId}`,
      projectReference: p.orderId,
      invoiceId: p.invoiceId ?? null,
      invoiceAmount: Number(linked?.total) || 0,
      taxTds: Number(linked?.tax) || 0,
      paymentId: p.paymentId,
      method: p.method,
      book: bookFor(p.method),
      debit: Number(p.amount) || 0,
      credit: 0,
    };
  }
  return {
    date: p.date,
    docId: p.paymentId,
    docType: 'Payment',
    orderId: p.orderId,
    customer: p.customer,
    reference: p.reference || `${p.method} receipt`,
    projectReference: p.orderId,
    invoiceId: p.invoiceId ?? null,
    invoiceAmount: Number(linked?.total) || 0,
    taxTds: Number(linked?.tax) || 0,
    paymentId: p.paymentId,
    method: p.method,
    book: bookFor(p.method),
    debit: 0,
    credit: Number(p.amount) || 0,
  };
}

export function buildEntries(invoices, payments) {
  const entries = [];
  const invoiceIndex = new Map(invoices.map((i) => [i.invoiceId, i]));
  for (const inv of invoices) {
    if (inv.status === 'Draft' || inv.status === 'Cancelled') continue;
    entries.push(entryForInvoice(inv));
  }
  for (const p of payments) {
    const e = entryForPayment(p, invoiceIndex);
    if (e) entries.push(e);
  }
  return entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.docType.localeCompare(b.docType)));
}

export function withRunningBalance(entries) {
  let balance = 0;
  return entries.map((e) => {
    balance += e.debit - e.credit;
    return { ...e, balance };
  });
}

function allocatePayments(invoices, payments) {
  const received = {};
  invoices.forEach((inv) => { received[inv.invoiceId] = 0; });
  const sorted = [...payments].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const p of sorted) {
    if (p.status === 'Failed') continue;
    let amount = Number(p.amount) || 0;
    if (p.status === 'Refunded') amount = -amount;
    const target = p.invoiceId ? invoices.find((i) => i.invoiceId === p.invoiceId) : null;
    if (target) {
      received[target.invoiceId] += amount;
      continue;
    }
    const candidates = invoices.filter(
      (i) => i.orderId === p.orderId && received[i.invoiceId] < (Number(i.total) || 0)
    );
    for (const cand of candidates) {
      const remaining = (Number(cand.total) || 0) - received[cand.invoiceId];
      const apply = Math.min(remaining, amount);
      received[cand.invoiceId] += apply;
      amount -= apply;
      if (amount <= 0) break;
    }
  }
  return received;
}

function billForInvoice(inv, received) {
  const total = Number(inv.total) || 0;
  const outstanding = Math.max(0, total - (received[inv.invoiceId] || 0));
  if (outstanding <= 0) return null;
  const due = daysBetween(inv.dueDate, todayISO());
  const bucket = due <= 0 ? 'Current' : due <= 30 ? '1-30' : due <= 60 ? '31-60' : due <= 90 ? '61-90' : '90+';
  return { invoice: inv, outstanding, bucket };
}

function emptyBuckets() {
  const ageing = {};
  AGING_BUCKETS.forEach((b) => { ageing[b] = 0; });
  return ageing;
}

function bucketsForCustomer(rows, customer) {
  const ageing = emptyBuckets();
  let overdue = 0;
  for (const r of rows) {
    if (r.invoice.customer !== customer) continue;
    ageing[r.bucket] += r.outstanding;
    if (r.bucket !== 'Current') overdue += r.outstanding;
  }
  return { ageing, overdue };
}

export function useLedger() {
  const invoices = useInvoices();
  const payments = usePayments();

  return useMemo(() => {
    const issued = invoices.filter((i) => i.status !== 'Draft' && i.status !== 'Cancelled');
    const entries = withRunningBalance(buildEntries(invoices, payments));
    const received = allocatePayments(invoices, payments);
    const ageingRows = issued.map((inv) => billForInvoice(inv, received)).filter(Boolean);

    const customers = [...new Set(entries.map((e) => e.customer))].sort();
    const register = customers.map((c) => {
      const es = entries.filter((e) => e.customer === c);
      const invoiced = es.reduce((s, e) => s + e.debit, 0);
      const receivedTotal = es.reduce((s, e) => s + e.credit, 0);
      const outstanding = invoiced - receivedTotal;
      const { ageing, overdue } = bucketsForCustomer(ageingRows, c);
      return {
        customer: c,
        invoiced,
        received: receivedTotal,
        outstanding: Math.max(0, outstanding),
        advance: Math.max(0, -outstanding),
        ageing,
        overdue,
      };
    });

    const totals = {
      invoiced: register.reduce((s, r) => s + r.invoiced, 0),
      received: register.reduce((s, r) => s + r.received, 0),
      outstanding: register.reduce((s, r) => s + r.outstanding, 0),
      overdue: register.reduce((s, r) => s + r.overdue, 0),
    };

    return { entries, register, ageingRows, totals, buckets: AGING_BUCKETS };
  }, [invoices, payments]);
}

export { AGING_BUCKETS };