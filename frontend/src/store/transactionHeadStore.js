import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const mapRecord = (r) => ({
  id: r.id,
  type: r.entry_type || 'Expense',
  name: r.name || '',
  companyId: r.company_id ?? null,
  sortOrder: Number(r.sort_order) || 0,
  isActive: r.is_active !== false,
});

const store = createApiStore({
  fetchList: api.getIncomeExpenseHeads,
  mapRecord,
});

export function useIncomeExpenseHeads() {
  return store.useItems();
}

export function useIncomeHeads() {
  return store.useItems().filter((h) => h.type === 'Income').map((h) => h.name);
}

export function useExpenseHeads() {
  return store.useItems().filter((h) => h.type === 'Expense').map((h) => h.name);
}

const byTypeAndName = (type, name) => (r) => (r.entry_type ?? r.type) === type && r.name === name;

export async function addHead({ type, name }) {
  const n = name?.trim();
  const t = type === 'Income' ? 'Income' : 'Expense';
  if (!n) return { ok: false, reason: 'name' };
  return store.run(() => api.createIncomeExpenseHead({ entry_type: t, name: n }));
}

export async function updateHead({ type, name }, nextName) {
  const n = nextName?.trim();
  if (!n) return { ok: false, reason: 'name' };
  const id = store.findId(byTypeAndName(type, name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.updateIncomeExpenseHead(id, { name: n }));
}

export async function deleteHead({ type, name }) {
  const id = store.findId(byTypeAndName(type, name));
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteIncomeExpenseHead(id));
}