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

export function useDeliveries() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getDeliveryById(id) {
  return records.find((r) => r.id === id);
}

export function getDeliveryFor(orderId, serviceName) {
  return records.find((r) => r.orderId === orderId && r.serviceName === serviceName);
}

export function deleteDeliveryFor(orderId, serviceName) {
  const next = records.filter((r) => !(r.orderId === orderId && r.serviceName === serviceName));
  if (next.length !== records.length) {
    records = next;
    emit();
  }
}

export function createOrSyncDelivery({ orderId, customer, serviceName, expectedDeliveryDate }) {
  const existing = records.find((r) => r.orderId === orderId && r.serviceName === serviceName);
  if (existing) {
    if (expectedDeliveryDate && expectedDeliveryDate !== existing.expectedDeliveryDate) {
      records = records.map((r) => (r.id === existing.id ? { ...r, expectedDeliveryDate } : r));
      emit();
    }
    return records.find((r) => r.id === existing.id);
  }
  const id = `DEL-${String(counter++).padStart(3, '0')}`;
  const record = {
    id,
    orderId,
    customer,
    serviceName,
    expectedDeliveryDate: expectedDeliveryDate ?? '',
    status: 'Pending',
    actualDeliveryDate: null,
    deliveredBy: null,
    deliveredOn: null,
    customerConfirmation: 'Pending',
    notes: '',
  };
  records = [...records, record];
  emit();
  return record;
}

export function markDelivered(id, { actualDeliveryDate, deliveredBy, deliveredOn, customerConfirmation, notes }) {
  records = records.map((r) =>
    r.id === id
      ? {
          ...r,
          status: 'Delivered',
          actualDeliveryDate,
          deliveredBy,
          deliveredOn,
          customerConfirmation,
          notes: notes ?? r.notes,
        }
      : r
  );
  emit();
}

export function updateDelivery(id, patch) {
  records = records.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
}