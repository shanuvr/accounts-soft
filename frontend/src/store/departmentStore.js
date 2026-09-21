import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getDepartments,
  mapRecord: (r) => r.name,
});

export function useDepartments() {
  return store.useItems();
}

export function getAllDepartments() {
  return store.all();
}

const byName = (name) => (r) => r.name === name;

export async function addDepartment(name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  return store.run(() => api.createDepartment({ name: n, code: n.slice(0, 19).toUpperCase().replace(/\s+/g, '_') }));
}

export async function updateDepartment(oldName, name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  const id = store.findId(byName(oldName));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updateDepartment(id, { name: n }));
}

export async function deleteDepartment(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteDepartment(id));
}