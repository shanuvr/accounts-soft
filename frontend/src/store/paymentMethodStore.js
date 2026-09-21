import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getPaymentMethods,
  mapRecord: (r) => r.name,
});

export function usePaymentMethods() {
  return store.useItems();
}

export function getAllPaymentMethods() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addPaymentMethod(name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  return store.run(() => api.createPaymentMethod({ name: n }));
}

export async function updatePaymentMethod(oldName, name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  const id = store.findId(byName(oldName));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updatePaymentMethod(id, { name: n }));
}

export async function deletePaymentMethod(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deletePaymentMethod(id));
}