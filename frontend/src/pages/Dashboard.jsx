import Layout from '../layouts/Layout';
import { useRenewables, getRenewalStatus } from '../store/renewableStore';
import { usePayments } from '../store/paymentStore';
import { ORDERS, CUSTOMERS, fmtINR, fmtDate } from '../data/mockData';
import { ORDER_STATUSES as ORDER_STATUS_ORDER, isActiveOrder } from '../data/orderStatus';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#0ea5e9', '#f97316'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const compactINR = (v) => (Math.abs(v) >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`);

const todayISO = () => new Date().toISOString().slice(0, 10);

const PAYMENT_STATUS_ORDER = ['Paid', 'Partially Paid', 'Unpaid', 'Overdue', 'Refunded'];

function StatCard({ label, value, sub, icon, tone }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    sky: 'bg-sky-100 text-sky-600',
    red: 'bg-red-100 text-red-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 truncate text-[17px] font-semibold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-[10.5px] text-slate-400">{sub}</p>}
        </div>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}>{icon}</span>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className ?? ''}`}>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Dashboard() {
  const renewals = useRenewables();
  const payments = usePayments();
  const t = todayISO();

  const revenueOrders = ORDERS.filter((o) => o.orderStatus !== 'Cancelled');
  const booked = revenueOrders.reduce((s, o) => s + o.value, 0);

  const receivedPayments = payments.filter((p) => p.status !== 'Refunded' && p.status !== 'Failed');
  const receivedByOrder = receivedPayments.reduce((acc, p) => {
    acc[p.orderId] = (acc[p.orderId] || 0) + (Number(p.amount) || 0);
    return acc;
  }, {});
  const collected = receivedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const pendingFor = (o) => Math.max(0, o.value - (receivedByOrder[o.orderId] || 0));
  const outstanding = revenueOrders.reduce((s, o) => s + pendingFor(o), 0);
  const overdueOrders = revenueOrders.filter((o) => pendingFor(o) > 0 && o.deliveryDate < t);
  const overdue = overdueOrders.reduce((s, o) => s + pendingFor(o), 0);

  const activeOrders = ORDERS.filter((o) => isActiveOrder(o.orderStatus)).length;
  const deliveredOrders = ORDERS.filter((o) => o.orderStatus === 'Delivered').length;
  const activeCustomers = CUSTOMERS.filter((c) => c.status === 'Active').length;
  const avgOrderValue = revenueOrders.length ? Math.round(booked / revenueOrders.length) : 0;

  const branded = renewals.map((r) => ({ ...r, status: getRenewalStatus(r) }));
  const renewalsDue = branded.filter((r) => r.status.key !== 'Active').length;

  const monthBookings = {};
  revenueOrders.forEach((o) => {
    const m = o.orderDate.slice(0, 7);
    monthBookings[m] = (monthBookings[m] || 0) + o.value;
  });
  const bookingsData = Object.entries(monthBookings)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => {
      const [y, mo] = m.split('-');
      return { month: `${MONTHS[+mo - 1]} ${y.slice(2)}`, value: v };
    });

  const statusCount = {};
  ORDERS.forEach((o) => { statusCount[o.orderStatus] = (statusCount[o.orderStatus] || 0) + 1; });
  const statusData = Object.entries(statusCount)
    .sort(([a], [b]) => ORDER_STATUS_ORDER.indexOf(a) - ORDER_STATUS_ORDER.indexOf(b))
    .map(([name, value]) => ({ name, value }));

  const salesData = Object.entries(
    revenueOrders.reduce((acc, o) => { acc[o.salesPerson] = (acc[o.salesPerson] || 0) + o.value; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const payCount = {};
  ORDERS.forEach((o) => { payCount[o.paymentStatus] = (payCount[o.paymentStatus] || 0) + 1; });
  const payData = Object.entries(payCount)
    .sort(([a], [b]) => PAYMENT_STATUS_ORDER.indexOf(a) - PAYMENT_STATUS_ORDER.indexOf(b))
    .map(([name, value]) => ({ name, value }));

  const customerData = Object.entries(
    revenueOrders.reduce((acc, o) => { acc[o.customer] = (acc[o.customer] || 0) + o.value; return acc; }, {})
  ).map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 17) + '…' : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const typeCount = {};
  branded.forEach((r) => { typeCount[r.type] = (typeCount[r.type] || 0) + 1; });
  const renewData = Object.entries(typeCount).map(([name, count]) => ({ name, count }));

  const upcoming = ORDERS
    .filter((o) => isActiveOrder(o.orderStatus) && o.deliveryDate >= t)
    .sort((a, b) => (a.deliveryDate < b.deliveryDate ? -1 : 1))
    .slice(0, 5);

  const urgentRenewals = branded
    .filter((r) => r.status.key !== 'Active')
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1))
    .slice(0, 5);

  const moneyTooltip = (v) => [fmtINR(v), ''];
  const legendStyle = { fontSize: 12, fontFamily: 'inherit' };

  return (
    <Layout active="dashboard">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Business overview — orders, revenue, renewals and delivery pipeline.</p>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard
          label="Total Booked"
          value={fmtINR(booked)}
          sub={`${revenueOrders.length} orders (excl. cancelled)`}
          tone="emerald"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M15.5 9.5a3 3 0 0 0-3-2h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 1 0 5h-1a3 3 0 0 1-3-2" /></svg>}
        />
        <StatCard
          label="Collected"
          value={fmtINR(collected)}
          sub={`${receivedPayments.length} payment${receivedPayments.length === 1 ? '' : 's'} received`}
          tone="sky"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4.5 4.5L19 7.5" /></svg>}
        />
        <StatCard
          label="Outstanding"
          value={fmtINR(outstanding)}
          sub="due from customers"
          tone="red"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>}
        />
        <StatCard
          label="Overdue"
          value={fmtINR(overdue)}
          sub={`${overdueOrders.length} order${overdueOrders.length === 1 ? '' : 's'} past delivery date`}
          tone="amber"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>}
        />
        <StatCard
          label="Active Orders"
          value={activeOrders}
          sub={`${deliveredOrders} delivered`}
          tone="blue"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></svg>}
        />
        <StatCard
          label="Customers"
          value={CUSTOMERS.length}
          sub={`${activeCustomers} active`}
          tone="violet"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 11a3.5 3.5 0 0 0 0-6.5M16 17a6.5 6.5 0 0 1 5.5 3" /></svg>}
        />
        <StatCard
          label="Renewals Due"
          value={renewalsDue}
          sub="expiring ≤30 days"
          tone="amber"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>}
        />
        <StatCard
          label="Avg. Order Value"
          value={fmtINR(avgOrderValue)}
          sub={`across ${revenueOrders.length} orders`}
          tone="blue"
          icon={<svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /><path d="M17 8h4v4" /></svg>}
        />
      </div>

      {/* Charts row 1 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Orders per Month" subtitle="Order value booked per month" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tickFormatter={compactINR} tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={56} />
                <Tooltip formatter={moneyTooltip} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="value" name="Booked" stroke="#10b981" strokeWidth={2.5} fill="url(#bookingsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Order Status" subtitle="Distribution by pipeline stage">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                  {statusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12.5, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Orders by Salesperson" subtitle="Order value per salesperson" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={compactINR} tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={moneyTooltip} cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" name="Booked" radius={[0, 6, 6, 0]}>
                  {salesData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Payment Status" subtitle="Orders by payment status">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                  {payData.map((_, i) => <Cell key={i} fill={PALETTE[(i + 2) % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12.5, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Top Customers" subtitle="Orders value by customer" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={compactINR} tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={moneyTooltip} cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" name="Booked" radius={[0, 6, 6, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Renewals by Type" subtitle="Tracked renewals per category">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={renewData} margin={{ top: 0, right: 8, left: -18, bottom: 0 }} barSize={34}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" name="Items" radius={[6, 6, 0, 0]}>
                  {renewData.map((_, i) => <Cell key={i} fill={PALETTE[(i + 4) % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Lists row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Upcoming Deliveries</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {upcoming.length === 0 && <p className="px-5 py-8 text-center text-[12.5px] text-slate-400">No upcoming deliveries.</p>}
            {upcoming.map((o) => (
              <div key={o.orderId} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-800">{o.customer}</p>
                  <p className="text-[11.5px] text-slate-400">{o.orderId} · {o.orderStatus}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-slate-800">{fmtINR(o.value)}</p>
                  <p className="text-[11.5px] text-emerald-600">{fmtDate(o.deliveryDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Renewals Needing Attention</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {urgentRenewals.length === 0 && <p className="px-5 py-8 text-center text-[12.5px] text-slate-400">All renewals are healthy.</p>}
            {urgentRenewals.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-800">{r.name}</p>
                  <p className="text-[11.5px] text-slate-400">{r.type} · {r.customer}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[12px] font-medium ${r.status.key === 'Overdue' ? 'text-red-600' : 'text-amber-600'}`}>{r.status.key}</p>
                  <p className="text-[11.5px] text-slate-400">{fmtDate(r.expiryDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;