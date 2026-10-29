import { createApiStore } from './createApiStore';
import * as api from '../api/data';

function parseAmount(val) {
  if (val == null) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function mapRecord(r) {
  const isExternal = !r.id && Boolean(r.order_value !== undefined || r.order_created_at !== undefined);
  const rawValue = r.final_amount ?? r.order_value ?? r.subtotal ?? 0;
  const value = parseAmount(rawValue);
  return {
    id: r.id ?? null,
    source: isExternal ? 'external' : 'local',
    orderId: r.order_id,
    customer: (isExternal ? r.company : r.customer) || r.customer || (typeof r.company === 'string' ? r.company : '') || '',
    value,
    orderDate: r.order_date || '',
    deliveryDate: r.delivery_date || '',
    createdAt: isExternal ? r.order_created_at || '' : r.created_at || '',
    orderStatus: isExternal ? 'Pending' : r.order_status || 'Pending',
    paymentStatus: isExternal ? 'Unpaid' : r.payment_status || 'Unpaid',
    salesPerson: r.sales_person || '',
    isBillable: r.is_billable !== false,
    projectHours: parseAmount(r.project_hours),
  };
}

async function fetchAllOrders() {
  const [local, external] = await Promise.allSettled([
    api.getLocalOrders(),
    api.getExternalOrders(),
  ]);
  const localOk = local.status === 'fulfilled';
  const externalOk = external.status === 'fulfilled';
  const batchOf = (r) => (r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : r.value?.results || []) : []);
  const localList = batchOf(local);
  const externalList = batchOf(external);

  const externalMap = new Map();
  for (const ext of externalList) {
    if (ext && ext.order_id) {
      externalMap.set(String(ext.order_id).trim().toLowerCase(), ext);
    }
  }

  const seen = new Set();
  const merged = [];

  for (const loc of localList) {
    if (!loc || !loc.order_id) continue;
    const key = String(loc.order_id).trim().toLowerCase();
    seen.add(key);
    const ext = externalMap.get(key);
    if (ext) {
      merged.push({
        ...loc,
        customer: loc.customer || ext.company || '',
        final_amount: parseAmount(loc.final_amount) || parseAmount(ext.order_value),
        sales_person: loc.sales_person || ext.sales_person || '',
      });
    } else {
      merged.push(loc);
    }
  }

  for (const ext of externalList) {
    if (!ext || !ext.order_id) continue;
    const key = String(ext.order_id).trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(ext);
    }
  }

  if (!localOk && !externalOk) {
    throw Object.assign(new Error('Could not fetch orders.'), { status: { failed: true } });
  }
  return { list: merged, status: { failed: false, local: localOk, external: externalOk } };
}

const store = createApiStore({
  fetchList: fetchAllOrders,
  mapRecord,
});

export function useOrders() {
  return store.useItems();
}

export function useOrdersLoaded() {
  return store.useIsLoaded();
}

export function useOrdersError() {
  return store.useLoadError();
}

export function useOrdersStatus() {
  return store.useStatus();
}

export function getAllOrders() {
  return store.all();
}

export function getOrderById(orderId) {
  if (!orderId) return null;
  const target = String(orderId).trim().toLowerCase();
  return store.all().find((o) => String(o.orderId || '').trim().toLowerCase() === target);
}

export async function addOrder({ customer, isBillable = true, value, orderDate, deliveryDate, orderStatus, paymentStatus }) {
  const billable = isBillable !== false;
  const payload = {
    customer,
    is_billable: billable,
    order_date: orderDate,
    delivery_date: deliveryDate,
    order_status: orderStatus || 'Pending',
    payment_status: billable ? (paymentStatus || 'Unpaid') : 'Not Applicable',
    subtotal: billable ? (Number(value) || 0) : 0,
    discount: 0,
    tax_amount: 0,
  };
  return store.run(() => api.createOrder(payload));
}

/** Returns a local DB pk for an order, lazily creating the local Order row for external (Lead Soft) orders. */
export async function ensureLocalOrder(orderId) {
  const order = getOrderById(orderId);
  if (!order) return null;
  if (order.id) return order.id;
  const payload = {
    order_id: order.orderId,
    customer: order.customer || '',
    order_date: order.orderDate || String(order.createdAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    delivery_date: order.deliveryDate || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    sales_person: order.salesPerson || '',
    is_billable: order.isBillable !== false,
    subtotal: order.value || 0,
    discount: 0,
    tax_amount: 0,
    project_hours: order.projectHours || 0,
  };
  const res = await store.run(() => api.createOrder(payload));
  return res.ok ? (res.record?.id ?? null) : null;
}

export async function updateOrderHours(orderId, hours) {
  const value = Math.max(0, Number(hours) || 0);
  store.applyLocal((recs) => recs.map((o) => (o.orderId === orderId ? { ...o, projectHours: value } : o)));
  const pk = await ensureLocalOrder(orderId);
  if (!pk) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updateOrder(pk, { project_hours: value }));
}