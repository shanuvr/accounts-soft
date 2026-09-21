import { useSyncExternalStore } from 'react';

export const RENEWAL_TYPES = ['Domain', 'Hosting', 'Email', 'SMS', 'SSL', 'Other'];

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const SEED = [
  { type: 'Domain', name: 'abctech.com', customer: 'ABC Technologies Pvt Ltd', expiryDate: daysFromNow(21), amount: 1500 },
  { type: 'Hosting', name: 'abctech.com hosting', customer: 'ABC Technologies Pvt Ltd', expiryDate: daysFromNow(8), amount: 8000 },
  { type: 'SSL', name: 'SSL abctech.com', customer: 'ABC Technologies Pvt Ltd', expiryDate: daysFromNow(14), amount: 2500 },
  { type: 'Domain', name: 'blueskymedia.in', customer: 'BlueSky Media', expiryDate: daysFromNow(33), amount: 900 },
  { type: 'Email', name: 'Google Workspacc', customer: 'ABC Technologies Pvt Ltd', expiryDate: daysFromNow(120), amount: 3600 },
  { type: 'SMS', name: 'Bulk SMS pack (1800)', customer: 'Zenith Corp', expiryDate: daysFromNow(-4), amount: 1200 },
];

let records = SEED.map((r, i) => ({
  id: `RNW-${String(i + 1).padStart(3, '0')}`,
  ...r,
  notified: false,
  createdAt: new Date().toISOString().slice(0, 10),
}));
let counter = SEED.length + 1;
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

export function useRenewables() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAllRenewables() {
  return records;
}

export function addRenewable(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  if (!data?.expiryDate) return { ok: false, reason: 'expiry' };
  const record = {
    id: `RNW-${String(counter++).padStart(3, '0')}`,
    type: RENEWAL_TYPES.includes(data.type) ? data.type : 'Other',
    name,
    customer: data.customer?.trim() || '—',
    expiryDate: data.expiryDate,
    amount: Math.max(0, Number(data.amount) || 0),
    notified: Boolean(data.notified),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  records = [...records, record];
  emit();
  return { ok: true, record };
}

export function updateRenewable(id, patch) {
  const existing = records.find((r) => r.id === id);
  if (!existing) return { ok: false, reason: 'notfound' };
  const next = { ...existing, ...patch };
  records = records.map((r) => (r.id === id ? next : r));
  emit();
  return { ok: true, record: next };
}

export function markRenewableNotified(id) {
  const existing = records.find((r) => r.id === id);
  if (!existing) return null;
  records = records.map((r) => (r.id === id ? { ...r, notified: true, notifiedAt: new Date().toISOString().slice(0, 10) } : r));
  emit();
  return records.find((r) => r.id === id);
}

export function renewRenewable(id, data) {
  const existing = records.find((r) => r.id === id);
  if (!existing) return { ok: false, reason: 'notfound' };
  const expiryDate = data?.expiryDate;
  if (!expiryDate) return { ok: false, reason: 'expiry' };
  const next = {
    ...existing,
    expiryDate,
    amount: data.amount != null ? Math.max(0, Number(data.amount) || 0) : existing.amount,
    renewals: (existing.renewals || 0) + 1,
    lastRenewedAt: new Date().toISOString().slice(0, 10),
    notified: false,
    notifiedAt: undefined,
  };
  records = records.map((r) => (r.id === id ? next : r));
  emit();
  return { ok: true, record: next };
}

export function deleteRenewable(id) {
  records = records.filter((r) => r.id !== id);
  emit();
}

export function getRenewalStatus(record, todayISO = new Date().toISOString().slice(0, 10)) {
  const msLeft = new Date(record.expiryDate + 'T00:00:00') - new Date(todayISO + 'T00:00:00');
  const daysLeft = Math.ceil(msLeft / 86400000);
  if (daysLeft < 0) return { key: 'Overdue', daysLeft };
  if (daysLeft <= 30) return { key: 'Expiring Soon', daysLeft };
  return { key: 'Active', daysLeft };
}