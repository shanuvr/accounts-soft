import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const GROUPS = ['order', 'ptda', 'assignment', 'delivery', 'payment'];

const store = createApiStore({
  fetchList: async () => {
    const lists = await Promise.all(
      GROUPS.map((group) => api.getStatuses(group).then((list) => list.map((r) => ({ ...r, group }))))
    );
    return lists.flat();
  },
  mapRecord: (r) => ({
    id: r.id,
    group: r.group,
    name: r.name,
    label: r.label || r.name,
    isTerminal: Boolean(r.is_terminal),
  }),
});

export function useStatuses() {
  return store.useItems();
}

export function getAllStatuses() {
  return store.all();
}

export const STATUS_GROUPS = GROUPS;

export async function addStatus(group, data) {
  const name = data?.name?.trim();
  if (!name) return { ok: false, reason: 'name' };
  return store.run(() =>
    api.createStatus(group, { name, label: data.label || name, is_terminal: Boolean(data.isTerminal) })
  );
}

export async function updateStatus(group, name, patch) {
  const id = store.findId((r) => r.group === group && r.name === name);
  if (!id) return { ok: false, reason: 'notfound' };
  const existing = store.all().find((r) => r.group === group && r.name === name);
  const payload = {
    label: patch.label !== undefined ? patch.label : existing?.label || name,
    is_terminal: patch.isTerminal !== undefined ? Boolean(patch.isTerminal) : Boolean(existing?.isTerminal),
  };
  return store.run(() => api.updateStatus(group, id, payload));
}

export async function deleteStatus(group, name) {
  const id = store.findId((r) => r.group === group && r.name === name);
  if (!id) return { ok: false, reason: 'notfound' };
  return store.run(() => api.deleteStatus(group, id));
}