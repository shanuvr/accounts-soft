import { useSyncExternalStore } from 'react';

const SEED = [
  { name: 'GST 18%', rate: 18, type: 'CGST + SGST' },
  { name: 'GST 12%', rate: 12, type: 'CGST + SGST' },
  { name: 'GST 5%', rate: 5, type: 'CGST + SGST' },
  { name: 'IGST 18%', rate: 18, type: 'IGST' },
  { name: 'IGST 12%', rate: 12, type: 'IGST' },
  { name: 'Tax Exempt', rate: 0, type: 'Exempt' },
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

export function useTaxMaster() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAllTaxes() {
  return records;
}

export function addTax(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  if (records.some((r) => r.name.toLowerCase() === name.toLowerCase())) return { ok: false, reason: 'duplicate' };
  const record = {
    name,
    rate: Math.max(0, Number(data.rate) || 0),
    type: data.type || 'Other',
  };
  records = [...records, record];
  emit();
  return { ok: true, record };
}

export function updateTax(name, patch) {
  const existing = records.find((r) => r.name === name);
  if (!existing) return { ok: false, reason: 'notfound' };
  const rate = patch.rate !== undefined ? Math.max(0, Number(patch.rate) || 0) : existing.rate;
  const next = {
    ...existing,
    rate,
    type: (patch.type !== undefined ? patch.type : existing.type) || 'Other',
  };
  records = records.map((r) => (r.name === name ? next : r));
  emit();
  return { ok: true, record: next };
}

export function deleteTax(name) {
  records = records.filter((r) => r.name !== name);
  emit();
}