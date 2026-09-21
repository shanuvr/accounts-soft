import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getProducts,
  mapRecord: (r) => ({
    id: r.id,
    name: r.name,
    category: r.category || '',
    price: Number(r.default_price) || 0,
    hours: Number(r.default_hours) || 0,
    ptdRequired: Boolean(r.requires_ptda),
    template: r.ptda_template || '',
  }),
});

export function useServices() {
  return store.useItems();
}

export function getAllServices() {
  return store.all();
}

export function getServiceByName(name) {
  return store.all().find((r) => r.name === name);
}

const byName = (name) => (r) => r.name === name;

export async function addService(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  const ptdRequired = Boolean(data.ptdRequired);
  const payload = {
    name,
    category_name: data.category?.trim() || '',
    default_price: data.price !== undefined ? data.price : 0,
    default_hours: data.hours !== undefined ? data.hours : 0,
    requires_ptda: ptdRequired,
    ptda_template: ptdRequired ? data.template || 'generic' : '',
  };
  return store.run(() => api.createProduct(payload));
}

export async function updateService(name, patch) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  const existing = store.all().find(byName(name));
  const ptdRequired = patch.ptdRequired !== undefined ? Boolean(patch.ptdRequired) : existing?.ptdRequired;
  const template = patch.template !== undefined ? patch.template : existing?.template;
  const payload = {
    category_name: patch.category !== undefined ? patch.category : existing?.category || '',
    default_price: patch.price !== undefined ? patch.price : existing?.price,
    default_hours: patch.hours !== undefined ? patch.hours : existing?.hours,
    requires_ptda: ptdRequired,
    ptda_template: ptdRequired ? template || 'generic' : '',
  };
  return store.run(() => api.updateProduct(id, payload));
}

export async function deleteService(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteProduct(id));
}