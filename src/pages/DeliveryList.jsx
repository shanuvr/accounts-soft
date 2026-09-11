import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { fmtDate } from '../data/mockData';
import { useDeliveries } from '../store/deliveryStore';

const STATUS_COLORS = {
  'Pending': 'border-slate-200 bg-slate-100 text-slate-600',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  'Ready for Delivery': 'border-amber-200 bg-amber-50 text-amber-700',
  'Delivered': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Cancelled': 'border-red-200 bg-red-50 text-red-700',
};

export const DELIVERY_STATUS_COLORS = STATUS_COLORS;

const STATUSES = ['Pending', 'In Progress', 'Ready for Delivery', 'Delivered', 'Cancelled'];

export const todayStr = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

export const isOverdue = (d) => !['Delivered', 'Cancelled'].includes(d.status) && d.expectedDeliveryDate && d.expectedDeliveryDate < todayStr;

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function Badge({ cls, children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function DeliveryList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customer, setCustomer] = useState('');
  const [dueDate, setDueDate] = useState('');

  const deliveries = useDeliveries();

  const customers = useMemo(() => [...new Set(deliveries.map((d) => d.customer))], [deliveries]);

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (search && !`${d.id} ${d.orderId} ${d.customer} ${d.serviceName}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (status && d.status !== status) return false;
      if (customer && d.customer !== customer) return false;
      if (dueDate && d.expectedDeliveryDate !== dueDate) return false;
      return true;
    });
  }, [deliveries, search, status, customer, dueDate]);

  const counts = useMemo(
    () => ({
      total: deliveries.length,
      Pending: deliveries.filter((d) => d.status === 'Pending').length,
      'In Progress': deliveries.filter((d) => d.status === 'In Progress').length,
      Delivered: deliveries.filter((d) => d.status === 'Delivered').length,
    }),
    [deliveries]
  );

  const cards = [
    { key: 'total', label: 'Total Services', value: counts.total, cls: '', active: status === '' },
    { key: 'Pending', label: 'Pending', value: counts.Pending, cls: '', active: status === 'Pending' },
    { key: 'In Progress', label: 'In Progress', value: counts['In Progress'], cls: '', active: status === 'In Progress' },
    { key: 'Delivered', label: 'Delivered', value: counts.Delivered, cls: 'text-emerald-700', active: status === 'Delivered' },
  ];

  return (
    <Layout active="delivery">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-slate-900">Delivery Tracking</h1>
          <p className="mt-1 text-[13px] text-slate-500">What has been delivered, what is still pending, and when it was delivered.</p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setStatus(c.key === 'total' ? '' : c.key)}
              className={`rounded-xl border p-4 text-left transition-colors ${c.active ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-emerald-50/30'}`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{c.label}</p>
              <p className={`mt-1 text-[20px] font-semibold text-slate-800 ${c.cls}`}>{c.value}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer, service..." className={`${inputCls} pl-9`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls}>
            <option value="">All Customers</option>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} title="Delivery date" className={inputCls} />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Delivery ID</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      No deliveries match your filters. Add a service to an order and a delivery record appears here.
                    </td>
                  </tr>
                )}
                {filtered.map((d) => {
                  const overdue = isOverdue(d);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/delivery/${d.id}`)}
                      className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-emerald-50/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">{d.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{d.orderId}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{d.customer}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-slate-700">{d.serviceName}</td>
                      <td className={`whitespace-nowrap px-4 py-3 ${overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}>{fmtDate(d.expectedDeliveryDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge cls={STATUS_COLORS[d.status] ?? STATUS_COLORS.Pending}>{d.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/delivery/${d.id}`); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DeliveryList;