import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { usePtds } from '../store/ptdStore';
import { useAssignments } from '../store/assignmentStore';
import { ORDERS, fmtINR, fmtDate } from '../data/mockData';

const PTD_STATUS_COLORS = {
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  'Not Created': 'border-slate-200 bg-slate-100 text-slate-600',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PTD_STATUS_COLORS[status] ?? PTD_STATUS_COLORS['Not Created']}`}>
      {status}
    </span>
  );
}

function PtdDrawer({ order, open, onClose }) {
  const navigate = useNavigate();
  const assignments = useAssignments();
  const allocatedFor = (p) => assignments.find((a) => a.orderId === p.orderId && a.serviceName === p.serviceName)?.allocatedHours ?? 0;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 ease-out ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-lg transform-gpu flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">PTDs — {order.orderId}</p>
            <p className="truncate text-[12.5px] text-slate-500">{order.customer}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Order summary strip */}
        <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Order Value</p>
            <p className="mt-0.5 text-[13px] font-semibold text-slate-800">{order.value ? fmtINR(order.value) : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Order Date</p>
            <p className="mt-0.5 text-[13px] font-semibold text-slate-800">{order.orderDate ? fmtDate(order.orderDate) : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Status</p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{order.orderStatus}</p>
          </div>
        </div>

        {/* PTD list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Technical Data Sheets</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {order.ptds.length} {order.ptds.length === 1 ? 'PTD' : 'PTDs'}
            </span>
          </div>

          {order.ptds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-8 text-center text-[12.5px] text-slate-400">
              No PTDs created for this order yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {order.ptds.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/ptd/${p.id}`)}
                  style={{ transitionDelay: `${Math.min(i * 40, 240)}ms` }}
                  className={`cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:border-emerald-300 hover:bg-emerald-50/40 ${
                    open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-[13px] font-semibold text-emerald-700">{p.id}</span>
                      <Badge status={p.status} />
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">Updated {fmtDate(p.updatedAt)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-[13.5px] font-medium text-slate-800">{p.serviceName}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {allocatedFor(p) > 0 ? `${allocatedFor(p)} hrs` : 'No hours'}
                    </span>
                    <span>·</span>
                    <span className={`font-medium ${p.billable === false ? 'text-slate-400' : 'text-emerald-700'}`}>
                      {p.billable === false ? 'Non-Billable' : `₹${new Intl.NumberFormat('en-IN').format(p.price ?? 0)}`}
                    </span>
                    <span>·</span>
                    <span className="truncate">{p.template}</span>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/ptd/${p.id}?edit=1`); }}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                      </svg>
                      Edit PTD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <span className="text-[12px] text-slate-400">Click a PTD to open it.</span>
          <button
            type="button"
            onClick={() => navigate(`/orders/${order.orderId}`)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            View Order
          </button>
        </div>
      </aside>
    </>
  );
}

function PtdList() {
  const ptds = usePtds();
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const orders = useMemo(() => {
    const idSet = new Set([...ORDERS.map((o) => o.orderId), ...ptds.map((p) => p.orderId)]);
    return [...idSet].map((id) => {
      const order = ORDERS.find((o) => o.orderId === id);
      const orderPtds = ptds.filter((p) => p.orderId === id);
      return {
        orderId: id,
        customer: order?.customer ?? orderPtds[0]?.customer ?? '—',
        orderDate: order?.orderDate ?? orderPtds[0]?.updatedAt ?? '',
        value: order?.value ?? 0,
        orderStatus: order?.orderStatus ?? '—',
        ptds: orderPtds,
      };
    });
  }, [ptds]);

  const customers = useMemo(() => [...new Set(orders.map((o) => o.customer))], [orders]);

  const filtered = orders.filter((o) => {
    const haystack = `${o.orderId} ${o.customer} ${o.orderStatus} ${o.ptds.map((p) => `${p.id} ${p.serviceName}`).join(' ')}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (customer && o.customer !== customer) return false;
    if (orderStatus === 'Completed') {
      if (o.orderStatus !== 'Completed') return false;
    } else if (orderStatus !== 'All' && o.orderStatus === 'Completed') {
      return false;
    }
    return true;
  });

  const openDrawer = (id) => {
    const order = orders.find((o) => o.orderId === id);
    if (!order) return;
    clearTimeout(closeTimer.current);
    setActiveOrder(order);
    requestAnimationFrame(() => setIsOpen(true));
  };

  const closeDrawer = () => {
    setIsOpen(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveOrder(null), 300);
  };

  const summary = [
    { label: 'Total Orders', count: orders.length, color: 'bg-emerald-600', icon: 'orders' },
    { label: 'Total PTDs', count: ptds.length, color: 'bg-amber-500', icon: 'file' },
    { label: 'Completed', count: ptds.filter((p) => p.status === 'Completed').length, color: 'bg-emerald-500', icon: 'check' },
    { label: 'Draft', count: ptds.filter((p) => p.status === 'Draft').length, color: 'bg-blue-500', icon: 'clock' },
  ];

  const icons = {
    orders: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-5Z" />
        <path d="M4 7h16M9 12h6" />
      </svg>
    ),
    file: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4.5 4.5L19 7.5" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  };

  const inputCls = 'h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <Layout active="ptd">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">PTD</h1>
        <p className="mt-1 text-sm text-slate-500">Browse orders and manage the technical data sheets created under them.</p>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer, PTD, service..." className={`${inputCls} pl-9`} />
          </div>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls}>
            <option value="">All customers</option>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={inputCls}>
            <option value="">Active orders</option>
            <option value="Completed">Completed</option>
            <option value="All">All orders</option>
          </select>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3.5 py-2.5 font-semibold">Order</th>
                <th className="px-3.5 py-2.5 font-semibold">Customer</th>
                <th className="px-3.5 py-2.5 font-semibold">Order Date</th>
                <th className="px-3.5 py-2.5 font-semibold">Order Value</th>
                <th className="px-3.5 py-2.5 font-semibold">Order Status</th>
                <th className="px-3.5 py-2.5 font-semibold">PTD Count</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const created = o.ptds.length;
                return (
                  <Fragment key={o.orderId}>
                    <tr
                      onClick={() => openDrawer(o.orderId)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${created === 0 ? 'opacity-70' : ''}`}
                      title={created > 0 ? `View ${created} PTD${created === 1 ? '' : 's'} for ${o.orderId}` : `No PTDs for ${o.orderId}`}
                    >
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <span className="font-semibold text-emerald-700">{o.orderId}</span>
                      </td>
                      <td className="max-w-[200px] truncate px-3.5 py-2.5 text-slate-800">{o.customer}</td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-600">{o.orderDate ? fmtDate(o.orderDate) : '—'}</td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-slate-800">{o.value ? fmtINR(o.value) : '—'}</td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-700">{o.orderStatus}</td>
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${created > 0 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'}`}>
                          {created} {created === 1 ? 'PTD' : 'PTDs'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openDrawer(o.orderId); }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                          aria-label={`View PTDs for ${o.orderId}`}
                          title="View PTDs"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                            <path d="M14 2v6h6M9 13h6M9 17h6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-sm text-slate-400">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-[12px] text-slate-500">
          <span>Showing {filtered.length} of {orders.length} orders</span>
        </div>
      </div>

      {/* Drawer */}
      {activeOrder && <PtdDrawer order={activeOrder} open={isOpen} onClose={closeDrawer} />}
    </Layout>
  );
}

export default PtdList;