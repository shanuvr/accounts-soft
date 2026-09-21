import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getDeliveryTypes,
  mapRecord: (r) => ({
    id: r.id,
    name: r.name,
    description: r.description || '',
  }),
});

export function useDeliveryTypes() {
  return store.useItems();
}

export function getAllDeliveryTypes() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addDeliveryType(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  return store.run(() => api.createDeliveryType({ name, description: data.description || '' }));
}

export async function updateDeliveryType(name, patch) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updateDeliveryType(id, patch));
}

export async function deleteDeliveryType(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteDeliveryType(id));
}