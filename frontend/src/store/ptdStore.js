import { createApiStore } from './createApiStore';
import * as api from '../api/ptda';

const store = createApiStore({
  fetchList: api.getPtds,
  mapRecord: (r) => ({
    id: r.id,
    orderId: r.order_id,
    customer: r.customer,
    serviceName: r.service_name,
    template: r.template || 'generic',
    status: r.status,
    data: r.data || {},
    billable: r.billable !== false,
    price: Number(r.price) || 0,
    required: Boolean(r.required),
    isSensitive: Boolean(r.is_sensitive),
    createdBy: '',
    createdAt: (r.created_at || '').slice(0, 10),
    updatedAt: (r.updated_at || '').slice(0, 10),
  }),
});

export function usePtds() {
  return store.useItems();
}

export function getAllPtds() {
  return store.all();
}

export function getPtdById(id) {
  return store.all().find((r) => String(r.id) === String(id));
}

export function getPtdFor(orderId, serviceName) {
  return store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
}

export async function deletePtdFor(orderId, serviceName) {
  const existing = store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
  if (!existing) return null;
  return store.run(() => api.deletePtd(existing.id));
}

export async function createOrUpdatePtd({ orderId, serviceName, template, status, data, billable = true, price = 0 }) {
  const payload = {
    order_id: orderId,
    service_name: serviceName,
    template: template || 'generic',
    title: `${serviceName} (${template || 'PTD'})`,
    data: data || {},
    status,
    billable: Boolean(billable),
    price: billable ? Math.max(0, Number(price) || 0) : 0,
  };
  const existing = store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
  const result = existing
    ? await store.run(() => api.updatePtd(existing.id, payload))
    : await store.run(() => api.createPtd(payload));
  if (!result.ok) return null;
  return store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName) ?? null;
}
