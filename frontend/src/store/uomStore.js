import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getUoms,
  mapRecord: (r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
  }),
});

export function useUoms() {
  return store.useItems();
}

export function getAllUoms() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addUom(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  return store.run(() => api.createUom({ name, code: data.code?.trim() || name.slice(0, 9).toUpperCase() }));
}

export async function updateUom(name, patch) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updateUom(id, patch));
}

export async function deleteUom(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteUom(id));
}