import { createApiStore } from './createApiStore';
import * as api from '../api/data';

function mapRecord(r) {
  const isExternal = Object.prototype.hasOwnProperty.call(r, 'company');
  const rawValue = isExternal ? r.order_value : (r.final_amount ?? r.subtotal ?? 0);
  const value = Number(rawValue);
  return {
    orderId: r.order_id,
    customer: r.company || r.customer || '',
    value: Number.isFinite(value) ? value : 0,
    orderDate: r.order_date || '',
    deliveryDate: r.delivery_date || '',
    createdAt: isExternal ? r.order_created_at || '' : r.created_at || '',
    orderStatus: isExternal ? 'Pending' : r.order_status || 'Pending',
    paymentStatus: isExternal ? 'Unpaid' : r.payment_status || 'Unpaid',
    salesPerson: r.sales_person || '',
  };
}

async function fetchAllOrders() {
  const safe = (p) => Promise.resolve(p).catch(() => []);
  const [local, external] = await Promise.all([
    safe(api.getLocalOrders()),
    safe(api.getExternalOrders()),
  ]);
  const seen = new Set();
  const merged = [];
  for (const batch of [local, external]) {
    for (const r of batch) {
      if (!r || seen.has(r.order_id)) continue;
      seen.add(r.order_id);
      merged.push(r);
    }
  }
  return merged;
}

const store = createApiStore({
  fetchList: fetchAllOrders,
  mapRecord,
});

export function useOrders() {
  return store.useItems();
}

export function getAllOrders() {
  return store.all();
}

export function getOrderById(orderId) {
  return store.all().find((o) => o.orderId === orderId);
}

function nextOrderId() {
  const maxNum = store.all().reduce((m, o) => {
    const n = parseInt((o.orderId || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `ORD-${maxNum + 1}`;
}

export async function addOrder({ customer, value, orderDate, deliveryDate, orderStatus, paymentStatus, salesPerson }) {
  const payload = {
    order_id: nextOrderId(),
    customer,
    order_date: orderDate,
    delivery_date: deliveryDate,
    order_status: orderStatus || 'Pending',
    payment_status: paymentStatus || 'Unpaid',
    sales_person: salesPerson,
    subtotal: Number(value) || 0,
    discount: 0,
    tax_amount: 0,
  };
  return store.run(() => api.createOrder(payload));
}