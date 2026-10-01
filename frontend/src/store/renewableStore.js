import { createApiStore } from './createApiStore';
import * as api from '../api/data';

export const RENEWAL_TYPES = ['Domain', 'Hosting', 'Email', 'SMS', 'SSL', 'Other'];

function mapRecord(r) {
  return {
    id: r.id,
    type: r.type || 'Other',
    name: r.name || '',
    customer: r.customer || '—',
    expiryDate: (r.expiry_date || '').slice(0, 10),
    amount: Number(r.amount) || 0,
    notified: Boolean(r.notified),
    notifiedAt: (r.notified_at || '').slice(0, 10) || null,
    renewals: Number(r.renewals) || 0,
    lastRenewedAt: (r.last_renewed_at || '').slice(0, 10) || null,
    createdAt: (r.created_at || '').slice(0, 10),
  };
}

const store = createApiStore({
  fetchList: api.getRenewals,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function useRenewables() {
  return store.useItems();
}

export function getAllRenewables() {
  return store.all();
}

export function addRenewable(data) {
  const name = data?.name?.trim();
  if (!name) return Promise.resolve({ ok: false, reason: 'name' });
  if (!data?.expiryDate) return Promise.resolve({ ok: false, reason: 'expiry' });
  const payload = {
    type: RENEWAL_TYPES.includes(data.type) ? data.type : 'Other',
    name,
    customer: data.customer?.trim() || '—',
    expiry_date: data.expiryDate,
    amount: Math.max(0, Number(data.amount) || 0),
    notified: Boolean(data.notified),
  };
  return store.run(() => api.createRenewal(payload));
}

export async function updateRenewable(id, patch) {
  const payload = {
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.customer !== undefined ? { customer: patch.customer?.trim() || '—' } : {}),
    ...(patch.expiryDate !== undefined ? { expiry_date: patch.expiryDate } : {}),
    ...(patch.amount !== undefined ? { amount: Math.max(0, Number(patch.amount) || 0) } : {}),
  };
  return store.run(() => api.updateRenewal(id, payload));
}

export async function markRenewableNotified(id) {
  const payload = {
    notified: true,
    notified_at: new Date().toISOString().slice(0, 10),
  };
  return store.run(() => api.updateRenewal(id, payload));
}

export async function renewRenewable(id, data) {
  const existing = store.all().find((r) => String(r.id) === String(id));
  if (!data?.expiryDate) return { ok: false, reason: 'expiry' };
  const payload = {
    expiry_date: data.expiryDate,
    amount: data.amount != null ? Math.max(0, Number(data.amount) || 0) : existing?.amount ?? 0,
    renewals: (existing?.renewals || 0) + 1,
    last_renewed_at: new Date().toISOString().slice(0, 10),
    notified: false,
    notified_at: null,
  };
  return store.run(() => api.updateRenewal(id, payload));
}

export async function deleteRenewable(id) {
  return store.run(() => api.deleteRenewal(id));
}

export function getRenewalStatus(record, todayISO = new Date().toISOString().slice(0, 10)) {
  const msLeft = new Date(record.expiryDate + 'T00:00:00') - new Date(todayISO + 'T00:00:00');
  const daysLeft = Math.ceil(msLeft / 86400000);
  if (daysLeft < 0) return { key: 'Overdue', daysLeft };
  if (daysLeft <= 30) return { key: 'Expiring Soon', daysLeft };
  return { key: 'Active', daysLeft };
}