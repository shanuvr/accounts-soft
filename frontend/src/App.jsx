import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import PtdList from './pages/PtdList'
import PtdDetail from './pages/PtdDetail'
import AssignmentList from './pages/AssignmentList'
import AssignmentDetail from './pages/AssignmentDetail'
import DeliveryList from './pages/DeliveryList'
import DeliveryDetail from './pages/DeliveryDetail'
import ProductsServices from './pages/ProductsServices'
import CategorySubcategoryMaster from './pages/CategorySubcategoryMaster'
import ServiceCategory from './pages/ServiceCategory'
import PaymentMethods from './pages/PaymentMethods'
import PaymentTerms from './pages/PaymentTerms'
import TaxMaster from './pages/TaxMaster'
import DeliveryTypeMaster from './pages/DeliveryTypeMaster'
import StatusMasters from './pages/StatusMasters'
import UOMMaster from './pages/UOMMaster'
import CustomerTypeMaster from './pages/CustomerTypeMaster'
import EmployeeMaster from './pages/EmployeeMaster'
import DepartmentMaster from './pages/DepartmentMaster'
import Payments from './pages/Payments'
import PaymentDetail from './pages/PaymentDetail'
import Ledger from './pages/Ledger'
import Journal from './pages/Journal'
import Cashbook from './pages/Cashbook'
import BankBook from './pages/BankBook'
import ExpenseHead from './pages/ExpenseHead'
import InvoiceList from './pages/InvoiceList'
import InvoiceDetail from './pages/InvoiceDetail'
import Renewals from './pages/Renewals'
import Layout from './layouts/Layout'
import { useEffect } from 'react'

function Placeholder({ title }) {
  useEffect(() => {
    document.title = `${title} · Account Soft`
  }, [title])

  return (
    <Layout active={title.toLowerCase().split(' ')[0]}>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">This module is under construction.</p>
    </Layout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:orderId" element={<OrderDetail />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/customers/:customerId" element={<CustomerDetail />} />
      <Route path="/category-subcategory-master" element={<CategorySubcategoryMaster />} />
      <Route path="/products-services" element={<ProductsServices />} />
      <Route path="/service-categories" element={<ServiceCategory />} />
      <Route path="/payment-methods" element={<PaymentMethods />} />
      <Route path="/payment-terms" element={<PaymentTerms />} />
      <Route path="/tax-master" element={<TaxMaster />} />
      <Route path="/delivery-types" element={<DeliveryTypeMaster />} />
      <Route path="/status-masters" element={<StatusMasters />} />
      <Route path="/uom-master" element={<UOMMaster />} />
      <Route path="/customer-type-master" element={<CustomerTypeMaster />} />
      <Route path="/employee-master" element={<EmployeeMaster />} />
      <Route path="/department-master" element={<DepartmentMaster />} />
      <Route path="/ptd" element={<PtdList />} />
      <Route path="/ptd/:ptdId" element={<PtdDetail />} />
      <Route path="/assignments" element={<AssignmentList />} />
      <Route path="/assignments/:assignmentId" element={<AssignmentDetail />} />
      <Route path="/delivery" element={<DeliveryList />} />
      <Route path="/delivery/:deliveryId" element={<DeliveryDetail />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/payments/:paymentId" element={<PaymentDetail />} />
      <Route path="/ledger" element={<Ledger />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/cashbook" element={<Cashbook />} />
      <Route path="/bankbook" element={<BankBook />} />
      <Route path="/expense-head" element={<ExpenseHead />} />
      <Route path="/reports/transactions/expense-head" element={<ExpenseHead />} />
      <Route path="/invoices" element={<InvoiceList />} />
      <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />
      <Route path="/renewals" element={<Renewals />} />
      <Route path="/reports" element={<Placeholder title="Reports" />} />
      <Route path="/masters" element={<Placeholder title="Masters" />} />
      <Route path="/users" element={<Placeholder title="Users & Roles" />} />
      <Route path="/settings" element={<Placeholder title="Settings" />} />
    </Routes>
  )
}

export default App