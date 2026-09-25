import { createApiStore } from './createApiStore';
import * as api from '../api/data';
import { refreshOrderServiceIndex } from './orderServiceIndex';

function mapRecord(r) {
  return {
    id: r.id,
    orderId: r.order_id,
    productId: r.product ?? null,
    serviceName: r.service_name || '',
    description: r.description || '',
    quantity: Number(r.quantity) || 1,
    unitPrice: Number(r.unit_price) || 0,
    subtotal: Number(r.subtotal) || 0,
    requiresPtda: Boolean(r.requires_ptda),
    status: r.status || 'Pending',
    startDate: r.start_date || '',
    deliveryDate: r.delivery_date || '',
    createdAt: r.created_at || '',
  };
}

const store = createApiStore({
  fetchList: api.getOrderServices,
  mapRecord,
});

export function useOrderServices() {
  return store.useItems();
}

export function getAllOrderServices() {
  return store.all();
}

export function getOrderServicesFor(orderId) {
  return store.all().filter((s) => s.orderId === orderId);
}

export async function addOrderService({ serviceName, quantity = 1, unitPrice = 0, requiresPtda = false, deliveryDate = '', status = 'Not Started' }, orderPk) {
  if (!orderPk) return { ok: false, reason: 'notfound' };
  const qty = Math.max(0, Number(quantity) || 1);
  const price = Math.max(0, Number(unitPrice) || 0);
  const payload = {
    order: orderPk,
    service_name: serviceName,
    quantity: qty,
    unit_price: price,
    subtotal: qty * price,
    requires_ptda: Boolean(requiresPtda),
    status,
    delivery_date: deliveryDate || null,
  };
  const res = await store.run(() => api.createOrderService(payload));
  await refreshOrderServiceIndex();
  return res;
}

export async function updateOrderService(id, patch) {
  const payload = {
    ...(patch.quantity !== undefined ? { quantity: Math.max(0, Number(patch.quantity) || 1) } : {}),
    ...(patch.unitPrice !== undefined ? { unit_price: Math.max(0, Number(patch.unitPrice) || 0) } : {}),
    ...(patch.serviceName !== undefined ? { service_name: patch.serviceName } : {}),
    ...(patch.requiresPtda !== undefined ? { requires_ptda: Boolean(patch.requiresPtda) } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.deliveryDate !== undefined ? { delivery_date: patch.deliveryDate || null } : {}),
    ...(patch.description !== undefined ? { description: patch.description || '' } : {}),
  };
  const res = await store.run(() => api.updateOrderService(id, payload));
  await refreshOrderServiceIndex();
  return res;
}

export async function removeOrderService(id) {
  const res = await store.run(() => api.deleteOrderService(id));
  await refreshOrderServiceIndex();
  return res;
}