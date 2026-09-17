import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { CUSTOMERS, EMPLOYEES, fmtINR, fmtDate } from '../data/mockData';
import { ORDER_STATUSES, ORDER_STATUS_COLORS, isActiveOrder } from '../data/orderStatus';
import { usePtds } from '../store/ptdStore';
import { useOrders, addOrder } from '../store/orderStore';

const PAYMENT_STATUS_COLORS = {
  'Unpaid': 'border-slate-200 bg-slate-100 text-slate-600',
  'Partially Paid': 'border-amber-200 bg-amber-50 text-amber-700',
  'Paid': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Overdue': 'border-red-200 bg-red-50 text-red-700',
  'Refunded': 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

function Badge({ status, map }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function orderAge(dateStr) {
  const ms = new Date() - new Date(dateStr + 'T00:00:00');
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (d < 0) return { label: '—', cls: 'text-slate-400' };
  if (d < 30) return { label: `${d}d`, cls: 'text-emerald-600' };
  if (d < 365) return { label: `${Math.floor(d / 30)}m ${d % 30}d`, cls: 'text-amber-600' };
  return { label: `${Math.floor(d / 365)}y ${Math.floor((d % 365) / 30)}m`, cls: 'text-red-600' };
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function NewOrderModal({ onClose }) {
  const [form, setForm] = useState({
    customer: '',
    value: '',
    orderDate: todayISO(),
    deliveryDate: todayISO(30),
    orderStatus: 'Pending',
    paymentStatus: 'Unpaid',
    salesPerson: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.customer && Number(form.value) > 0 && form.orderDate && form.deliveryDate && form.salesPerson;

  const submit = () => {
    if (!valid) return;
    addOrder(form);
    onClose();
  };

  const fieldCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
  const labelCls = 'text-[11px] font-medium uppercase tracking-wide text-slate-400';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">New Order</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">Create a new order record.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <p className={labelCls}>Customer</p>
            <select value={form.customer} onChange={set('customer')} className={fieldCls}>
              <option value="">Select customer…</option>
              {CUSTOMERS.filter((c) => c.status === 'Active').map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Order Value</p>
              <input type="number" min="0" placeholder="0.00" value={form.value} onChange={set('value')} className={fieldCls} />
            </div>
            <div>
              <p className={labelCls}>Sales Person</p>
              <select value={form.salesPerson} onChange={set('salesPerson')} className={fieldCls}>
                <option value="">Select…</option>
                {EMPLOYEES.map((e) => (
                  <option key={e.name} value={e.name}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Order Date</p>
              <input type="date" value={form.orderDate} onChange={set('orderDate')} className={fieldCls} />
            </div>
            <div>
              <p className={labelCls}>Delivery Date</p>
              <input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} className={fieldCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Order Status</p>
              <select value={form.orderStatus} onChange={set('orderStatus')} className={fieldCls}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <p className={labelCls}>Payment Status</p>
              <select value={form.paymentStatus} onChange={set('paymentStatus')} className={fieldCls}>
                {Object.keys(PAYMENT_STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const navigate = useNavigate();
  const ptds = usePtds();
  const orders = useOrders();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [customer, setCustomer] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const overduedOrders = orders.filter((o) => isActiveOrder(o.orderStatus) && new Date(o.deliveryDate) < new Date());
  const summary = [
    { label: 'Total Orders', count: orders.length, color: 'bg-emerald-600', icon: 'orders' },
    { label: 'Pending', count: orders.filter((o) => o.orderStatus === 'Pending').length, color: 'bg-amber-500', icon: 'clock' },
    { label: 'Ongoing', count: orders.filter((o) => o.orderStatus === 'Ongoing').length, color: 'bg-blue-500', icon: 'play' },
    { label: 'Delivered', count: orders.filter((o) => o.orderStatus === 'Delivered').length, color: 'bg-emerald-500', icon: 'check' },
    { label: 'Overdue', count: overduedOrders.length, color: 'bg-red-500', icon: 'alert' },
    { label: 'Cancelled', count: orders.filter((o) => o.orderStatus === 'Cancelled').length, color: 'bg-slate-500', icon: 'x' },
  ];

  const filtered = orders.filter((o) => {
    if (search && !`${o.orderId} ${o.customer} ${o.salesPerson}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status) {
      if (o.orderStatus !== status) return false;
    } else if (o.orderStatus === 'Delivered') {
      return false;
    }
    if (payment && o.paymentStatus !== payment) return false;
    if (customer && o.customer !== customer) return false;
    if (salesPerson && o.salesPerson !== salesPerson) return false;
    if (dateFrom && o.orderDate < dateFrom) return false;
    if (dateTo && o.orderDate > dateTo) return false;
    return true;
  });

  const icons = {
    orders: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-5Z" />
        <path d="M4 7h16M9 12h6" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4.5 4.5L19 7.5" />
      </svg>
    ),
    play: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" stroke="none" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    alert: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 10v4M12 17h.01" />
      </svg>
    ),
    x: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    ),
  };

  const inputCls = 'h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <Layout active="orders">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage confirmed orders and track their operational &amp; financial progress.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition-colors hover:bg-emerald-500"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Order
        </button>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{s.label}</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-white ${s.color}`}>{icons[s.icon]}</span>
            </div>
            <p className="mt-1 text-[17px] font-semibold tracking-tight text-slate-900">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          <div className="relative col-span-2 md:col-span-1 lg:col-span-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, customer..."
              className={`${inputCls} pl-9`}
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">Active orders</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputCls}>
            <option value="">All payments</option>
            {Object.keys(PAYMENT_STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} className={inputCls}>
            <option value="">All sales</option>
            {[...new Set(orders.map((o) => o.salesPerson))].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls}>
            <option value="">All customers</option>
            {[...new Set(orders.map((o) => o.customer))].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} aria-label="Order date from" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} aria-label="Order date to" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-2 py-1.5 font-semibold leading-tight"><span className="block">Order</span><span className="block">ID</span></th>
                <th className="px-2 py-1.5 font-semibold">Customer</th>
                <th className="px-2 py-1.5 text-right font-semibold leading-tight"><span className="block">Order</span><span className="block">Value</span></th>
                <th className="px-2 py-1.5 font-semibold leading-tight"><span className="block">Order</span><span className="block">Date</span></th>
                <th className="px-2 py-1.5 font-semibold">Age</th>
                <th className="px-2 py-1.5 font-semibold">PTD</th>
                <th className="px-2 py-1.5 font-semibold leading-tight"><span className="block">Delivery</span><span className="block">Date</span></th>
                <th className="px-2 py-1.5 font-semibold leading-tight"><span className="block">Order</span><span className="block">Status</span></th>
                <th className="px-2 py-1.5 font-semibold leading-tight"><span className="block">Payment</span><span className="block">Status</span></th>
                <th className="px-2 py-1.5 font-semibold leading-tight"><span className="block">Sales</span><span className="block">Person</span></th>
                <th className="px-2 py-1.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.orderId} onClick={() => navigate(`/orders/${o.orderId}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-2 py-2">
                    <span className="font-semibold text-emerald-700 hover:underline">{o.orderId}</span>
                  </td>
                  <td className="max-w-[200px] truncate px-2 py-2 text-slate-800">{o.customer}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">{fmtINR(o.value)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-slate-600">{fmtDate(o.orderDate)}</td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <span className={`font-semibold ${orderAge(o.orderDate).cls}`}>{orderAge(o.orderDate).label}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <span className={`font-semibold ${ptds.some((p) => p.orderId === o.orderId) ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {ptds.filter((p) => p.orderId === o.orderId).length}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-slate-600">{fmtDate(o.deliveryDate)}</td>
                  <td className="whitespace-nowrap px-2 py-2"><Badge status={o.orderStatus} map={ORDER_STATUS_COLORS} /></td>
                  <td className="whitespace-nowrap px-2 py-2"><Badge status={o.paymentStatus} map={PAYMENT_STATUS_COLORS} /></td>
                  <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.salesPerson}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderId}`); }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label={`View ${o.orderId}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center text-sm text-slate-400">No orders match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-2 py-2 text-[12px] text-slate-500">
          <span>Showing {filtered.length} of {orders.length} orders</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-400">Previous</button>
            <button type="button" className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700">Next</button>
          </div>
        </div>
      </div>

      {modalOpen && <NewOrderModal onClose={() => setModalOpen(false)} />}
    </Layout>
  );
}

export default Orders;