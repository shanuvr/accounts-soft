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
  let status = {};
  let loaded = false;
  let loadError = false;
  let loadingPromise = null;
  const listeners = new Set();

  function emit() {
    for (const l of listeners) l();
  }

  async function load() {
    if (!loadingPromise) {
      loadingPromise = Promise.resolve()
        .then(() => fetchList())
        .then((result) => {
          const list = result && !Array.isArray(result) && Array.isArray(result.list) ? result.list : result;
          raw = Array.isArray(list) ? list : [];
          records = raw.map(mapRecord);
          loadError = false;
          status = result && !Array.isArray(result) && result.status ? result.status : { failed: false };
        })
        .catch((err) => {
          raw = [];
          records = [];
          loadError = true;
          status = err?.status ?? { failed: true };
        })
        .then(() => {
          loaded = true;
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

  function getLoadedSnapshot() {
    return loaded;
  }

  function getLoadErrorSnapshot() {
    return loadError;
  }

  function getStatusSnapshot() {
    return status;
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

  function useIsLoaded() {
    useEffect(() => {
      load();
    }, []);
    return useSyncExternalStore(subscribe, getLoadedSnapshot);
  }

  function useLoadError() {
    useEffect(() => {
      load();
    }, []);
    return useSyncExternalStore(subscribe, getLoadErrorSnapshot);
  }

  function useStatus() {
    useEffect(() => {
      load();
    }, []);
    return useSyncExternalStore(subscribe, getStatusSnapshot);
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

  function applyLocal(mutator) {
    records = mutator(records);
    emit();
  }

  return {
    useItems,
    useIsLoaded,
    useLoadError,
    useStatus,
    load,
    getSnapshot,
    subscribe,
    all: () => records,
    raw: () => raw,
    findId,
    findAll,
    run,
    applyLocal,
  };
}