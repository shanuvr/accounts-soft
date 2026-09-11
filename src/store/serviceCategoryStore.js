import { useSyncExternalStore } from 'react';

const SEED = ['Domain', 'Hosting', 'SSL', 'Development', 'Maintenance', 'QA', 'SEO / SMO', 'Design', 'Marketing'];

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

export function useServiceCategories() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAllServiceCategories() {
  return records;
}

export function addServiceCategory(name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  if (records.some((r) => r.toLowerCase() === n.toLowerCase())) return { ok: false, reason: 'duplicate' };
  records = [...records, n];
  emit();
  return { ok: true, record: n };
}

export function updateServiceCategory(oldName, name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  if (records.some((r) => r.toLowerCase() === n.toLowerCase())) return { ok: false, reason: 'duplicate' };
  records = records.map((r) => (r === oldName ? n : r));
  emit();
  return { ok: true, record: n };
}

export function deleteServiceCategory(name) {
  records = records.filter((r) => r !== name);
  emit();
}