import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getEmployees,
  mapRecord: (r) => ({
    id: r.id,
    name: r.name,
    department: r.department || '',
  }),
});

export function useEmployees() {
  return store.useItems();
}

export function getAllEmployees() {
  return store.all();
}

export function getEmployeeByName(name) {
  return store.all().find((r) => r.name === name);
}

const byName = (name) => (r) => r.name === name;

export async function addEmployee(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  return store.run(() => api.createEmployee({ name, department_name: data.department?.trim() || '' }));
}

export async function updateEmployee(name, patch) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  const payload = {};
  if (patch.department !== undefined) payload.department_name = patch.department;
  return store.run(() => api.updateEmployee(id, payload));
}

export async function deleteEmployee(name) {
  const id = store.findId(byName(name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteEmployee(id));
}