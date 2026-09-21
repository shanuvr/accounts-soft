import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getPaymentTerms,
  mapRecord: (r) => ({
    id: r.id,
    name: r.name,
    description: r.description || '',
    daysDue: r.days_due,
  }),
});

export function usePaymentTerms() {
  return store.useItems();
}

export function getAllPaymentTerms() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addPaymentTerm(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  return store.run(() => api.createPaymentTerm({ name, description: data.description || '' }));
}

export async function updatePaymentTerm(name, patch) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updatePaymentTerm(id, patch));
}

export async function deletePaymentTerm(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deletePaymentTerm(id));
}