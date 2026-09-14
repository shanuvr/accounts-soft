import { useSyncExternalStore } from 'react';

const SEED = [
  {
    id: 'PTD-001',
    orderId: 'ORD-1024',
    customer: 'ABC Technologies Pvt Ltd',
    serviceName: 'Domain Registration',
    template: 'domain',
    status: 'Completed',
    data: {
      domainName: 'abctechnologies.in',
      extension: '.in',
      registrar: 'GoDaddy',
      registrationDate: '2026-09-05',
      expiryDate: '2027-09-05',
      autoRenewal: 'Yes',
      dnsProvider: 'Cloudflare',
      nameservers: 'ns1.cloudflare.com\nns2.cloudflare.com',
      technicalOwner: 'Rahul Sharma',
      notes: 'Primary domain for the corporate website.',
    },
    billable: true,
    price: 1500,
    createdBy: 'Rahul Sharma',
    updatedAt: '2026-09-10',
  },
  {
    id: 'PTD-002',
    orderId: 'ORD-1021',
    customer: 'Nova Systems',
    serviceName: 'Web Hosting',
    template: 'hosting',
    status: 'Draft',
    data: {
      hostingProvider: 'Bluehost',
      hostingPlan: 'Business Pro',
      serverName: 'nova-prod-01',
      ipAddress: '103.21.58.41',
      os: 'Linux',
      storage: '100 GB',
      bandwidth: 'Unlimited',
      startDate: '2026-08-25',
      expiryDate: '2027-08-25',
      technicalOwner: 'Amit Verma',
      notes: '',
    },
    billable: true,
    price: 8000,
    createdBy: 'Rahul Sharma',
    updatedAt: '2026-09-12',
  },
];

let records = SEED.map((r) => ({ ...r }));
let counter = 10;
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