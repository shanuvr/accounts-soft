import { createApiStore } from './createApiStore';
import * as api from '../api/data';
import { resolveOrderServiceId } from './orderServiceIndex';

const todayISO = () => new Date().toISOString().slice(0, 10);

function mapRecord(r) {
  return {
    id: r.id,
    orderServiceId: r.order_service,
    orderId: r.order_id || '',
    customer: r.customer_name || '',
    serviceName: r.service_name || '',
    expectedDeliveryDate: (r.scheduled_date || '').slice(0, 10),
    status: r.status || 'Pending',
    actualDeliveryDate: r.actual_date ? String(r.actual_date).slice(0, 10) : null,
    deliveredBy: '',
    deliveredOn: r.actual_date ? String(r.actual_date).slice(0, 10) : null,
    customerConfirmation: r.status === 'Delivered' ? 'Confirmed' : 'Pending',
    trackingNumber: r.tracking_number || '',
    notes: r.notes || '',
  };
}

const store = createApiStore({
  fetchList: api.getDeliveries,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function useDeliveries() {
  return store.useItems();
}

export function getDeliveryById(id) {
  return store.all().find((r) => String(r.id) === String(id));
}

export function getDeliveryFor(orderId, serviceName) {
  return store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
}

export function deleteDeliveryFor(orderId, serviceName) {
  const rec = getDeliveryFor(orderId, serviceName);
  if (!rec) return null;
  return store.run(() => api.deleteDelivery(rec.id));
}

export async function createOrSyncDelivery({ orderId, serviceName, expectedDeliveryDate }) {
  const existing = getDeliveryFor(orderId, serviceName);
  if (existing) {
    if (expectedDeliveryDate && expectedDeliveryDate !== existing.expectedDeliveryDate) {
      return store.run(() => api.updateDelivery(existing.id, { scheduled_date: expectedDeliveryDate }));
    }
    return existing;
  }
  const orderServiceId = await resolveOrderServiceId(orderId, serviceName);
  if (!orderServiceId) return { ok: false, reason: 'notfound' };
  return store.run(() =>
    api.createDelivery({
      order_service: orderServiceId,
      scheduled_date: expectedDeliveryDate || todayISO(),
      status: 'Pending',
      notes: '',
    })
  );
}

export async function markDelivered(id, { actualDeliveryDate, deliveredOn, notes }) {
  const rec = getDeliveryById(id);
  if (!rec) return null;
  return store.run(() =>
    api.updateDelivery(Number(id), {
      actual_date: actualDeliveryDate || deliveredOn || rec.expectedDeliveryDate || todayISO(),
      status: 'Delivered',
      notes: notes ?? rec.notes ?? '',
    })
  );
}

export async function updateDelivery(id, patch) {
  const payload = {};
  if (patch.expectedDeliveryDate !== undefined) payload.scheduled_date = patch.expectedDeliveryDate || null;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.notes !== undefined) payload.notes = patch.notes || '';
  if (patch.actualDeliveryDate !== undefined) payload.actual_date = patch.actualDeliveryDate || null;
  return store.run(() => api.updateDelivery(Number(id), payload));
}