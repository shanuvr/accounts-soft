import { useSyncExternalStore } from 'react';
import { PAYMENTS, ORDERS } from '../data/mockData';

let records = PAYMENTS.map((p) => ({ ...p }));
let counter = records.reduce((m, r) => Math.max(m, Number(r.paymentId.replace('PAY-', '')) || 0), 0) + 1;
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return records;
}

export function usePayments() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getPaymentById(id) {
  return records.find((r) => r.paymentId === id);
}

export function getPaymentsFor(orderId) {
  return records
    .filter((r) => r.orderId === orderId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getOrderPaymentSummary(orderId) {
  const orderValue = ORDERS.find((o) => o.orderId === orderId)?.value ?? 0;
  const payments = getPaymentsFor(orderId);
  const received = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, orderValue - received);
  const overpaid = Math.max(0, received - orderValue);
  let status;
  if (received <= 0) status = 'Unpaid';
  else if (received < orderValue) status = 'Partially Paid';
  else if (received === orderValue) status = 'Paid';
  else status = 'Overpaid';
  return { orderValue, received, pending, overpaid, status, payments };
}

export function getGlobalSummary() {
  let totalValue = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let totalOverpaid = 0;
  for (const o of ORDERS) {
    const s = getOrderPaymentSummary(o.orderId);
    totalValue += s.orderValue;
    totalReceived += s.received;
    totalPending += s.pending;
    totalOverpaid += s.overpaid;
  }
  return { totalValue, totalReceived, totalPending, totalOverpaid, transactionCount: records.length, orderCount: ORDERS.length };
}

export function createPayment({ orderId, customer, amount, date, method, reference = '', receivedBy = '', notes = '', status = 'Received', planStage = null, invoiceId = null }) {
  const id = `PAY-${String(counter).padStart(3, '0')}`;
  counter += 1;
  const record = { paymentId: id, orderId, customer, amount: Number(amount), date, method, reference, receivedBy, notes, status, planStage, invoiceId };
  records = [...records, record];
  emit();
  return record;
}

export function updatePayment(id, patch) {
  records = records.map((r) =>
    r.paymentId === id ? { ...r, ...patch, amount: patch.amount !== undefined ? Number(patch.amount) : r.amount } : r
  );
  emit();
  return records.find((r) => r.paymentId === id);
}