import { createApiStore } from './createApiStore';
import * as api from '../api/data';
import { resolveOrderServiceId } from './orderServiceIndex';

function mapRecord(r) {
  return {
    id: r.id,
    orderServiceId: r.order_service,
    orderId: r.order_id || '',
    serviceName: r.service_name || '',
    customer: r.customer_name || '',
    template: r.template_name || 'generic',
    title: r.title || r.service_name || '',
    status: r.status || 'Pending',
    data: r.data || {},
    required: r.required,
    isSensitive: r.is_sensitive,
    billable: r.billable,
    price: Number(r.price) || 0,
    createdBy: '',
    createdAt: r.created_at || '',
    updatedAt: r.updated_at || '',
  };
}

const store = createApiStore({
  fetchList: api.getPtdas,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function usePtds() {
  return store.useItems();
}

export function getPtdById(id) {
  return store.all().find((r) => String(r.id) === String(id));
}

export function getPtdFor(orderId, serviceName) {
  return store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
}

export function deletePtdFor(orderId, serviceName) {
  const rec = getPtdFor(orderId, serviceName);
  if (!rec) return null;
  return store.run(() => api.deletePtda(rec.id));
}

export async function createOrUpdatePtd({ orderId, serviceName, template, status, data, billable = true, price = 0 }) {
  const existing = store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
  const tpl = template || 'generic';
  if (existing) {
    return store.run(() =>
      api.updatePtda(existing.id, {
        title: serviceName,
        data: data || {},
        status,
        billable,
        price: billable ? Math.max(0, Number(price) || 0) : 0,
        template_name: tpl,
      })
    );
  }
  const orderServiceId = await resolveOrderServiceId(orderId, serviceName);
  if (!orderServiceId) return { ok: false, reason: 'notfound' };
  return store.run(() =>
    api.createPtda({
      order_service: orderServiceId,
      title: serviceName,
      data: data || {},
      status,
      required: true,
      is_sensitive: false,
      billable,
      price: billable ? Math.max(0, Number(price) || 0) : 0,
      template_name: tpl,
    })
  );
}