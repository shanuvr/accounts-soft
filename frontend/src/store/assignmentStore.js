import { createApiStore } from './createApiStore';
import * as api from '../api/data';
import { resolveOrderServiceId } from './orderServiceIndex';

export const ASSIGNMENT_STATUSES = ['Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

const PRIORITY_WRITE = { Low: 'Low', Normal: 'Medium', High: 'High', Urgent: 'Critical' };
const PRIORITY_READ = { Low: 'Low', Medium: 'Normal', High: 'High', Critical: 'Urgent' };

function mapRecord(r) {
  const startDate = (r.start_date || '').slice(0, 10);
  return {
    id: r.id,
    orderServiceId: r.order_service,
    orderId: r.order_id || '',
    customer: r.customer_name || '',
    serviceName: r.service_name || '',
    assignedTo: r.employee || '',
    assignedTeam: r.department || '',
    assignedBy: '',
    assignedOn: startDate || (r.created_at || '').slice(0, 10),
    expectedDelivery: (r.due_date || '').slice(0, 10),
    priority: PRIORITY_READ[r.priority] ?? r.priority ?? 'Normal',
    instructions: r.description || '',
    status: r.status || 'Pending',
    estimatedHours: 0,
    allocatedHours: Number(r.allocated_hours) || 0,
    progress: Number(r.progress) || 0,
    activity: [],
    createdAt: r.created_at || '',
    updatedAt: r.updated_at || '',
  };
}

const store = createApiStore({
  fetchList: api.getAssignments,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function useAssignments() {
  return store.useItems();
}

export function getAssignmentById(id) {
  return store.all().find((r) => String(r.id) === String(id));
}

export function getAssignmentFor(orderId, serviceName) {
  return store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
}

export function deleteAssignmentFor(orderId, serviceName) {
  const rec = getAssignmentFor(orderId, serviceName);
  if (!rec) return null;
  return store.run(() => api.deleteAssignment(rec.id));
}

export async function createAssignment({ orderId, serviceName, assignedTo, assignedTeam, assignedOn, expectedDelivery, priority, instructions, status = 'Assigned', allocatedHours }) {
  const orderServiceId = await resolveOrderServiceId(orderId, serviceName);
  if (!orderServiceId) return { ok: false, reason: 'notfound' };
  const existing = store.all().find((r) => r.orderId === orderId && r.serviceName === serviceName);
  if (existing) {
    const changes = {};
    if (assignedTo !== undefined) changes.employee = assignedTo;
    if (assignedTeam !== undefined) changes.department = assignedTeam;
    if (assignedOn !== undefined) changes.start_date = assignedOn || null;
    if (expectedDelivery !== undefined) changes.due_date = expectedDelivery || null;
    if (priority !== undefined) changes.priority = PRIORITY_WRITE[priority] ?? priority ?? 'Medium';
    if (status !== undefined) changes.status = status;
    if (instructions !== undefined) changes.description = instructions || '';
    if (allocatedHours !== undefined) changes.allocated_hours = Math.max(0, Number(allocatedHours) || 0);
    return store.run(() => api.updateAssignment(existing.id, changes));
  }
  return store.run(() =>
    api.createAssignment({
      order_service: orderServiceId,
      employee: assignedTo || '',
      department: assignedTeam || '',
      title: serviceName,
      description: instructions || '',
      priority: PRIORITY_WRITE[priority] ?? priority ?? 'Medium',
      status,
      start_date: assignedOn || null,
      due_date: expectedDelivery || null,
      allocated_hours: Math.max(0, Number(allocatedHours) || 0),
    })
  );
}

export function reassignAssignment(id, { assignedTo, assignedTeam }) {
  const rec = getAssignmentById(id);
  if (!rec) return null;
  return store.run(() =>
    api.updateAssignment(Number(id), {
      employee: assignedTo,
      department: assignedTeam,
      status: 'Assigned',
    })
  );
}