import { useSyncExternalStore } from 'react';

const SEED = [
  { name: 'Domain Registration', category: 'Domain', price: 1500, hours: 2, ptdRequired: true, template: 'domain' },
  { name: 'Web Hosting', category: 'Hosting', price: 8000, hours: 4, ptdRequired: true, template: 'hosting' },
  { name: 'SSL Certificate', category: 'SSL', price: 2500, hours: 1.5, ptdRequired: true, template: 'ssl' },
  { name: 'Website Development', category: 'Development', price: 110000, hours: 80, ptdRequired: true, template: 'website' },
  { name: 'Maintenance', category: 'Maintenance', price: 3500, hours: 10, ptdRequired: false, template: 'maintenance' },
  { name: 'Server', category: 'Hosting', price: 25000, hours: 6, ptdRequired: true, template: 'hosting' },
  { name: 'Email', category: 'Hosting', price: 2000, hours: 2, ptdRequired: true, template: 'generic' },
  { name: 'Static Web Design', category: 'Development', price: 45000, hours: 40, ptdRequired: true, template: 'website' },
  { name: 'Dynamic Website', category: 'Development', price: 95000, hours: 70, ptdRequired: true, template: 'website' },
  { name: 'Cloud Application', category: 'Development', price: 180000, hours: 120, ptdRequired: true, template: 'website' },
  { name: 'Quality Checking', category: 'QA', price: 8000, hours: 8, ptdRequired: true, template: 'generic' },
  { name: 'SEO', category: 'SEO / SMO', price: 20000, hours: 30, ptdRequired: true, template: 'generic' },
  { name: 'SMO - Instagram', category: 'SEO / SMO', price: 15000, hours: 20, ptdRequired: true, template: 'generic' },
  { name: 'SMO - Facebook', category: 'SEO / SMO', price: 15000, hours: 20, ptdRequired: true, template: 'generic' },
  { name: 'Google GMB Optimization', category: 'SEO / SMO', price: 12000, hours: 15, ptdRequired: true, template: 'generic' },
  { name: 'AI Video', category: 'Design', price: 25000, hours: 25, ptdRequired: true, template: 'generic' },
  { name: 'Graphics Designing', category: 'Design', price: 12000, hours: 15, ptdRequired: true, template: 'generic' },
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

export function useServices() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAllServices() {
  return records;
}

export function getServiceByName(name) {
  return records.find((r) => r.name === name);
}

export function addService(data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  if (records.some((r) => r.name.toLowerCase() === name.toLowerCase())) return { ok: false, reason: 'duplicate' };
  const record = {
    name,
    category: data.category?.trim() || 'General',
    price: Math.max(0, Number(data.price) || 0),
    hours: Math.max(0, Number(data.hours) || 0),
    ptdRequired: Boolean(data.ptdRequired),
    template: data.ptdRequired ? data.template || 'generic' : '',
  };
  records = [...records, record];
  emit();
  return { ok: true, record };
}

export function updateService(name, patch) {
  const existing = records.find((r) => r.name === name);
  if (!existing) return { ok: false, reason: 'notfound' };
  const ptdRequired = patch.ptdRequired !== undefined ? Boolean(patch.ptdRequired) : existing.ptdRequired;
  const template = patch.template !== undefined ? patch.template : existing.template;
  const next = {
    ...existing,
    category: (patch.category !== undefined ? patch.category : existing.category)?.trim() || 'General',
    price: patch.price !== undefined ? Math.max(0, Number(patch.price) || 0) : existing.price,
    hours: patch.hours !== undefined ? Math.max(0, Number(patch.hours) || 0) : existing.hours,
    ptdRequired,
    template: ptdRequired ? template || 'generic' : '',
  };
  records = records.map((r) => (r.name === name ? next : r));
  emit();
  return { ok: true, record: next };
}

export function deleteService(name) {
  records = records.filter((r) => r.name !== name);
  emit();
}