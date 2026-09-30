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
    deliveryType: r.delivery_type ?? null,
    deliveredBy: r.delivered_by || '',
    deliveredOn: r.actual_date ? String(r.actual_date).slice(0, 10) : null,
    customerConfirmation: r.customer_confirmation || (r.status === 'Delivered' ? 'Confirmed' : 'Pending'),
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

export async function markDelivered(id, { actualDeliveryDate, deliveredOn, deliveredBy, customerConfirmation, trackingNumber, notes }) {
  const rec = getDeliveryById(id);
  if (!rec) return null;
  return store.run(() =>
    api.updateDelivery(Number(id), {
      actual_date: actualDeliveryDate || deliveredOn || rec.expectedDeliveryDate || todayISO(),
      status: 'Delivered',
      delivered_by: deliveredBy ?? rec.deliveredBy ?? '',
      customer_confirmation: customerConfirmation ?? rec.customerConfirmation ?? 'Pending',
      tracking_number: trackingNumber ?? rec.trackingNumber ?? '',
      notes: notes ?? rec.notes ?? '',
    })
  );
}

export async function updateDelivery(id, patch) {
  const payload = {};
  if (patch.expectedDeliveryDate !== undefined) payload.scheduled_date = patch.expectedDeliveryDate || null;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.deliveryType !== undefined) payload.delivery_type = patch.deliveryType || null;
  if (patch.trackingNumber !== undefined) payload.tracking_number = patch.trackingNumber || '';
  if (patch.deliveredBy !== undefined) payload.delivered_by = patch.deliveredBy || '';
  if (patch.customerConfirmation !== undefined) payload.customer_confirmation = patch.customerConfirmation || 'Pending';
  if (patch.notes !== undefined) payload.notes = patch.notes || '';
  if (patch.actualDeliveryDate !== undefined) payload.actual_date = patch.actualDeliveryDate || null;
  return store.run(() => api.updateDelivery(Number(id), payload));
}