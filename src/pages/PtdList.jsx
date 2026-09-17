import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { usePtds } from '../store/ptdStore';
import { useAssignments } from '../store/assignmentStore';
import { PTD_TEMPLATES } from '../data/ptdTemplates';
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

function PtdModal({ ptd, order, hours, onClose }) {
  const navigate = useNavigate();
  const fields = PTD_TEMPLATES[ptd.template]?.fields ?? [];
  const values = fields.filter((f) => ptd.data?.[f.key]);

  const meta = [
    { label: 'Order', value: ptd.orderId },
    { label: 'Customer', value: ptd.customer },
    { label: 'Created', value: fmtDate(ptd.createdAt ?? ptd.updatedAt) },
    { label: 'Updated', value: fmtDate(ptd.updatedAt) },
    { label: 'Created By', value: ptd.createdBy ?? '—' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-slate-900">{ptd.id}</h3>
              <Badge status={ptd.status} />
            </div>
            <p className="mt-0.5 truncate text-[12.5px] text-slate-500">{ptd.serviceName} · {PTD_TEMPLATES[ptd.template]?.title ?? ptd.template}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            {meta.map((m) => (
              <div key={m.label}>
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">{m.label}</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{m.value}</p>
              </div>
            ))}
            <div key="hours">
              <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">Allocated Hours</p>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-800">{hours > 0 ? `${hours} hrs` : '—'}</p>
            </div>
            <div key="billing">
              <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">Billing</p>
              <p className="mt-0.5 text-[13px] font-semibold text-emerald-700">
                {ptd.billable === false ? 'Non-Billable' : fmtINR(ptd.price ?? 0)}
              </p>
            </div>
          </div>

          {/* Order strip */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Order Value</p>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-800">{order?.value ? fmtINR(order.value) : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Order Date</p>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-800">{order?.orderDate ? fmtDate(order.orderDate) : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Order Status</p>
              <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{order?.orderStatus ?? '—'}</p>
            </div>
          </div>

          {/* Data fields */}
          {values.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                {PTD_TEMPLATES[ptd.template]?.title ?? 'Technical Information'}
              </p>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {values.map((f) => (
                  <div key={f.key} className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-2">
                    <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">{f.label}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] font-medium text-slate-800">{ptd.data[f.key]}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 px-6 py-3.5">
          <button
            type="button"
            onClick={() => navigate(`/orders/${ptd.orderId}`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            View Order
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/ptd/${ptd.id}?edit=1`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12.5px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
              </svg>
              Edit PTD
            </button>
            <button
              type="button"
              onClick={() => navigate(`/ptd/${ptd.id}`)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Open Full Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PtdList() {
  const ptds = usePtds();
  const assignments = useAssignments();
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [viewing, setViewing] = useState(null);

  const allocatedFor = (orderId, serviceName) =>
    assignments.find((a) => a.orderId === orderId && a.serviceName === serviceName)?.allocatedHours ?? 0;

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
    if (orderStatus === 'Delivered') {
      if (o.orderStatus !== 'Delivered') return false;
    } else if (orderStatus !== 'All' && o.orderStatus === 'Delivered') {
      return false;
    }
    return true;
  });

  const toggleRow = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const activeOrder = orders.find((o) => o.orderId === viewing?.orderId);

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
            <option value="Delivered">Delivered</option>
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
                <th className="px-2 py-2 font-semibold">Order</th>
                <th className="px-2 py-2 font-semibold">Customer</th>
                <th className="px-2 py-2 font-semibold">Order Date</th>
                <th className="px-2 py-2 font-semibold">Order Value</th>
                <th className="px-2 py-2 font-semibold">Order Status</th>
                <th className="px-2 py-2 font-semibold">PTD Count</th>
                <th className="px-2 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const created = o.ptds.length;
                const expanded = expandedId === o.orderId;
                return (
                  <Fragment key={o.orderId}>
                    <tr
                      onClick={() => toggleRow(o.orderId)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${expanded ? 'bg-emerald-50/40' : ''} ${created === 0 ? 'opacity-70' : ''}`}
                      title={created > 0 ? `View ${created} PTD${created === 1 ? '' : 's'} for ${o.orderId}` : `No PTDs for ${o.orderId}`}
                    >
                      <td className="whitespace-nowrap px-2 py-2">
                        <span className="font-semibold text-emerald-700">{o.orderId}</span>
                      </td>
                      <td className="max-w-[200px] truncate px-2 py-2 text-slate-800">{o.customer}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-slate-600">{o.orderDate ? fmtDate(o.orderDate) : '—'}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">{o.value ? fmtINR(o.value) : '—'}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-slate-700">{o.orderStatus}</td>
                      <td className="whitespace-nowrap px-2 py-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${created > 0 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'}`}>
                          {created} {created === 1 ? 'PTD' : 'PTDs'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleRow(o.orderId); }}
                          aria-label={`${expanded ? 'Collapse' : 'Expand'} PTDs for ${o.orderId}`}
                          title={expanded ? 'Collapse PTDs' : 'Expand PTDs'}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-slate-100 last:border-0">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="ml-6 border-l-2 border-emerald-200 pl-5">
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                                      <path d="M14 2v6h6M9 13h6M9 17h6" />
                                    </svg>
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[13.5px] font-semibold text-slate-900">Technical Data Sheets</p>
                                    <p className="truncate text-[12px] text-slate-500">
                                      {o.orderId} · <span className="font-medium text-slate-600">{o.customer}</span>
                                    </p>
                                  </div>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                  {created} {created === 1 ? 'PTD' : 'PTDs'}
                                </span>
                              </div>
                              {created === 0 ? (
                                <p className="px-4 py-8 text-center text-[12.5px] text-slate-400">
                                  No PTDs created for this order yet.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[700px] text-left text-[12.5px]">
                                    <thead>
                                      <tr className="border-b border-slate-100 bg-slate-100/70 text-[10.5px] uppercase tracking-wider text-slate-500">
                                        <th className="px-4 py-2.5 font-semibold">PTD ID</th>
                                        <th className="px-4 py-2.5 font-semibold">Service</th>
                                        <th className="px-4 py-2.5 font-semibold">Status</th>
                                        <th className="px-4 py-2.5 font-semibold">Updated</th>
                                        <th className="px-4 py-2.5 text-right font-semibold">Hours</th>
                                        <th className="px-4 py-2.5 text-right font-semibold">Billable</th>
                                        <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {o.ptds.map((p) => {
                                        const hours = allocatedFor(p.orderId, p.serviceName);
                                        return (
                                          <tr
                                            key={p.id}
                                            onClick={() => setViewing(p)}
                                            className="cursor-pointer border-b border-slate-100 bg-white transition-colors last:border-0 hover:bg-emerald-50/30"
                                            title={`View details for ${p.id}`}
                                          >
                                            <td className="whitespace-nowrap px-4 py-2 font-semibold text-emerald-700">{p.id}</td>
                                            <td className="max-w-[220px] truncate px-4 py-2 text-slate-800">{p.serviceName}</td>
                                            <td className="whitespace-nowrap px-4 py-2"><Badge status={p.status} /></td>
                                            <td className="whitespace-nowrap px-4 py-2 text-slate-600">{fmtDate(p.updatedAt)}</td>
                                            <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600">{hours > 0 ? `${hours} hrs` : '—'}</td>
                                            <td className={`whitespace-nowrap px-4 py-2 text-right font-medium ${p.billable === false ? 'text-slate-400' : 'text-emerald-700'}`}>
                                              {p.billable === false ? 'Non-Billable' : fmtINR(p.price ?? 0)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-right">
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setViewing(p); }}
                                                aria-label={`View ${p.id}`}
                                                title="View details"
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                                              >
                                                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
                                                  <circle cx="12" cy="12" r="2.5" />
                                                </svg>
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-2 text-[11px] text-slate-400">
                                <span>Click a PTD row to view its full details.</span>
                                <span>{created} {created === 1 ? 'sheet' : 'sheets'} under {o.orderId}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
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

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-2 py-2 text-[12px] text-slate-500">
          <span>Showing {filtered.length} of {orders.length} orders</span>
        </div>
      </div>

      {/* Detail modal */}
      {viewing && (
        <PtdModal
          ptd={viewing}
          order={activeOrder}
          hours={allocatedFor(viewing.orderId, viewing.serviceName)}
          onClose={() => setViewing(null)}
        />
      )}
    </Layout>
  );
}

export default PtdList;