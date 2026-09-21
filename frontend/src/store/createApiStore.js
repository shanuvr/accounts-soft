import { useEffect, useSyncExternalStore } from 'react';

function classifyError(err) {
  const status = err?.response?.status;
  const text = JSON.stringify(err?.response?.data || err?.message || '');
  if (status === 404) return 'notfound';
  if (status === 409) return 'duplicate';
  if (/unique|already exists|duplicate/i.test(text)) return 'duplicate';
  if (status === 400) return 'validation';
  return 'error';
}

export function createApiStore({ fetchList, mapRecord = (r) => r }) {
  let raw = [];
  let records = [];
  let loadingPromise = null;
  const listeners = new Set();

  function emit() {
    for (const l of listeners) l();
  }

  async function load() {
    if (!loadingPromise) {
      loadingPromise = Promise.resolve()
        .then(() => fetchList())
        .then((list) => {
          raw = Array.isArray(list) ? list : [];
          records = raw.map(mapRecord);
        })
        .catch(() => {
          raw = [];
          records = [];
        })
        .finally(() => {
          loadingPromise = null;
          emit();
        });
    }
    return loadingPromise;
  }

  function getSnapshot() {
    return records;
  }

  function subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  function useItems() {
    useEffect(() => {
      load();
    }, []);
    return useSyncExternalStore(subscribe, getSnapshot);
  }

  function findAll(predicate) {
    return raw.filter(predicate);
  }

  function findId(predicate) {
    const found = raw.find(predicate);
    return found ? found.id : null;
  }

  async function run(action) {
    try {
      const record = await action();
      await load();
      return { ok: true, record };
    } catch (err) {
      return { ok: false, reason: classifyError(err) };
    }
  }

  return {
    useItems,
    load,
    getSnapshot,
    subscribe,
    all: () => records,
    raw: () => raw,
    findId,
    findAll,
    run,
  };
}