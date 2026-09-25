import * as api from '../api/data';

let byKey = new Map();
let byId = new Map();
let loaded = false;
let loading = null;

async function load() {
  if (loaded) return;
  if (!loading) {
    loading = (async () => {
      const rows = await api.getOrderServices().catch(() => []);
      byKey = new Map();
      byId = new Map();
      for (const r of rows) {
        const key = `${r.order_id}\u0000${r.service_name}`;
        byKey.set(key, r.id);
        byId.set(r.id, { orderId: r.order_id, serviceName: r.service_name });
      }
      loaded = true;
    })();
  }
  await loading;
}

export async function refreshOrderServiceIndex() {
  loaded = false;
  loading = null;
  await load();
}

export async function resolveOrderServiceId(orderId, serviceName) {
  await load();
  const key = `${orderId}\u0000${serviceName}`;
  let id = byKey.get(key);
  if (id == null) {
    await refreshOrderServiceIndex();
    id = byKey.get(key);
  }
  return id ?? null;
}

export async function resolveOrderServiceInfo(orderServiceId) {
  await load();
  return byId.get(Number(orderServiceId)) ?? null;
}