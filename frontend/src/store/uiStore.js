import { useSyncExternalStore } from 'react';

let current = { mastersOpen: false };
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return current;
}

export function useUi() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setMastersOpen(open) {
  if (current.mastersOpen === open) return;
  current = { ...current, mastersOpen: open };
  emit();
}