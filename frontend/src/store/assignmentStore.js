import { useSyncExternalStore } from 'react';

export const ASSIGNMENT_STATUSES = ['Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

let records = [];
let counter = 1;
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return records;
}

export function useAssignments() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAssignmentById(id) {
  return records.find((r) => r.id === id);
}

export function getAssignmentFor(orderId, serviceName) {
  return records.find((r) => r.orderId === orderId && r.serviceName === serviceName);
}

export function deleteAssignmentFor(orderId, serviceName) {
  const next = records.filter((r) => !(r.orderId === orderId && r.serviceName === serviceName));
  if (next.length !== records.length) {
    records = next;
    emit();
  }
}

function appendActivity(prev, changes, note, by) {
  const entries = [...(prev.activity ?? [])];
  const push = (text) => entries.push({ date: todayISO(), text });
  if (changes.assignedTo !== undefined && changes.assignedTo !== prev.assignedTo) push(`Reassigned to ${changes.assignedTo}`);
  if (changes.assignedTeam !== undefined && changes.assignedTeam !== prev.assignedTeam) push(`Assigned team changed to ${changes.assignedTeam}`);
  if (changes.status !== undefined && changes.status !== prev.status) push(`Status changed to ${changes.status}`);
  if (changes.expectedDelivery !== undefined && changes.expectedDelivery !== prev.expectedDelivery) push('Expected completion date updated');
  if (changes.priority !== undefined && changes.priority !== prev.priority) push(`Priority changed to ${changes.priority}`);
  if (changes.estimatedHours !== undefined && Number(changes.estimatedHours) !== Number(prev.estimatedHours)) push(`Estimated hours changed to ${changes.estimatedHours} hrs`);
  if (changes.allocatedHours !== undefined && Number(changes.allocatedHours) !== Number(prev.allocatedHours)) push(`Allocated hours changed to ${changes.allocatedHours} hrs`);
  if (changes.instructions !== undefined && changes.instructions !== prev.instructions) push('Instructions updated');
  if (note?.trim()) push(note.trim());
  if (by?.trim()) push(`Action by ${by.trim()}`);
  return entries;
}

export function createAssignment({ orderId, customer, serviceName, assignedTo, assignedTeam, assignedBy, assignedOn, expectedDelivery, priority, instructions, status = 'Assigned', estimatedHours, allocatedHours, note }) {
  const existing = records.find((r) => r.orderId === orderId && r.serviceName === serviceName);
  if (existing) {
    const changes = {
      ...(assignedTo !== undefined ? { assignedTo } : {}),
      ...(assignedTeam !== undefined ? { assignedTeam } : {}),
      ...(expectedDelivery !== undefined ? { expectedDelivery } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(instructions !== undefined ? { instructions } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(estimatedHours !== undefined ? { estimatedHours } : {}),
      ...(allocatedHours !== undefined ? { allocatedHours } : {}),
    };
    const activity = appendActivity(existing, changes, note);
    records = records.map((r) => (r.id === existing.id ? { ...r, ...changes, activity } : r));
    emit();
    return records.find((r) => r.id === existing.id);
  }
  const id = `ASN-${String(counter++).padStart(3, '0')}`;
  const record = {
    id,
    orderId,
    customer,
    serviceName,
    assignedTo,
    assignedTeam,
    assignedBy: assignedBy ?? '',
    assignedOn: assignedOn ?? todayISO(),
    expectedDelivery: expectedDelivery ?? '',
    priority: priority ?? 'Normal',
    instructions: instructions ?? '',
    status,
    estimatedHours: estimatedHours ?? 0,
    allocatedHours: allocatedHours ?? 0,
    activity: [{ date: assignedOn ?? todayISO(), text: `Assigned to ${assignedTo}` }],
    createdAt: todayISO(),
  };
  records = [...records, record];
  emit();
  return record;
}

export function reassignAssignment(id, { assignedTo, assignedTeam, note, by }) {
  const rec = records.find((r) => r.id === id);
  if (!rec) return null;
  return createAssignment({
    orderId: rec.orderId,
    customer: rec.customer,
    serviceName: rec.serviceName,
    assignedTo,
    assignedTeam,
    status: 'Assigned',
    note: note?.trim() ? `${note.trim()} · Reassigned by ${by ?? '—'}` : `Reassigned by ${by ?? '—'}`,
  });
}