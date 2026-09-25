import { createApiStore } from './createApiStore';
import * as api from '../api/data';
import { getOrderById, getAllOrders, ensureLocalOrder } from './orderStore';
import { resolveMethodId, resolveStatusId, paymentStatusFromName, paymentStatusToName } from './masterRefs';

function mapRecord(r) {
  return {
    paymentId: r.id,
    orderId: r.order_id || '',
    customer: r.customer_name || '',
    amount: Number(r.amount) || 0,
    date: (r.date || '').slice(0, 10),
    method: r.method_name || '',
    reference: r.reference || '',
    receivedBy: r.received_by || '',
    notes: r.notes || '',
    status: paymentStatusFromName(r.status_name),
    planStage: r.plan_stage || null,
    invoiceId: r.invoice_id || null,
  };
}

const store = createApiStore({
  fetchList: api.getPayments,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function usePayments() {
  return store.useItems();
}

export function getAllPayments() {
  return store.all();
}

export function getPaymentById(id) {
  return store.all().find((r) => String(r.paymentId) === String(id));
}

export function getPaymentsFor(orderId) {
  return store
    .all()
    .filter((r) => r.orderId === orderId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getOrderPaymentSummary(orderId) {
  const orderValue = getOrderById(orderId)?.value ?? 0;
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
  const orders = getAllOrders();
  let totalValue = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let totalOverpaid = 0;
  for (const o of orders) {
    const s = getOrderPaymentSummary(o.orderId);
    totalValue += s.orderValue;
    totalReceived += s.received;
    totalPending += s.pending;
    totalOverpaid += s.overpaid;
  }
  return { totalValue, totalReceived, totalPending, totalOverpaid, transactionCount: store.all().length, orderCount: orders.length };
}

export async function createPayment({ orderId, amount, date, method, reference = '', receivedBy = '', notes = '', status = 'Received', planStage = null, invoiceId = null }) {
  const orderPk = await ensureLocalOrder(orderId);
  if (!orderPk) return null;
  const methodId = await resolveMethodId(method);
  const statusId = await resolveStatusId(paymentStatusToName(status));
  const payload = {
    order: orderPk,
    amount: Math.max(0, Number(amount) || 0),
    date,
    method: methodId,
    status: statusId,
    reference: reference || '',
    received_by: receivedBy || '',
    notes: notes || '',
    invoice_id: invoiceId || '',
    plan_stage: planStage || '',
  };
  return store.run(() => api.createPayment(payload));
}

export async function updatePayment(id, patch) {
  const pk = Number(id);
  const payload = {
    ...(patch.amount !== undefined ? { amount: Math.max(0, Number(patch.amount) || 0) } : {}),
    ...(patch.date !== undefined ? { date: patch.date } : {}),
    ...(patch.method !== undefined ? { method: await resolveMethodId(patch.method) } : {}),
    ...(patch.reference !== undefined ? { reference: patch.reference || '' } : {}),
    ...(patch.receivedBy !== undefined ? { received_by: patch.receivedBy || '' } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes || '' } : {}),
    ...(patch.status !== undefined ? { status: await resolveStatusId(paymentStatusToName(patch.status)) } : {}),
  };
  return store.run(() => api.updatePayment(pk, payload));
}