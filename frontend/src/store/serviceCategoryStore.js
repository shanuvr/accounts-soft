import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getProductCategories,
  mapRecord: (r) => r.name,
});

export function useServiceCategories() {
  return store.useItems();
}

export function getAllServiceCategories() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addServiceCategory(name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  return store.run(() => api.createProductCategory({ name: n }));
}

export async function updateServiceCategory(oldName, name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  const id = store.findId(byName(oldName));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updateProductCategory(id, { name: n }));
}

export async function deleteServiceCategory(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteProductCategory(id));
}