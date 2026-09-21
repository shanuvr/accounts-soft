import { useSyncExternalStore } from 'react';

let records = {};
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

export function useOrderHours() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getOrderHours(orderId) {
  return records[orderId] ?? 0;
}

export function setOrderHours(orderId, hours) {
  const n = Math.max(0, Number(hours) || 0);
  if (records[orderId] === n) return;
  records = { ...records, [orderId]: n };
  emit();
}

export function getOrderHoursSummary(orderId, assignments) {
  const total = getOrderHours(orderId);
  const used = assignments
    .filter((a) => a.orderId === orderId)
    .reduce((sum, a) => sum + (Number(a.allocatedHours) || 0), 0);
  return { total, used, remaining: Math.max(0, total - used), overBudget: used > total && total > 0 };
}