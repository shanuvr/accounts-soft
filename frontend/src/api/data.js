import client from './client'

export const getCustomers = () => client.get('/customers/customers/').then(r => r.data)
export const getCustomer = (id) => client.get(`/customers/customers/${id}/`).then(r => r.data)
export const createCustomer = (data) => client.post('/customers/customers/', data).then(r => r.data)
export const updateCustomer = (id, data) => client.patch(`/customers/customers/${id}/`, data).then(r => r.data)
export const deleteCustomer = (id) => client.delete(`/customers/customers/${id}/`)

export const getOrders = () => client.get('/orders/orders/').then(r => r.data)
export const getOrder = (id) => client.get(`/orders/orders/${id}/`).then(r => r.data)
export const createOrder = (data) => client.post('/orders/orders/', data).then(r => r.data)
export const updateOrder = (id, data) => client.patch(`/orders/orders/${id}/`, data).then(r => r.data)
export const deleteOrder = (id) => client.delete(`/orders/orders/${id}/`)

export const getPayments = (orderId) => {
  const url = orderId ? `/orders/orders/${orderId}/payments/` : '/payments/payments/'
  return client.get(url).then(r => r.data)
}
export const createPayment = (data) => client.post('/payments/payments/', data).then(r => r.data)

export const getMasters = (type) => {
  const unwrap = (r) => (r.data?.results ?? r.data);
  const endpoints = {
    paymentMethods: '/masters/paymentmethods/',
    paymentTerms: '/masters/paymentterms/',
    taxes: '/masters/taxes/',
    deliveryTypes: '/masters/deliverytypes/',
    orderStatuses: '/masters/orderstatuses/',
    paymentStatuses: '/masters/paymentstatuses/',
  }
  const fallback = Object.keys(endpoints)
  return client.get(endpoints[type] || `/masters/${type}/`).then(unwrap)
}
export const getProducts = () => client.get('/customers/products/').then(r => r.data?.results ?? r.data)
export const getProductCategories = () => client.get('/customers/productcategories/').then(r => r.data?.results ?? r.data)
export const getEmployees = () => client.get('/customers/employees/').then(r => r.data?.results ?? r.data)
export const getDepartments = () => client.get('/customers/departments/').then(r => r.data?.results ?? r.data)
