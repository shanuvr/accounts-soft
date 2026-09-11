export const ORDERS = [
  { orderId: 'ORD-1024', leadId: 'LEAD-ORD-2045', customer: 'ABC Technologies Pvt Ltd', value: 147500, orderDate: '2026-09-05', deliveryDate: '2026-09-30', orderStatus: 'In Progress', paymentStatus: 'Partially Paid', salesPerson: 'Rahul Sharma' },
  { orderId: 'ORD-1016', leadId: 'LEAD-ORD-2030', customer: 'ABC Technologies Pvt Ltd', value: 120000, orderDate: '2026-07-05', deliveryDate: '2026-07-28', orderStatus: 'Completed', paymentStatus: 'Paid', salesPerson: 'Anita Desai' },
  { orderId: 'ORD-1014', leadId: 'LEAD-ORD-2028', customer: 'ABC Technologies Pvt Ltd', value: 220000, orderDate: '2026-06-15', deliveryDate: '2026-07-12', orderStatus: 'Completed', paymentStatus: 'Paid', salesPerson: 'Priya Nair' },
  { orderId: 'ORD-1012', leadId: 'LEAD-ORD-2025', customer: 'ABC Technologies Pvt Ltd', value: 85000, orderDate: '2026-05-20', deliveryDate: '2026-08-08', orderStatus: 'Completed', paymentStatus: 'Paid', salesPerson: 'Karan Malhotra' },
  { orderId: 'ORD-1023', leadId: 'LEAD-ORD-2044', customer: 'BlueSky Media', value: 45000, orderDate: '2026-09-04', deliveryDate: '2026-09-18', orderStatus: 'Under Review', paymentStatus: 'Unpaid', salesPerson: 'Anita Desai' },
  { orderId: 'ORD-1022', leadId: 'LEAD-ORD-2043', customer: 'GreenLeaf Organics', value: 89000, orderDate: '2026-08-28', deliveryDate: '2026-09-14', orderStatus: 'Completed', paymentStatus: 'Paid', salesPerson: 'Rahul Sharma' },
  { orderId: 'ORD-1021', leadId: 'LEAD-ORD-2042', customer: 'Nova Systems', value: 230000, orderDate: '2026-08-25', deliveryDate: '2026-09-28', orderStatus: 'In Progress', paymentStatus: 'Partially Paid', salesPerson: 'Priya Nair' },
  { orderId: 'ORD-1020', leadId: 'LEAD-ORD-2041', customer: 'Zenith Corp', value: 67500, orderDate: '2026-08-20', deliveryDate: '2026-09-05', orderStatus: 'Delivered', paymentStatus: 'Overdue', salesPerson: 'Karan Malhotra' },
  { orderId: 'ORD-1019', leadId: 'LEAD-ORD-2040', customer: 'Fusion Retail', value: 120000, orderDate: '2026-08-15', deliveryDate: '2026-09-10', orderStatus: 'On Hold', paymentStatus: 'Unpaid', salesPerson: 'Anita Desai' },
  { orderId: 'ORD-1018', leadId: 'LEAD-ORD-2039', customer: 'Volt Energy', value: 56000, orderDate: '2026-08-10', deliveryDate: '2026-08-28', orderStatus: 'Cancelled', paymentStatus: 'Refunded', salesPerson: 'Priya Nair' },
  { orderId: 'ORD-1017', leadId: 'LEAD-ORD-2038', customer: 'Orbit Logistics', value: 78000, orderDate: '2026-08-06', deliveryDate: '2026-09-12', orderStatus: 'In Progress', paymentStatus: 'Unpaid', salesPerson: 'Karan Malhotra' },
];

export const CUSTOMERS = [
  { customerId: 'CUST-001', name: 'ABC Technologies Pvt Ltd', contactPerson: 'Rahul Sharma', phone: '98765 43210', email: 'contact@abctech.com', type: 'Corporate', status: 'Active' },
  { customerId: 'CUST-002', name: 'BlueSky Media', contactPerson: "Karan D'Souza", phone: '98111 22233', email: 'hello@blueskymedia.in', type: 'SME', status: 'Active' },
  { customerId: 'CUST-003', name: 'GreenLeaf Organics', contactPerson: 'Suresh Kumar', phone: '97000 11122', email: 'contact@greenleaffoods.in', type: 'SME', status: 'Active' },
  { customerId: 'CUST-004', name: 'Nova Systems', contactPerson: 'Vikram Rathore', phone: '98220 44556', email: 'projects@novasystems.com', type: 'Corporate', status: 'Active' },
  { customerId: 'CUST-005', name: 'Zenith Corp', contactPerson: 'Meera Iyer', phone: '99887 66554', email: 'finance@zenithcorp.com', type: 'Corporate', status: 'Active' },
  { customerId: 'CUST-006', name: 'Fusion Retail', contactPerson: 'Rohit Bansal', phone: '99665 43211', email: 'ops@fusionretail.in', type: 'SME', status: 'Active' },
  { customerId: 'CUST-007', name: 'Volt Energy', contactPerson: 'Sunil Rao', phone: '98333 22110', email: 'procurement@voltenergy.com', type: 'Corporate', status: 'Inactive' },
  { customerId: 'CUST-008', name: 'Orbit Logistics', contactPerson: 'Farhan Ali', phone: '97111 88776', email: 'accounts@orbitlogistics.in', type: 'SME', status: 'Active' },
];

export const PAYMENTS = [];

export const ORDER_SERVICES = {};

export const EMPLOYEES = [
  { name: 'Rahul Sharma', department: 'Operations' },
  { name: 'Sneha Patil', department: 'Operations' },
  { name: 'Amit Verma', department: 'Development' },
  { name: 'Rohit Gupta', department: 'Development' },
  { name: 'Priya Nair', department: 'Accounts' },
  { name: 'Karan Malhotra', department: 'Sales' },
  { name: 'Anita Desai', department: 'Sales' },
];

export const USERS = [
  { email: 'admin@accountsoft.com', name: 'Anita Desai', role: 'Operations Manager' },
  { email: 'rahul@accountsoft.com', name: 'Rahul Sharma', role: 'Operations' },
  { email: 'sneha@accountsoft.com', name: 'Sneha Patil', role: 'Operations' },
  { email: 'amit@accountsoft.com', name: 'Amit Verma', role: 'Development' },
];

export const getUserByEmail = (email) => USERS.find((u) => u.email === email.toLowerCase()) ?? { email, name: 'User', role: 'User' };

export const fmtINR = (n) => '₹' + new Intl.NumberFormat('en-IN').format(n);
export const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });