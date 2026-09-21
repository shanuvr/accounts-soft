import client from './client'

const get = (url) => client.get(url).then((r) => r.data)
const post = (url, data) => client.post(url, data).then((r) => r.data)
const patch = (url, data) => client.patch(url, data).then((r) => r.data)
const del = (url) => client.delete(url)

const unwrap = (data) => data?.results ?? data

const STATUS_ENDPOINTS = {
  order: '/masters/orderstatuses/',
  ptda: '/masters/ptdastatuses/',
  assignment: '/masters/assignmentstatuses/',
  delivery: '/masters/deliverystatuses/',
  payment: '/masters/paymentstatuses/',
}

// Payment Methods
export const getPaymentMethods = () => get('/masters/paymentmethods/').then(unwrap)
export const createPaymentMethod = (data) => post('/masters/paymentmethods/', data)
export const updatePaymentMethod = (id, data) => patch(`/masters/paymentmethods/${id}/`, data)
export const deletePaymentMethod = (id) => del(`/masters/paymentmethods/${id}/`)

// Payment Terms
export const getPaymentTerms = () => get('/masters/paymentterms/').then(unwrap)
export const createPaymentTerm = (data) => post('/masters/paymentterms/', data)
export const updatePaymentTerm = (id, data) => patch(`/masters/paymentterms/${id}/`, data)
export const deletePaymentTerm = (id) => del(`/masters/paymentterms/${id}/`)

// Taxes
export const getTaxes = () => get('/masters/taxes/').then(unwrap)
export const createTax = (data) => post('/masters/taxes/', data)
export const updateTax = (id, data) => patch(`/masters/taxes/${id}/`, data)
export const deleteTax = (id) => del(`/masters/taxes/${id}/`)

// Delivery Types
export const getDeliveryTypes = () => get('/masters/deliverytypes/').then(unwrap)
export const createDeliveryType = (data) => post('/masters/deliverytypes/', data)
export const updateDeliveryType = (id, data) => patch(`/masters/deliverytypes/${id}/`, data)
export const deleteDeliveryType = (id) => del(`/masters/deliverytypes/${id}/`)

// Status Masters
export const getStatuses = (group) => get(STATUS_ENDPOINTS[group]).then(unwrap)
export const createStatus = (group, data) => post(STATUS_ENDPOINTS[group], data)
export const updateStatus = (group, id, data) => patch(`${STATUS_ENDPOINTS[group]}${id}/`, data)
export const deleteStatus = (group, id) => del(`${STATUS_ENDPOINTS[group]}${id}/`)

// Shared masters (SystemSoft)
export const getCustomers = () => get('/customers/customers/').then(unwrap)
export const getCustomer = (id) => get(`/customers/customers/${id}/`)
export const createCustomer = (data) => post('/customers/customers/', data)
export const updateCustomer = (id, data) => patch(`/customers/customers/${id}/`, data)
export const deleteCustomer = (id) => del(`/customers/customers/${id}/`)

export const getEmployees = () => get('/customers/employees/').then(unwrap)
export const createEmployee = (data) => post('/customers/employees/', data)
export const updateEmployee = (id, data) => patch(`/customers/employees/${id}/`, data)
export const deleteEmployee = (id) => del(`/customers/employees/${id}/`)

export const getDepartments = () => get('/customers/departments/').then(unwrap)
export const createDepartment = (data) => post('/customers/departments/', data)
export const updateDepartment = (id, data) => patch(`/customers/departments/${id}/`, data)
export const deleteDepartment = (id) => del(`/customers/departments/${id}/`)

// Dedicated catalogue masters
export const getProducts = () => get('/customers/products/').then(unwrap)
export const createProduct = (data) => post('/customers/products/', data)
export const updateProduct = (id, data) => patch(`/customers/products/${id}/`, data)
export const deleteProduct = (id) => del(`/customers/products/${id}/`)

export const getProductCategories = () => get('/customers/productcategories/').then(unwrap)
export const createProductCategory = (data) => post('/customers/productcategories/', data)
export const updateProductCategory = (id, data) => patch(`/customers/productcategories/${id}/`, data)
export const deleteProductCategory = (id) => del(`/customers/productcategories/${id}/`)

export const getUoms = () => get('/customers/uoms/').then(unwrap)
export const createUom = (data) => post('/customers/uoms/', data)
export const updateUom = (id, data) => patch(`/customers/uoms/${id}/`, data)
export const deleteUom = (id) => del(`/customers/uoms/${id}/`)

export const getCustomerTypes = () => get('/customers/customertypes/').then(unwrap)
export const createCustomerType = (data) => post('/customers/customertypes/', data)
export const updateCustomerType = (id, data) => patch(`/customers/customertypes/${id}/`, data)
export const deleteCustomerType = (id) => del(`/customers/customertypes/${id}/`)

// Categories & Subcategories
export const getCategories = () => get('/masters/categories/').then(unwrap)
export const createCategory = (data) => post('/masters/categories/', data)
export const updateCategory = (id, data) => patch(`/masters/categories/${id}/`, data)
export const deleteCategory = (id) => del(`/masters/categories/${id}/`)

export const getSubcategories = () => get('/masters/subcategories/').then(unwrap)
export const createSubcategory = (data) => post('/masters/subcategories/', data)
export const updateSubcategory = (id, data) => patch(`/masters/subcategories/${id}/`, data)
export const deleteSubcategory = (id) => del(`/masters/subcategories/${id}/`)