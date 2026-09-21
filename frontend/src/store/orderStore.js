import { useSyncExternalStore } from 'react';
import { ORDERS as SEED } from '../data/mockData';

let records = SEED.map((o) => ({ ...o }));
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

export function useOrders() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getOrderById(orderId) {
  return records.find((o) => o.orderId === orderId);
}

function nextOrderId() {
  const maxNum = records.reduce((m, o) => {
    const n = parseInt((o.orderId || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `ORD-${maxNum + 1}`;
}

export function addOrder({ customer, value, orderDate, deliveryDate, orderStatus, paymentStatus, salesPerson }) {
  const order = {
    orderId: nextOrderId(),
    customer,
    value: Number(value) || 0,
    orderDate,
    deliveryDate,
    orderStatus,
    paymentStatus,
    salesPerson,
  };
  records = [...records, order];
  emit();
  return order;
}