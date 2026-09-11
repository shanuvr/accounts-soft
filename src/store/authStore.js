import { useSyncExternalStore } from 'react';

let current = { email: 'admin@accountsoft.com', name: 'Anita Desai', role: 'Operations Manager' };
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

export function useAuth() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setUser(user) {
  current = user;
  emit();
}
//comment