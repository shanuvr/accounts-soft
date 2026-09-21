import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const store = createApiStore({
  fetchList: api.getCustomers,
  mapRecord: (r) => ({
    customerId: r.customer_id,
    name: r.name,
    contactPerson: r.contact_person || '',
    phone: r.phone || '',
    email: r.email || '',
    type: r.customer_type || '',
    status: r.status || 'Active',
    notes: r.notes || '',
    orderCount: 0,
    orderValue: 0,
    pending: 0,
  }),
});

export function useCustomers() {
  return store.useItems();
}

export function getAllCustomers() {
  return store.all();
}

export function getCustomerById(customerId) {
  return store.all().find((r) => r.customerId === customerId);
}