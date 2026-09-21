import { useSyncExternalStore } from 'react';

const SEED = [
  { name: 'Rahul Sharma', department: 'Operations' },
  { name: 'Sneha Patil', department: 'Operations' },
  { name: 'Amit Verma', department: 'Development' },
  { name: 'Rohit Gupta', department: 'Development' },
  { name: 'Priya Nair', department: 'Accounts' },
  { name: 'Karan Malhotra', department: 'Sales' },
  { name: 'Anita Desai', department: 'Sales' },
];

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

export function useEmployees() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAllEmployees() {
  return records;
}

export function getEmployeeByName(name) {
  return records.find((r) => r.name === name);
}

export function addEmployee(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  if (records.some((r) => r.name.toLowerCase() === name.toLowerCase())) return { ok: false, reason: 'duplicate' };
  const record = {
    name,
    department: data.department?.trim() || 'General',
  };
  records = [...records, record];
  emit();
  return { ok: true, record };
}

export function updateEmployee(name, patch) {
  const existing = records.find((r) => r.name === name);
  if (!existing) return { ok: false, reason: 'notfound' };
  const next = {
    ...existing,
    department: (patch.department !== undefined ? patch.department : existing.department)?.trim() || existing.department,
  };
  records = records.map((r) => (r.name === name ? next : r));
  emit();
  return { ok: true, record: next };
}

export function deleteEmployee(name) {
  records = records.filter((r) => r.name !== name);
  emit();
}