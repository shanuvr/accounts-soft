import { createApiStore } from './createApiStore';
import * as api from '../api/data';

export const REPORT_TYPES = ['orders', 'ptda', 'assignments', 'deliveries', 'finance'];
export const REPORT_FORMATS = ['excel', 'csv', 'pdf'];

export const REPORT_TYPE_LABELS = {
  orders: 'Orders',
  ptda: 'PTDA',
  assignments: 'Assignments',
  deliveries: 'Deliveries',
  finance: 'Finance',
};

function toObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}

function mapRecord(r) {
  return {
    id: r.id,
    name: r.name || '',
    reportType: r.report_type || 'orders',
    filters: toObject(r.filters),
    columns: toArray(r.columns),
    format: r.format || 'pdf',
    isActive: r.is_active !== false,
    createdBy: r.created_by || '',
    createdAt: (r.created_at || '').slice(0, 10),
    updatedAt: (r.updated_at || '').slice(0, 10),
  };
}

const store = createApiStore({
  fetchList: api.getReportConfigs,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function useReports() {
  return store.useItems();
}

export function getAllReports() {
  return store.all();
}

export function addReport(data) {
  const name = data?.name?.trim();
  if (!name) return Promise.resolve({ ok: false, reason: 'name' });
  const payload = {
    name,
    report_type: REPORT_TYPES.includes(data.reportType) ? data.reportType : 'orders',
    filters: toObject(data.filters),
    columns: toArray(data.columns),
    format: REPORT_FORMATS.includes(data.format) ? data.format : 'pdf',
    is_active: data.isActive !== false,
    created_by: data.createdBy || '',
  };
  return store.run(() => api.createReportConfig(payload));
}

export async function updateReport(id, patch) {
  const payload = {
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.reportType !== undefined ? { report_type: patch.reportType } : {}),
    ...(patch.filters !== undefined ? { filters: toObject(patch.filters) } : {}),
    ...(patch.columns !== undefined ? { columns: toArray(patch.columns) } : {}),
    ...(patch.format !== undefined ? { format: patch.format } : {}),
    ...(patch.isActive !== undefined ? { is_active: patch.isActive } : {}),
    ...(patch.createdBy !== undefined ? { created_by: patch.createdBy } : {}),
  };
  return store.run(() => api.updateReportConfig(id, payload));
}

export async function deleteReport(id) {
  return store.run(() => api.deleteReportConfig(id));
}