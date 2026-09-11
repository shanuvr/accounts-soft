import { useSyncExternalStore } from 'react';

let records = [];
let counter = 1;
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

export function usePtds() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getPtdById(id) {
  return records.find((r) => r.id === id);
}

export function getPtdFor(orderId, serviceName) {
  return records.find((r) => r.orderId === orderId && r.serviceName === serviceName);
}

export function deletePtdFor(orderId, serviceName) {
  const next = records.filter((r) => !(r.orderId === orderId && r.serviceName === serviceName));
  if (next.length !== records.length) {
    records = next;
    emit();
  }
}

export function createOrUpdatePtd({ orderId, customer, serviceName, template, status, data, billable = true, price = 0 }) {
  const existing = records.find((r) => r.orderId === orderId && r.serviceName === serviceName);
  if (existing) {
    records = records.map((r) =>
      r.id === existing.id ? { ...r, status, data, billable, price, updatedAt: new Date().toISOString().slice(0, 10) } : r
    );
    emit();
    return records.find((r) => r.id === existing.id);
  }
  const id = `PTD-${String(counter++).padStart(3, '0')}`;
  const record = {
    id,
    orderId,
    customer,
    serviceName,
    template,
    status,
    data,
    billable,
    price,
    createdBy: 'Rahul Sharma',
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  records = [...records, record];
  emit();
  return record;
}