import { useSyncExternalStore } from 'react';

const SEED = ['Operations', 'Development', 'Design', 'Support', 'Accounts', 'Sales', 'Administration'];

let records = [...SEED];
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return records;
}

export function useDepartments() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAllDepartments() {
  return records;
}

export function addDepartment(name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  if (records.some((r) => r.toLowerCase() === n.toLowerCase())) return { ok: false, reason: 'duplicate' };
  records = [...records, n];
  emit();
  return { ok: true, record: n };
}

export function updateDepartment(oldName, name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  if (records.some((r) => r.toLowerCase() === n.toLowerCase())) return { ok: false, reason: 'duplicate' };
  records = records.map((r) => (r === oldName ? n : r));
  emit();
  return { ok: true, record: n };
}

export function deleteDepartment(name) {
  records = records.filter((r) => r !== name);
  emit();
}