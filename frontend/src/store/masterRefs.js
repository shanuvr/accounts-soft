import { getMastersAll } from '../api/data';

let methods = null;
let statuses = null;
let loadingMethods = null;
let loadingStatuses = null;

export async function loadMethods() {
  if (methods) return methods;
  if (!loadingMethods) {
    loadingMethods = (async () => {
      const rows = await getMastersAll('paymentMethods').catch(() => []);
      methods = new Map(rows.map((m) => [m.name, m.id]));
    })();
  }
  await loadingMethods;
  return methods;
}

export async function loadStatuses() {
  if (statuses) return statuses;
  if (!loadingStatuses) {
    loadingStatuses = (async () => {
      const rows = await getMastersAll('paymentStatuses').catch(() => []);
      statuses = new Map(rows.map((s) => [s.name, s.id]));
    })();
  }
  await loadingStatuses;
  return statuses;
}

export async function resolveMethodId(name) {
  const map = await loadMethods();
  if (map.has(name)) return map.get(name);
  return null;
}

export async function resolveStatusId(name) {
  const map = await loadStatuses();
  if (map.has(name)) return map.get(name);
  return null;
}

const STATUS_TO_BACKEND = {
  Received: 'Paid',
  Pending: 'Unpaid',
  Failed: 'Overdue',
  Refunded: 'Refunded',
};

const STATUS_FROM_BACKEND = {
  Paid: 'Received',
  'Partially Paid': 'Received',
  Unpaid: 'Pending',
  Overdue: 'Pending',
  'Partially Refunded': 'Refunded',
  Refunded: 'Refunded',
};

export function paymentStatusToName(status) {
  return STATUS_TO_BACKEND[status] ?? status ?? 'Unpaid';
}

export function paymentStatusFromName(name) {
  return STATUS_FROM_BACKEND[name] ?? name ?? 'Pending';
}