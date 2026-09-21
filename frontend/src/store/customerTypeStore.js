import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getCustomerTypes,
  mapRecord: (r) => ({
    id: r.id,
    name: r.name,
    description: r.description || '',
  }),
});

export function useCustomerTypes() {
  return store.useItems();
}

export function getAllCustomerTypes() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addCustomerType(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  return store.run(() => api.createCustomerType({ name, description: data.description || '' }));
}

export async function updateCustomerType(name, patch) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updateCustomerType(id, patch));
}

export async function deleteCustomerType(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteCustomerType(id));
}