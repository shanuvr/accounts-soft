import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getTaxes,
  mapRecord: (r) => ({
    id: r.id,
    name: r.name,
    rate: Number(r.rate),
    type: r.type || 'Other',
  }),
});

export function useTaxMaster() {
  return store.useItems();
}

export function getAllTaxes() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addTax(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  const payload = {
    name,
    rate: Math.max(0, Number(data.rate) || 0),
    type: data.type || 'Other',
  };
  return store.run(() => api.createTax(payload));
}

export async function updateTax(name, patch) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  const existing = store.all().find(byName(name));
  const payload = {
    rate: patch.rate !== undefined ? Number(patch.rate) : existing?.rate,
    type: patch.type !== undefined ? patch.type : existing?.type || 'Other',
  };
  return store.run(() => api.updateTax(id, payload));
}

export async function deleteTax(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteTax(id));
}