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

const unwrap = (r) => r.data?.results ?? r.data;

export const getLocalOrders = () => client.get('/orders/orders/', { params: { page_size: 500 } }).then(unwrap)
export const getExternalOrders = () =>
  client.get('/orders/external/', { params: { page: 1, page_size: 500 } }).then((r) => r.data?.results ?? [])

// Order line items -----------------------------------------------------------
export const getOrderServices = () => client.get('/orders/orderservices/', { params: { page_size: 500 } }).then(unwrap)
export const createOrderService = (data) => client.post('/orders/orderservices/', data).then(r => r.data)
export const updateOrderService = (id, data) => client.patch(`/orders/orderservices/${id}/`, data).then(r => r.data)
export const deleteOrderService = (id) => client.delete(`/orders/orderservices/${id}/`)

// Payments -------------------------------------------------------------------
export const getPayments = () => client.get('/payments/payments/', { params: { page_size: 500 } }).then(unwrap)
export const createPayment = (data) => client.post('/payments/payments/', data).then(r => r.data)
export const updatePayment = (id, data) => client.patch(`/payments/payments/${id}/`, data).then(r => r.data)

// Payment schedules (payment plans) -------------------------------------------
export const getPaymentSchedules = () => client.get('/payments/paymentschedules/', { params: { page_size: 500 } }).then(unwrap)
export const createPaymentSchedule = (data) => client.post('/payments/paymentschedules/', data).then(r => r.data)
export const updatePaymentSchedule = (id, data) => client.patch(`/payments/paymentschedules/${id}/`, data).then(r => r.data)
export const deletePaymentSchedule = (id) => client.delete(`/payments/paymentschedules/${id}/`)

// PTDA ------------------------------------------------------------------------
export const getPtdaTemplates = () => client.get('/ptda/ptdatemplates/', { params: { page_size: 500 } }).then(unwrap)
export const getPtdas = () => client.get('/ptda/ptdas/', { params: { page_size: 500 } }).then(unwrap)
export const createPtda = (data) => client.post('/ptda/ptdas/', data).then(r => r.data)
export const updatePtda = (id, data) => client.patch(`/ptda/ptdas/${id}/`, data).then(r => r.data)
export const deletePtda = (id) => client.delete(`/ptda/ptdas/${id}/`)

// Assignments ----------------------------------------------------------------
export const getAssignments = () => client.get('/assignments/assignments/', { params: { page_size: 500 } }).then(unwrap)
export const createAssignment = (data) => client.post('/assignments/assignments/', data).then(r => r.data)
export const updateAssignment = (id, data) => client.patch(`/assignments/assignments/${id}/`, data).then(r => r.data)
export const deleteAssignment = (id) => client.delete(`/assignments/assignments/${id}/`)

// Deliveries -----------------------------------------------------------------
export const getDeliveries = () => client.get('/deliveries/deliverys/', { params: { page_size: 500 } }).then(unwrap)
export const createDelivery = (data) => client.post('/deliveries/deliverys/', data).then(r => r.data)
export const updateDelivery = (id, data) => client.patch(`/deliveries/deliverys/${id}/`, data).then(r => r.data)
export const deleteDelivery = (id) => client.delete(`/deliveries/deliverys/${id}/`)

// Invoices --------------------------------------------------------------------
export const getInvoices = () => client.get('/invoices/invoices/', { params: { page_size: 500 } }).then(unwrap)
export const getInvoice = (id) => client.get(`/invoices/invoices/${id}/`).then(r => r.data)
export const createInvoice = (data) => client.post('/invoices/invoices/', data).then(r => r.data)
export const updateInvoice = (id, data) => client.patch(`/invoices/invoices/${id}/`, data).then(r => r.data)
export const deleteInvoice = (id) => client.delete(`/invoices/invoices/${id}/`)
export const sendInvoice = (id, data) => client.post(`/invoices/invoices/${id}/send/`, data).then(r => r.data)

// Renewals -------------------------------------------------------------------
export const getRenewals = () => client.get('/renewals/renewals/', { params: { page_size: 500 } }).then(unwrap)
export const createRenewal = (data) => client.post('/renewals/renewals/', data).then(r => r.data)
export const updateRenewal = (id, data) => client.patch(`/renewals/renewals/${id}/`, data).then(r => r.data)
export const deleteRenewal = (id) => client.delete(`/renewals/renewals/${id}/`)

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
  return client.get(endpoints[type] || `/masters/${type}/`).then(unwrap)
}
const MASTER_ENDPOINTS = {
  paymentMethods: '/masters/paymentmethods/',
  paymentTerms: '/masters/paymentterms/',
  taxes: '/masters/taxes/',
  deliveryTypes: '/masters/deliverytypes/',
  orderStatuses: '/masters/orderstatuses/',
  paymentStatuses: '/masters/paymentstatuses/',
}
export const getMastersAll = (type) =>
  client.get(MASTER_ENDPOINTS[type] || `/masters/${type}/`, { params: { page_size: 500 } }).then((r) => r.data?.results ?? r.data)
export const getProducts = () => client.get('/customers/products/').then(r => r.data?.results ?? r.data)
export const getProductCategories = () => client.get('/customers/productcategories/').then(r => r.data?.results ?? r.data)
export const getEmployees = () => client.get('/customers/employees/').then(r => r.data?.results ?? r.data)
export const getDepartments = () => client.get('/customers/departments/').then(r => r.data?.results ?? r.data)
