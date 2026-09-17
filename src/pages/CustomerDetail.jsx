import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { CUSTOMERS, ORDERS, PAYMENTS, ORDER_SERVICES, fmtINR, fmtDate } from '../data/mockData';
import { ORDER_STATUS_COLORS } from '../data/orderStatus';
import { usePtds } from '../store/ptdStore';
import { useAssignments } from '../store/assignmentStore';

const STATUS_COLORS = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Inactive: 'border-slate-200 bg-slate-100 text-slate-500',
  Lead: 'border-blue-200 bg-blue-50 text-blue-700',
  Suspended: 'border-red-200 bg-red-50 text-red-700',
};

const ASSIGNMENT_STATUS_COLORS = {
  Assigned: 'border-sky-200 bg-sky-50 text-sky-700',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'On Hold': 'border-orange-200 bg-orange-50 text-orange-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const PAYMENT_STATUS_COLORS = {
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Partially Paid': 'border-amber-200 bg-amber-50 text-amber-700',
  Unpaid: 'border-slate-200 bg-slate-100 text-slate-500',
  Overdue: 'border-red-200 bg-red-50 text-red-700',
  Refunded: 'border-slate-200 bg-slate-100 text-slate-500',
};

const PTD_STATUS_COLORS = {
  Draft: 'border-slate-200 bg-slate-100 text-slate-500',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const DOCUMENTS = [
  { name: 'Company Registration.pdf', type: 'Legal', size: '1.2 MB', uploadedOn: '2026-06-05' },
  { name: 'GST Certificate.pdf', type: 'Compliance', size: '640 KB', uploadedOn: '2026-06-05' },
  { name: 'Dealership Agreement.pdf', type: 'Legal', size: '2.4 MB', uploadedOn: '2026-09-05' },
];

const TABS = ['Overview', 'Orders', 'Services', 'History', 'Payments', 'Documents', 'Activity'];

function Badge({ cls, children }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function StatCard({ label, value, accent = false, warn = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-[20px] font-semibold ${warn ? 'text-amber-600' : accent ? 'text-emerald-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}

function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const ptds = usePtds();
  const assignments = useAssignments();

  const customer = useMemo(() => CUSTOMERS.find((c) => c.customerId === customerId), [customerId]);

  const data = useMemo(() => {
    if (!customer) return null;
    const orders = ORDERS.filter((o) => o.customer === customer.name);
    const payments = PAYMENTS.filter((p) => p.customer === customer.name);
    const received = payments.reduce((s, p) => s + p.amount, 0);
    const totalValue = orders.reduce((s, o) => s + o.value, 0);
    const completed = orders.filter((o) => o.orderStatus === 'Delivered').length;
    const customerPtds = ptds.filter((p) => p.customer === customer.name);
    const donePtds = customerPtds.filter((p) => p.status === 'Completed');
    const existingKeys = new Set();
    orders.forEach((o) =>
      (ORDER_SERVICES[o.orderId] ?? []).forEach((s) => existingKeys.add(`${o.orderId}|${s.name}`))
    );
    const serviceRows = [
      ...orders.flatMap((o) =>
        (ORDER_SERVICES[o.orderId] ?? []).map((s) => {
          const ptd = customerPtds.find((p) => p.orderId === o.orderId && p.serviceName === s.name);
          const asn = assignments.find((a) => a.orderId === o.orderId && a.serviceName === s.name);
          return { ...s, order: o, ptd, asn };
        })
      ),
      ...customerPtds
        .filter((p) => !existingKeys.has(`${p.orderId}|${p.serviceName}`))
        .map((p) => {
          const order = orders.find((o) => o.orderId === p.orderId) ?? { orderId: p.orderId, deliveryDate: p.updatedAt, value: p.price, orderStatus: p.status };
          const asn = assignments.find((a) => a.orderId === p.orderId && a.serviceName === p.serviceName);
          return { name: p.serviceName, order, ptd: p, asn, amount: p.price ?? 0, quantity: 1 };
        }),
    ];
    const worksDone = [
      ...donePtds.map((p) => ({ kind: 'PTD', id: p.id, service: p.serviceName, order: p.orderId, date: p.updatedAt, template: p.template, billable: p.billable, price: p.price ?? 0 })),
      ...assignments
        .filter((a) => a.customer === customer.name && a.status === 'Completed')
        .map((a) => ({ kind: 'Assignment', id: a.id, service: a.serviceName, order: a.orderId, date: a.assignedOn, template: a.assignedTo, billable: null, price: 0 })),
    ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return { orders, payments, received, totalValue, pending: Math.max(0, totalValue - received), completed, activeServices: donePtds.length, donePtds, serviceRows, worksDone };
  }, [customer, ptds, assignments]);

  // Activity timeline
  const activity = useMemo(() => {
    if (!customer || !data) return [];
    const events = [];
    for (const o of data.orders) {
      events.push({ date: o.orderDate, kind: 'order', text: `${o.orderId} received from Lead Soft`, sub: `${fmtINR(o.value)} · ${o.orderStatus}` });
    }
    for (const p of ptds.filter((p) => p.customer === customer.name && p.status === 'Completed')) {
      events.push({ date: p.updatedAt, kind: 'ptd', text: `${p.id} completed`, sub: `${p.serviceName} for ${p.orderId}` });
    }
    for (const a of assignments.filter((a) => a.customer === customer.name)) {
      events.push({ date: a.assignedOn, kind: 'assignment', text: `${a.id} assigned to ${a.assignedTo}`, sub: `${a.serviceName} · Due ${a.expectedDelivery ? fmtDate(a.expectedDelivery) : '—'}` });
    }
    for (const p of data.payments) {
      events.push({ date: p.date, kind: 'payment', text: `${fmtINR(p.amount)} payment received`, sub: `${p.paymentId} · ${p.method} · ${p.orderId}` });
    }
    return events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [customer, data, ptds, assignments]);

  const activeIcon = (p) => {
    const key = p.data?.domainName ?? p.data?.certDomain ?? (p.template === 'website' ? p.data?.projectName ?? 'Website' : p.data?.hostingPlan ?? p.serviceName);
    return { key, expiry: p.data?.expiryDate ?? p.data?.expectedCompletion ?? null, project: p.template === 'website' };
  };

  if (!customer || !data) {
    return (
      <Layout active="customers">
        <div className="p-6 text-[13px] text-slate-500">Customer not found. <button type="button" onClick={() => navigate('/customers')} className="text-emerald-600 hover:underline">Back to customers</button></div>
      </Layout>
    );
  }

  return (
    <Layout active="customers">
      <div className="p-6">
        {/* Header */}
        <button type="button" onClick={() => navigate('/customers')} className="mb-4 flex items-center gap-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Customers
        </button>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[16px] font-bold text-emerald-700">
                {customer.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[20px] font-bold text-slate-900">{customer.name}</h1>
                  <Badge cls="border-indigo-200 bg-indigo-50 text-indigo-700">{customer.type}</Badge>
                  <Badge cls={STATUS_COLORS[customer.status] ?? STATUS_COLORS.Inactive}>{customer.status}</Badge>
                </div>
                <p className="mt-1 text-[12.5px] text-slate-500">Customer ID: <span className="font-medium text-slate-700">{customer.customerId}</span></p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/ledger?customer=${encodeURIComponent(customer.name)}`)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3" />
              </svg>
              View Ledger
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 px-6 py-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Contact Person</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-700">{customer.contactPerson}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Phone</p>
              <p className="mt-0.5 text-[13px] text-slate-700">{customer.phone}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Email</p>
              <p className="mt-0.5 text-[13px] text-slate-700">{customer.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Customer Type</p>
              <p className="mt-0.5 text-[13px] text-slate-700">{customer.type}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {/* OVERVIEW */}
          {tab === 'Overview' && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Total Orders" value={data.orders.length} />
                <StatCard label="Total Order Value" value={fmtINR(data.totalValue)} accent />
                <StatCard label="Amount Received" value={fmtINR(data.received)} accent />
                <StatCard label="Amount Pending" value={fmtINR(data.pending)} warn={data.pending > 0} />
                <StatCard label="Active Services" value={data.activeServices} />
                <StatCard label="Completed Orders" value={`${data.completed} / ${data.orders.length}`} />
              </div>

              {data.donePtds.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Active Services</h2>
                      <p className="mt-0.5 text-[12px] text-slate-400">Completed technical assets and services currently active for this customer.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {data.donePtds.length} active
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3 font-semibold">Service</th>
                          <th className="px-4 py-3 font-semibold">Asset / Detail</th>
                          <th className="px-4 py-3 font-semibold">Order</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Expires / Completion</th>
                          <th className="px-4 py-3 text-right font-semibold">Billing</th>
                          <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.donePtds.map((p) => {
                          const { key, expiry, project } = activeIcon(p);
                          return (
                            <tr key={p.id} onClick={() => navigate(`/ptd/${p.id}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-emerald-50/40">
                              <td className="px-4 py-3 font-semibold text-slate-800">{p.serviceName}</td>
                              <td className="px-4 py-3 text-slate-600">{key}</td>
                              <td className="px-4 py-3 text-slate-500">{p.orderId}</td>
                              <td className="px-4 py-3"><Badge cls={PTD_STATUS_COLORS[p.status] ?? PTD_STATUS_COLORS.Draft}>{p.status}</Badge></td>
                              <td className="px-4 py-3 text-slate-500">{expiry ? fmtDate(expiry) : project ? p.status : '—'}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-700">{p.billable === false ? 'Non-Billable' : fmtINR(p.price ?? 0)}</td>
                              <td className="px-4 py-3 text-right">
                                <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/ptd/${p.id}`); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">View</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ORDERS */}
          {tab === 'Orders' && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Order Date</th>
                      <th className="px-4 py-3 font-semibold">Delivery</th>
                      <th className="px-4 py-3 text-right font-semibold">Value</th>
                      <th className="px-4 py-3 font-semibold">Order Status</th>
                      <th className="px-4 py-3 font-semibold">Payment</th>
                      <th className="px-4 py-3 font-semibold">Sales Person</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((o) => (
                      <tr key={o.orderId} onClick={() => navigate(`/orders/${o.orderId}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-emerald-50/40">
                        <td className="px-4 py-3 font-semibold text-slate-800">{o.orderId}</td>
                        <td className="px-4 py-3 text-slate-500">{fmtDate(o.orderDate)}</td>
                        <td className="px-4 py-3 text-slate-500">{fmtDate(o.deliveryDate)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">{fmtINR(o.value)}</td>
                        <td className="px-4 py-3"><Badge cls={ORDER_STATUS_COLORS[o.orderStatus] ?? ORDER_STATUS_COLORS.Pending}>{o.orderStatus}</Badge></td>
                        <td className="px-4 py-3"><Badge cls={PAYMENT_STATUS_COLORS[o.paymentStatus] ?? PAYMENT_STATUS_COLORS.Unpaid}>{o.paymentStatus}</Badge></td>
                        <td className="px-4 py-3 text-slate-600">{o.salesPerson}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderId}`); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SERVICES */}
          {tab === 'Services' && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Service</th>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Delivery</th>
                      <th className="px-4 py-3 font-semibold">Asset / Value</th>
                      <th className="px-4 py-3 font-semibold">PTD</th>
                      <th className="px-4 py-3 font-semibold">Assignment</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.serviceRows.map((s, i) => (
                      <tr key={`${s.order.orderId}-${s.name}-${i}`} onClick={() => navigate(`/orders/${s.order.orderId}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-emerald-50/40">
                        <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                        <td className="px-4 py-3 text-slate-500">{s.order.orderId}</td>
                        <td className="px-4 py-3 text-slate-500">{fmtDate(s.order.deliveryDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtINR(s.amount * s.quantity)}</td>
                        <td className="px-4 py-3">
                          {s.ptd
                            ? <Badge cls={PTD_STATUS_COLORS[s.ptd.status] ?? PTD_STATUS_COLORS.Draft}>{s.ptd.status}</Badge>
                            : <span className="text-[12px] text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {s.asn
                            ? <Badge cls={ASSIGNMENT_STATUS_COLORS[s.asn.status] ?? ASSIGNMENT_STATUS_COLORS.Assigned}>ASN · {s.asn.status}</Badge>
                            : <span className="text-[12px] text-slate-400">Not Assigned</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.quantity}</td>
                      </tr>
                    ))}
                    {data.serviceRows.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No services attached to this customer yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* HISTORY — work done */}
          {tab === 'History' && (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Works Completed" value={data.worksDone.length} accent />
                <StatCard label="Active Services" value={data.activeServices} />
                <StatCard label="Orders Completed" value={`${data.completed} / ${data.orders.length}`} />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
                  <div>
                    <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Work Done</h2>
                    <p className="mt-0.5 text-[12px] text-slate-400">All completed work for this customer — technical data sheets, assignments and more.</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {data.worksDone.length} completed
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 font-semibold">Work / Service</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Detail</th>
                        <th className="px-4 py-3 font-semibold">Completed On</th>
                        <th className="px-4 py-3 text-right font-semibold">Billing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.worksDone.map((w) => (
                        <tr key={`${w.kind}-${w.id}`} onClick={() => navigate(`/ptd/${w.id}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-emerald-50/40">
                          <td className="px-4 py-3 font-semibold text-slate-800">{w.service}</td>
                          <td className="px-4 py-3">
                            <Badge cls={w.kind === 'PTD' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}>{w.kind}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{w.order}</td>
                          <td className="px-4 py-3 text-slate-600">{w.template}</td>
                          <td className="px-4 py-3 text-slate-500">{fmtDate(w.date)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">
                            {w.billable === false ? 'Non-Billable' : w.price > 0 ? fmtINR(w.price) : '—'}
                          </td>
                        </tr>
                      ))}
                      {data.worksDone.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No completed work for this customer yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* PAYMENTS */}
          {tab === 'Payments' && (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Order Value" value={fmtINR(data.totalValue)} />
                <StatCard label="Total Received" value={fmtINR(data.received)} accent />
                <StatCard label="Outstanding" value={fmtINR(data.pending)} warn={data.pending > 0} />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 font-semibold">Payment ID</th>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Method</th>
                        <th className="px-4 py-3 text-right font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map((p) => (
                        <tr key={p.paymentId} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 font-medium text-slate-600">{p.paymentId}</td>
                          <td className="px-4 py-3 text-slate-700">{p.orderId}</td>
                          <td className="px-4 py-3 text-slate-500">{fmtDate(p.date)}</td>
                          <td className="px-4 py-3 text-slate-600">{p.method}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtINR(p.amount)}</td>
                          <td className="px-4 py-3"><Badge cls="border-emerald-200 bg-emerald-50 text-emerald-700">{p.status}</Badge></td>
                        </tr>
                      ))}
                      {data.payments.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No payments recorded for this customer yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* DOCUMENTS */}
          {tab === 'Documents' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Customer Documents</h2>
                <button type="button" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100">Upload Document</button>
              </div>
              <p className="mt-1 text-[12px] text-slate-400">Contracts, agreements, KYC and customer-provided documents live here. Order-specific documents stay attached to the order.</p>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                {DOCUMENTS.map((d) => (
                  <div key={d.name} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-red-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{d.name}</p>
                        <p className="text-[11.5px] text-slate-400">{d.type} · {d.size} · Uploaded {fmtDate(d.uploadedOn)}</p>
                      </div>
                    </div>
                    <button type="button" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">Download</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {tab === 'Activity' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-slate-500">Activity History</h2>
              <div className="space-y-0">
                {activity.map((e, i) => {
                  const dot = e.kind === 'ptd' ? 'bg-emerald-500' : e.kind === 'assignment' ? 'bg-blue-500' : e.kind === 'payment' ? 'bg-teal-500' : 'bg-slate-400';
                  return (
                    <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < activity.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-200" />}
                      <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${dot}`} />
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{e.text}</p>
                        <p className="text-[12px] text-slate-400">{fmtDate(e.date)} · {e.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default CustomerDetail;