import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { ORDERS, ORDER_SERVICES, fmtINR, fmtDate } from '../data/mockData';
import { useServices, getServiceByName } from '../store/serviceStore';
import { useEmployees } from '../store/employeeStore';
import { useDepartments } from '../store/departmentStore';
import { getPtdFor, createOrUpdatePtd, deletePtdFor } from '../store/ptdStore';
import { getAssignmentFor, createAssignment, deleteAssignmentFor } from '../store/assignmentStore';
import { usePayments, getOrderPaymentSummary, createPayment } from '../store/paymentStore';
import { usePaymentPlans, getPlanView, createPaymentPlan } from '../store/paymentPlanStore';
import { useInvoices, getInvoicesFor, saveInvoice, getInvoiceStatus } from '../store/invoiceStore';
import { createOrSyncDelivery, deleteDeliveryFor } from '../store/deliveryStore';
import { usePaymentMethods } from '../store/paymentMethodStore';
import { useTaxMaster } from '../store/taxStore';
import { useAuth } from '../store/authStore';
import PtdFields from '../components/PtdFields';

const SERVICE_STATUS = {
  'Not Started': 'border-slate-200 bg-slate-100 text-slate-600',
  Assigned: 'border-sky-200 bg-sky-50 text-sky-700',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'On Hold': 'border-orange-200 bg-orange-50 text-orange-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
  Overdue: 'border-red-200 bg-red-50 text-red-700',
};

const PTD_STATUS = {
  'Not Required': 'border-slate-200 bg-slate-100 text-slate-400',
  'Not Created': 'border-slate-200 bg-slate-100 text-slate-600',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const PAYMENT_STATUS = {
  Unpaid: 'border-slate-200 bg-slate-100 text-slate-600',
  'Partially Paid': 'border-amber-200 bg-amber-50 text-amber-700',
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Overpaid: 'border-violet-200 bg-violet-50 text-violet-700',
};

const PAYMENT_TXN_STATUS = {
  Received: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Failed: 'border-red-200 bg-red-50 text-red-700',
  Refunded: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const PAYMENT_STAGE_STATUS = {
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Partial: 'border-amber-200 bg-amber-50 text-amber-700',
  Pending: 'border-slate-200 bg-slate-100 text-slate-600',
};

const PLAN_TYPES = ['Full Advance', 'Partial Advance', 'Milestone', 'Monthly / Recurring', 'Custom'];

const STAGE_TEMPLATE = {
  'Full Advance': ['Full Payment'],
  'Partial Advance': ['Advance', 'Balance'],
  Milestone: ['Advance', 'Milestone 1', 'Final Payment'],
  'Monthly / Recurring': ['Monthly Installment'],
  Custom: ['Stage 1'],
};

const INVOICE_TYPES = ['Advance', 'Milestone', 'Final', 'Full Invoice', 'Recurring'];

const TERMS = { 'Due on Receipt': 0, 'Net 7': 7, 'Net 15': 15, 'Net 30': 30 };

const INVOICE_STATUS = {
  Draft: 'border-slate-200 bg-slate-100 text-slate-600',
  Issued: 'border-sky-200 bg-sky-50 text-sky-700',
  Sent: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  'Partially Paid': 'border-amber-200 bg-amber-50 text-amber-700',
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Overdue: 'border-red-200 bg-red-50 text-red-700',
  Cancelled: 'border-slate-200 bg-slate-50 text-slate-400',
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (d, n) => {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

function Badge({ status, map }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{children}</span>
    </div>
  );
}

function PtdModal({ order, service, onClose, onSave }) {
  const services = useServices();
  const catalog = services.find((c) => c.name === service.name);
  const template = catalog?.template ?? 'generic';
  const [mode, setMode] = useState(service.ptd?.status === 'Completed' ? 'view' : 'edit');
  const [form, setForm] = useState({ ...(service.ptd?.data ?? {}) });
  const [billable, setBillable] = useState(service.ptd?.billable ?? true);
  const [price, setPrice] = useState(service.ptd?.price ?? service.price ?? catalog?.price ?? 0);

  const save = (targetStatus) => onSave(service.id, targetStatus, form, billable, price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">
              {mode === 'view' ? 'PTD' : 'Create PTD'}
            </h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
            <span>Order: <span className="font-medium text-slate-700">{order.orderId}</span></span>
            <span>Customer: <span className="font-medium text-slate-700">{order.customer}</span></span>
            <span>Service: <span className="font-medium text-slate-700">{service.name}</span></span>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <label className="mb-1 block text-[12px] font-medium text-slate-600">Billing</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBillable(true)}
                disabled={mode === 'view'}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  billable ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12h7M12 8.5v7" />
                </svg>
                Billable
              </button>
              <button
                type="button"
                onClick={() => setBillable(false)}
                disabled={mode === 'view'}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  !billable ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12h7" />
                </svg>
                Non-Billable
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {billable ? 'This PTD will be included in invoices for the order.' : 'This PTD will be excluded from invoices for the order.'}
            </p>
          </div>
          {billable && (
            <div className="mb-4">
              <label htmlFor="ptd-price" className="mb-1 block text-[12px] font-medium text-slate-600">Price (₹) <span className="text-red-400">*</span></label>
              <input
                id="ptd-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={mode === 'view'}
                placeholder="0"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">Price charged to the customer for this service ({catalog?.name ?? service.name} default).</p>
            </div>
          )}
          <PtdFields
            template={template}
            values={form}
            readOnly={mode === 'view'}
            onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          {mode === 'view' ? (
            <>
              <button type="button" onClick={() => setMode('edit')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Edit
              </button>
              <button type="button" onClick={onClose} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                Done
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={() => save('Draft')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                Save Draft
              </button>
              <button type="button" onClick={() => save('Completed')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                Complete PTD
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignModal({ order, service, assigner, onClose, onAssign }) {
  const employees = useEmployees();
  const departments = useDepartments();
  const defaultHours = getServiceByName(service.name)?.hours ?? 0;
  const [employee, setEmployee] = useState('');
  const [team, setTeam] = useState('');
  const [assignedOn, setAssignedOn] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDelivery, setExpectedDelivery] = useState(service.deliveryDate || order.deliveryDate || '');
  const [estimatedHours, setEstimatedHours] = useState(defaultHours);
  const [allocatedHours, setAllocatedHours] = useState(defaultHours);
  const [priority, setPriority] = useState('Normal');
  const [instructions, setInstructions] = useState('');

  const valid = employee && team && assignedOn && expectedDelivery;

  const onPickEmployee = (name) => {
    setEmployee(name);
    const emp = employees.find((e) => e.name === name);
    if (emp) setTeam(`${emp.department} Team`);
  };

  const submit = () => {
    if (!valid) return;
    onAssign(service.id, { assignedTo: employee, assignedTeam: team, assignedOn, expectedDelivery, estimatedHours: Number(estimatedHours) || 0, allocatedHours: Number(allocatedHours) || 0, priority, instructions });
  };

  const fieldCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Assign Service</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="mt-2 space-y-0.5 text-[12px] text-slate-500">
            <div>Order: <span className="font-medium text-slate-700">{order.orderId}</span></div>
            <div>Customer: <span className="font-medium text-slate-700">{order.customer}</span></div>
            <div>Service: <span className="font-medium text-slate-700">{service.name}</span></div>
            {service.ptd && service.ptd.status === 'Completed' && (
              <div>
                PTD: <span className="font-medium text-emerald-700">{service.ptd.id}</span>{' '}
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">✓ Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div>
              <label htmlFor="asn-employee" className="mb-1 block text-[12px] font-medium text-slate-600">Assign To <span className="text-red-400">*</span></label>
              <select id="asn-employee" value={employee} onChange={(e) => onPickEmployee(e.target.value)} className={fieldCls}>
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.name} value={e.name}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="asn-team" className="mb-1 block text-[12px] font-medium text-slate-600">Assigned Team <span className="text-red-400">*</span></label>
              <select id="asn-team" value={team} onChange={(e) => setTeam(e.target.value)} className={fieldCls}>
                <option value="">Select Team</option>
                {departments.map((d) => <option key={d} value={`${d} Team`}>{d} Team</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="asn-assignedon" className="mb-1 block text-[12px] font-medium text-slate-600">Assigned On <span className="text-red-400">*</span></label>
              <input id="asn-assignedon" type="date" value={assignedOn} onChange={(e) => setAssignedOn(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="asn-expected" className="mb-1 block text-[12px] font-medium text-slate-600">Expected Completion <span className="text-red-400">*</span></label>
              <input id="asn-expected" type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="asn-priority" className="mb-1 block text-[12px] font-medium text-slate-600">Priority</label>
              <select id="asn-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className={fieldCls}>
                {['Low', 'Normal', 'High', 'Urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="asn-estimate" className="mb-1 block text-[12px] font-medium text-slate-600">Estimated Hours</label>
              <div className="relative">
                <input id="asn-estimate" type="number" step="0.5" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className={`${fieldCls} pr-9`} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">hrs</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Default from Service Master</p>
            </div>
            <div>
              <label htmlFor="asn-allocated" className="mb-1 block text-[12px] font-medium text-slate-600">Allocated Hours</label>
              <div className="relative">
                <input id="asn-allocated" type="number" step="0.5" min="0" value={allocatedHours} onChange={(e) => setAllocatedHours(e.target.value)} className={`${fieldCls} pr-9`} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">hrs</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Hours the assignee is committed to</p>
            </div>
          </div>
          <div className="mt-3.5">
            <label htmlFor="asn-instructions" className="mb-1 block text-[12px] font-medium text-slate-600">Instructions</label>
            <textarea id="asn-instructions" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Notes for the assignee..."
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="mt-3.5 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
            Assigning as: <span className="font-medium text-slate-700">{assigner.name}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={!valid} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ order, plan, onClose, onSave }) {
  const [name, setName] = useState(plan?.name ?? 'Payment Plan');
  const [type, setType] = useState(plan?.type ?? 'Milestone');
  const [stages, setStages] = useState(() =>
    plan
      ? plan.stages.map((s) => ({ title: s.title, amount: String(s.amount), dueDate: s.dueDate }))
      : (STAGE_TEMPLATE[plan?.type] ?? STAGE_TEMPLATE.Milestone).map((title) => ({ title, amount: '', dueDate: '' }))
  );

  const pickType = (t) => {
    setType(t);
    const titles = STAGE_TEMPLATE[t] ?? ['Stage 1'];
    setStages(titles.map((title) => ({ title, amount: t === 'Full Advance' ? String(order.value) : '', dueDate: '' })));
  };

  const setStage = (i, patch) => setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addStage = () => setStages((prev) => [...prev, { title: `Stage ${prev.length + 1}`, amount: '', dueDate: '' }]);
  const removeStage = (i) => setStages((prev) => prev.filter((_, idx) => idx !== i));

  const scheduleTotal = stages.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const overBudget = scheduleTotal > order.value;
  const valid = stages.length > 0 && stages.every((s) => s.title.trim() && Number(s.amount) > 0 && s.dueDate) && !overBudget;

  const submit = () => {
    if (!valid) return;
    onSave({
      name: name.trim() || 'Payment Plan',
      type,
      stages: stages.map((s) => ({ title: s.title.trim(), amount: Number(s.amount), dueDate: s.dueDate })),
    });
  };

  const fieldCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">
              {plan ? 'Edit Payment Plan' : 'Create Payment Plan'}
            </h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{order.orderId} · {order.customer}</p>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div>
              <label htmlFor="sch-name" className="mb-1 block text-[12px] font-medium text-slate-600">Plan Name</label>
              <input id="sch-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard 3-Stage Plan" className={fieldCls} />
            </div>
            <div>
              <label htmlFor="sch-type" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Plan Type</label>
              <select id="sch-type" value={type} onChange={(e) => pickType(e.target.value)} className={fieldCls}>
                {PLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {(type === 'Monthly / Recurring' || type === 'Custom') && (
            <p className="mt-2 text-[12px] text-slate-400">
              {type === 'Monthly / Recurring'
                ? 'Recurring plan — enter the monthly installment amount and the date the first installment is due. Add an installment row for each payment.'
                : 'Custom plan — define any stages you like.'}
            </p>
          )}

          <div className="mt-5">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">Stages</p>
            <div className="space-y-2.5">
              {stages.map((st, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label className={`mb-1 block text-[11px] font-medium text-slate-400 ${i > 0 ? 'invisible' : ''}`}>Stage Title</label>
                    <input type="text" value={st.title} onChange={(e) => setStage(i, { title: e.target.value })} placeholder="e.g. Advance" className={fieldCls} />
                  </div>
                  <div className="w-28 shrink-0">
                    <label className={`mb-1 block text-[11px] font-medium text-slate-400 ${i > 0 ? 'invisible' : ''}`}>Amount</label>
                    <div className="relative">
                      <input type="number" step="1" min="0" value={st.amount} onChange={(e) => setStage(i, { amount: e.target.value })} placeholder="0" className={`${fieldCls} pr-7`} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">₹</span>
                    </div>
                  </div>
                  <div className="w-40 shrink-0">
                    <label className={`mb-1 block text-[11px] font-medium text-slate-400 ${i > 0 ? 'invisible' : ''}`}>Due Date</label>
                    <input type="date" value={st.dueDate} onChange={(e) => setStage(i, { dueDate: e.target.value })} className={fieldCls} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStage(i)}
                    aria-label={`Remove ${st.title || 'stage'}`}
                    title="Remove stage"
                    className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-300 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStage}
              className="mt-2.5 flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Stage
            </button>
          </div>

          <p className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
            Schedule total: <span className="font-semibold text-slate-700">{fmtINR(scheduleTotal)}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            Order value: <span className="font-semibold text-slate-700">{fmtINR(order.value)}</span>
            {overBudget && (
              <span className="ml-1 block font-medium text-red-600">Exceeds the order's billable amount — reduce stage amounts to save.</span>
            )}
            {!overBudget && scheduleTotal !== order.value && (
              <span className="ml-1 text-amber-600">(less than order value)</span>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Payment Plan
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ order, summary, user, plan, onClose, onRecord }) {
  const paymentMethods = usePaymentMethods();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [receivedBy, setReceivedBy] = useState(user.name);
  const [notes, setNotes] = useState('');
  const [stage, setStage] = useState(() => plan?.stages.find((s) => s.status !== 'Paid')?.title ?? '');

  const valid = Number(amount) > 0 && date && method;

  const submit = () => {
    if (!valid) return;
    onRecord({ amount: Number(amount), date, method, reference, receivedBy, notes, planStage: stage || null });
  };

  const fieldCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Record Payment</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{order.orderId} · {order.customer}</p>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Order Amount</p>
              <p className="mt-0.5 text-[15px] font-semibold text-slate-800">{fmtINR(summary.orderValue)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Already Received</p>
              <p className="mt-0.5 text-[15px] font-semibold text-emerald-700">{fmtINR(summary.received)}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600">Amount Pending</p>
            <p className="mt-0.5 text-[15px] font-semibold text-amber-700">{fmtINR(summary.pending)}</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div>
              <label htmlFor="pm-amount" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Amount <span className="text-red-400">*</span></label>
              <div className="relative">
                <input id="pm-amount" type="number" step="1" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${fieldCls} pr-8`} />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">₹</span>
              </div>
            </div>
            <div>
              <label htmlFor="pm-date" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Date <span className="text-red-400">*</span></label>
              <input id="pm-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="pm-method" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Method <span className="text-red-400">*</span></label>
              <select id="pm-method" value={method} onChange={(e) => setMethod(e.target.value)} className={fieldCls}>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pm-ref" className="mb-1 block text-[12px] font-medium text-slate-600">Transaction / Reference No.</label>
              <input id="pm-ref" type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN-XXXXXXXX" className={fieldCls} />
            </div>
            <div>
              <label htmlFor="pm-receivedby" className="mb-1 block text-[12px] font-medium text-slate-600">Received By</label>
              <input id="pm-receivedby" type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={fieldCls} />
            </div>
          </div>
          {plan && (
            <div className="mt-3.5">
              <label htmlFor="pm-stage" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Schedule Stage</label>
              <select id="pm-stage" value={stage} onChange={(e) => setStage(e.target.value)} className={fieldCls}>
                <option value="">General payment (not linked to a stage)</option>
                {plan.stages.map((s) => (
                  <option key={s.stageId} value={s.title}>{s.title} · {s.status}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">Links this payment to a stage on the payment schedule.</p>
            </div>
          )}
          <div className="mt-3.5">
            <label htmlFor="pm-notes" className="mb-1 block text-[12px] font-medium text-slate-600">Notes</label>
            <textarea id="pm-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Remarks in the reference, if any..." className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="mt-3.5 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
            This payment will be marked as <span className="font-medium text-emerald-700">Received</span> and linked to {order.orderId}.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ order, services, plan, existingInvoiced, onClose, onSave }) {
  const taxRecords = useTaxMaster();
  const [invoiceType, setInvoiceType] = useState('Full Invoice');
  const [stage, setStage] = useState(plan?.stages[0]?.title ?? '');
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDaysISO(todayISO(), 7));
  const [terms, setTerms] = useState('Net 7');
  const [taxRate, setTaxRate] = useState('0');
  const [discount, setDiscount] = useState('');

  const invoiceServices = services.filter((s) => Number(s.price) > 0);
  const subtotal = invoiceServices.reduce((s, x) => s + x.price, 0);
  const discountVal = Number(discount) || 0;
  const tax = Math.round(((subtotal - discountVal) * (Number(taxRate) || 0)) / 100);
  const total = subtotal - discountVal + tax;
  const remaining = Math.max(0, order.value - existingInvoiced);
  const over = total > remaining;

  const pickTerms = (t) => {
    setTerms(t);
    setDueDate(addDaysISO(invoiceDate, TERMS[t] ?? 7));
  };

  const valid = invoiceServices.length > 0 && invoiceDate && dueDate && !over;

  const submit = (status) => {
    if (!valid) return;
    onSave(
      {
        orderId: order.orderId,
        customer: order.customer,
        invoiceType,
        planId: plan?.planId ?? null,
        planStage: plan && stage ? stage : null,
        invoiceDate,
        dueDate,
        paymentTerms: terms,
        taxRate: Number(taxRate) || 0,
        items: invoiceServices.map((s) => ({
          name: s.name,
          quantity: 1,
          price: s.price,
          discount: 0,
          taxRate: Number(taxRate) || 0,
          amount: s.price,
        })),
        subtotal,
        discount: discountVal,
        tax,
        total,
        notes: '',
      },
      status
    );
  };

  const fieldCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Generate Invoice</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{order.orderId} · {order.customer} · Billable amount {fmtINR(remaining)}</p>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          {invoiceServices.length < services.length && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
              {services.length - invoiceServices.length} non-billable / unpriced service{services.length - invoiceServices.length > 1 ? 's' : ''} ({services
                .filter((s) => Number(s.price) <= 0)
                .map((s) => s.name)
                .join(', ')}) excluded from this invoice — mark them Billable with a price in their PTD to bill them.
            </div>
          )}
          {/* Invoice type */}
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">Invoice Type</p>
          <div className="flex flex-wrap gap-2">
            {INVOICE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInvoiceType(t)}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  invoiceType === t
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Schedule + dates */}
          <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <div>
              <label htmlFor="inv-stage" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Schedule</label>
              {plan ? (
                <select id="inv-stage" value={stage} onChange={(e) => setStage(e.target.value)} className={fieldCls}>
                  {plan.stages.map((s) => (
                    <option key={s.stageId} value={s.title}>{s.title} · {fmtINR(s.amount)}</option>
                  ))}
                </select>
              ) : (
                <div className="flex h-9 items-center rounded-lg border border-dashed border-slate-300 px-2.5 text-[12px] text-slate-400">
                  No payment plan — bill services directly
                </div>
              )}
            </div>
            <div>
              <label htmlFor="inv-date" className="mb-1 block text-[12px] font-medium text-slate-600">Invoice Date <span className="text-red-400">*</span></label>
              <input id="inv-date" type="date" value={invoiceDate} onChange={(e) => { setInvoiceDate(e.target.value); setDueDate(addDaysISO(e.target.value, TERMS[terms] ?? 7)); }} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="inv-due" className="mb-1 block text-[12px] font-medium text-slate-600">Due Date <span className="text-red-400">*</span></label>
              <input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldCls} />
            </div>
          </div>

          {/* Items */}
          <div className="mt-5">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">Items (from order)</p>
            {services.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-[12.5px] text-slate-400">
                No services on this order yet — add services before generating an invoice.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Service</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">1</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{fmtINR(s.price)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">{fmtINR(s.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals / tax / discount / terms */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="inv-terms" className="mb-1 block text-[12px] font-medium text-slate-600">Payment Terms</label>
              <select id="inv-terms" value={terms} onChange={(e) => pickTerms(e.target.value)} className={fieldCls}>
                {Object.keys(TERMS).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="inv-tax" className="mb-1 block text-[12px] font-medium text-slate-600">Tax Rate</label>
                <select id="inv-tax" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={fieldCls}>
                  <option value="0">No Tax (0%)</option>
                  {taxRecords.map((t) => <option key={t.name} value={t.rate}>{t.name} ({t.rate}%)</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="inv-discount" className="mb-1 block text-[12px] font-medium text-slate-600">Discount (₹)</label>
                <input id="inv-discount" type="number" step="1" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className={fieldCls} />
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-[13px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-800">{fmtINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="font-medium text-slate-800">− {fmtINR(discountVal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({taxRate}%)</span>
              <span className="font-medium text-slate-800">{fmtINR(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-[15px] font-semibold text-slate-900">
              <span>Total</span>
              <span>{fmtINR(total)}</span>
            </div>
            {over && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
                Total exceeds the remaining billable amount ({fmtINR(remaining)}) — reduce tax or discount, or adjust the order value.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submit('Draft')}
            disabled={!valid}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => submit('Issued')}
            disabled={!valid}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const order = ORDERS.find((o) => o.orderId === orderId);
  const user = useAuth();
  const payments = usePayments();
  const pSummary = getOrderPaymentSummary(orderId);
  const planView = useMemo(() => getPlanView(orderId, payments), [payments, orderId]);
  usePaymentPlans();
  useInvoices();
  const catalog = useServices();

  const initialServices = (ORDER_SERVICES[order?.orderId] ?? []).map((s) => {
    const ptd = getPtdFor(order?.orderId, s.name);
    const asn = getAssignmentFor(order?.orderId, s.name);
    return {
      ...s,
      ...(ptd ? { ptdStatus: ptd.status, price: ptd.billable ? ptd.price ?? 0 : 0, ptd: { id: ptd.id, status: ptd.status, data: ptd.data, billable: ptd.billable, price: ptd.billable ? ptd.price ?? 0 : 0 } } : {}),
      ...(asn ? { assignment: asn, status: asn.status } : {}),
    };
  });

  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', deliveryDate: '' });
  const [ptdService, setPtdService] = useState(null);
  const [assignService, setAssignService] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);

  const openForm = () => {
    const first = catalog[0];
    if (!first) return;
    setForm({ name: first.name, deliveryDate: '2026-09-20' });
    setShowForm(true);
  };

  const onSelectService = (name) => {
    setForm((f) => ({ ...f, name }));
  };

  const addService = (e) => {
    e.preventDefault();
    if (!form.name) return;
    const cat = catalog.find((c) => c.name === form.name);
    setServices((prev) => [
      ...prev,
      {
        id: `SVC-${prev.length + 1}`,
        name: form.name,
        price: 0,
        deliveryDate: form.deliveryDate,
        status: 'Not Started',
        ptdRequired: cat?.ptdRequired ?? false,
        ptdStatus: cat?.ptdRequired ? 'Not Created' : 'Not Required',
      },
    ]);
    createOrSyncDelivery({ orderId: order.orderId, customer: order.customer, serviceName: form.name, expectedDeliveryDate: form.deliveryDate });
    setShowForm(false);
    const next = catalog[0];
    if (next) {
      setForm({ name: next.name, deliveryDate: '2026-09-20' });
    } else {
      setForm({ name: '', deliveryDate: '2026-09-20' });
    }
  };

  const savePtd = (serviceId, targetStatus, data, billable, price) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    const cat = catalog.find((c) => c.name === svc.name);
    const record = createOrUpdatePtd({
      orderId: order.orderId,
      customer: order.customer,
      serviceName: svc.name,
      template: cat?.template ?? 'generic',
      status: targetStatus,
      data,
      billable,
      price: billable ? Math.max(0, Number(price) || 0) : 0,
    });
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, ptdStatus: targetStatus, price: billable ? record.price : 0, ptd: { id: record.id, status: targetStatus, data, billable, price: billable ? record.price : 0 } }
          : s
      )
    );
    setPtdService(null);
  };

  const assignServiceHandler = (serviceId, payload) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    const record = createAssignment({
      orderId: order.orderId,
      customer: order.customer,
      serviceName: svc.name,
      ...payload,
      assignedBy: user.name,
    });
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, assignment: record, status: record.status } : s))
    );
    setAssignService(null);
  };

  const recordPayment = (payload) => {
    createPayment({ orderId: order.orderId, customer: order.customer, ...payload });
    setPayModal(false);
  };

  const saveSchedule = (payload) => {
    createPaymentPlan({ orderId: order.orderId, customer: order.customer, ...payload });
    setScheduleModal(false);
  };

  const generateInvoice = (payload, status) => {
    saveInvoice({ ...payload, status });
    setInvoiceModal(false);
  };

  if (!order) {
    return (
      <Layout active="orders">
        <button type="button" onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to Orders
        </button>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-500">Order {orderId} was not found.</p>
        </div>
      </Layout>
    );
  }

  const deleteService = (s) => {
    if (!window.confirm(`Delete "${s.name}" from this order? This also removes its PTD, assignment and delivery record if any.`)) return;
    deletePtdFor(order.orderId, s.name);
    deleteAssignmentFor(order.orderId, s.name);
    deleteDeliveryFor(order.orderId, s.name);
    setServices((prev) => prev.filter((x) => x.id !== s.id));
  };

  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);
  const invoices = getInvoicesFor(order?.orderId ?? '');
  const invoicedTotal = invoices.reduce((sum, i) => sum + i.total, 0);

  return (
    <Layout active="orders">
      {/* Back + title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to Orders
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{order.orderId}</h1>
            <span className="text-slate-400">/</span>
            <span className="text-[15px] text-slate-600">{order.customer}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={order.orderStatus} map={{ 'In Progress': 'border-blue-200 bg-blue-50 text-blue-700', Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700', 'Under Review': 'border-amber-200 bg-amber-50 text-amber-700', Delivered: 'border-teal-200 bg-teal-50 text-teal-700', 'On Hold': 'border-orange-200 bg-orange-50 text-orange-700', Cancelled: 'border-red-200 bg-red-50 text-red-700' }} />
          <Badge status={pSummary.status} map={PAYMENT_STATUS} />
        </div>
      </div>

      {/* Order information */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Order Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-10 px-6 py-2 sm:grid-cols-2">
          <div className="divide-y divide-slate-100">
            <InfoRow label="Order Date">{fmtDate(order.orderDate)}</InfoRow>
            <InfoRow label="Lead Order ID"><span className="font-mono text-[12px] text-slate-500">{order.leadId}</span></InfoRow>
            <InfoRow label="Sales Person">{order.salesPerson}</InfoRow>
          </div>
          <div className="divide-y divide-slate-100">
            <InfoRow label="Order Value"><span className="text-emerald-700">{fmtINR(order.value)}</span></InfoRow>
            <InfoRow label="Delivery Date">{fmtDate(order.deliveryDate)}</InfoRow>
            <InfoRow label="Customer">{order.customer}</InfoRow>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Services / Project Items</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{services.length}</span>
          </div>
          <button
            type="button"
            onClick={openForm}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Service
          </button>
        </div>

        <div className="p-6">
          {/* Add service form */}
          {showForm && (
            <form onSubmit={addService} className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="mb-3 text-[13px] font-semibold text-slate-700">Add a service to this order</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="svc-name" className="mb-1 block text-[12px] font-medium text-slate-600">Select Service</label>
                  <select
                    id="svc-name"
                    value={form.name}
                    onChange={(e) => onSelectService(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {catalog.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    {catalog.length === 0 && <option value="">No services available</option>}
                  </select>
                </div>
                <div>
                  <label htmlFor="svc-date" className="mb-1 block text-[12px] font-medium text-slate-600">Delivery Date</label>
                  <input id="svc-date" type="date" value={form.deliveryDate} onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-[12px] text-slate-500">
                  {catalog.find((c) => c.name === form.name)?.ptdRequired ? 'This service requires technical data (PTD).' : 'This service does not require a PTD.'}
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                    Add Service
                  </button>
                </div>
              </div>
            </form>
          )}

          {services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
              <p className="text-sm text-slate-400">No services added yet.</p>
              <button type="button" onClick={openForm} className="mt-3 text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
                + Add the first service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {services.map((s) => (
                <div key={s.id} className="group rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-[14px] font-semibold text-slate-800">{s.name}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[14px] font-semibold text-slate-800">{s.ptd && s.ptd.billable === false ? '—' : fmtINR(s.price || 0)}</span>
                      <Badge status={s.assignment ? s.assignment.status : s.status} map={SERVICE_STATUS} />
                      <button
                        type="button"
                        onClick={() => deleteService(s)}
                        aria-label={`Delete ${s.name}`}
                        title="Delete service"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-300 opacity-0 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-slate-500">Assignment:</span>
                      {s.assignment ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-emerald-700">{s.assignment.id}</span>
                          <span className="text-[12px] text-slate-400">·</span>
                          <span className="text-[12px] font-medium text-slate-700">{s.assignment.assignedTo}</span>
                          <Badge status={s.assignment.status} map={SERVICE_STATUS} />
                        </div>
                      ) : (
                        <Badge status="Not Assigned" map={{ 'Not Assigned': 'border-slate-200 bg-slate-100 text-slate-500' }} />
                      )}
                    </div>

                    {s.assignment ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/assignments/${s.assignment.id}`)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                          <path d="M14 2v6h6" />
                        </svg>
                        View Assignment
                      </button>
                    ) : ((!s.ptdRequired || s.ptdStatus === 'Completed') && (
                      <button
                        type="button"
                        onClick={() => setAssignService(s)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500"
                      >
                        Assign
                      </button>
                    ))}
                  </div>

                  {s.assignment && (
                    <p className="mt-2 text-[12px] text-slate-500">
                      Estimated: <span className="font-medium text-slate-600">{s.assignment.estimatedHours ?? 0} hrs</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      Allocated: <span className="font-medium text-slate-600">{s.assignment.allocatedHours ?? 0} hrs</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      Expected completion: <span className="font-medium text-slate-600">{fmtDate(s.assignment.expectedDelivery || s.deliveryDate || order.deliveryDate)}</span>
                    </p>
                  )}

                  <p className="mt-2 text-[12.5px] text-slate-500">
                    Delivery: <span className="font-medium text-slate-600">{fmtDate(s.deliveryDate || order.deliveryDate)}</span>
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-slate-500">PTD:</span>
                      {s.ptdRequired ? (
                        <Badge status={s.ptdStatus} map={PTD_STATUS} />
                      ) : (
                        <Badge status="Not Required" map={PTD_STATUS} />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {s.ptdRequired && s.ptdStatus === 'Completed' && (
                        <button
                          type="button"
                          onClick={() => setPtdService(s)}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 13 4.5 4.5L19 7.5" />
                          </svg>
                          View PTD
                        </button>
                      )}

                      {s.ptdRequired && s.ptdStatus !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => setPtdService(s)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500"
                        >
                          {s.ptdStatus === 'Draft' ? 'Continue PTD' : 'Create PTD'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Services total */}
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-[13px] text-slate-500">Services value</span>
            <span className="text-[14px] font-semibold text-slate-800">{fmtINR(servicesTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment summary */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Payment Summary</h2>
            <Badge status={pSummary.status} map={PAYMENT_STATUS} />
          </div>
          <button
            type="button"
            onClick={() => setPayModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Record Payment
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Order Value</p>
            <p className="mt-1 text-[20px] font-semibold text-slate-800">{fmtINR(pSummary.orderValue)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Invoiced</p>
            <p className="mt-1 text-[20px] font-semibold text-slate-700">{fmtINR(invoicedTotal)}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{invoices.length} invoice{invoices.length === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Amount Received</p>
            <p className="mt-1 text-[20px] font-semibold text-emerald-700">{fmtINR(pSummary.received)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Amount Pending</p>
            <p className={`mt-1 text-[20px] font-semibold ${pSummary.pending > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>{fmtINR(pSummary.pending)}</p>
          </div>
        </div>

        {pSummary.overpaid > 0 && (
          <div className="mx-6 mb-5 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-[12.5px] font-medium text-violet-700">
            Order is overpaid by {fmtINR(pSummary.overpaid)} — received amount exceeds the order value.
          </div>
        )}

        {pSummary.payments.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-5">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-slate-400">Payment History</p>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {pSummary.payments.map((p, i) => (
                <button
                  key={p.paymentId}
                  type="button"
                  onClick={() => navigate(`/payments/${p.paymentId}`)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-[13px] font-semibold text-emerald-700 hover:underline">{p.paymentId}</span>
                    <span className="whitespace-nowrap text-[12.5px] text-slate-500">{fmtDate(p.date)}</span>
                    <span className="hidden text-[12.5px] text-slate-500 sm:inline">{p.method}</span>
                    {p.planStage && <span className="text-[12.5px] text-slate-500">· {p.planStage}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[13px] font-semibold text-slate-800">{fmtINR(p.amount)}</span>
                    <Badge status={p.status} map={PAYMENT_TXN_STATUS} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment plan */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Payment Plan</h2>
            {planView && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{planView.type}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScheduleModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            {planView ? 'Edit Payment Plan' : '+ Add Payment Plan'}
          </button>
        </div>

        {planView ? (
          <div className="px-6 py-5">
            <p className="text-[12px] text-slate-500">
              Plan: <span className="font-medium text-slate-700">{planView.name}</span>
              <span className="mx-1.5 text-slate-300">·</span>
              How this order is expected to be paid. Stage status is calculated from payments linked to each stage.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Stage</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2.5 font-semibold">Due Date</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {planView.stages.map((s) => (
                    <tr key={s.stageId} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-800">{s.title}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{fmtINR(s.amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(s.dueDate)}</td>
                      <td className="px-4 py-3"><Badge status={s.status} map={PAYMENT_STAGE_STATUS} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50 text-[12.5px]">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-600">Plan total</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtINR(planView.stages.reduce((sum, s) => sum + s.amount, 0))}</td>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-[13px] text-slate-400">
              No payment plan yet. Define how this order should be paid — advance, milestones or recurring installments.
            </p>
            <button
              type="button"
              onClick={() => setScheduleModal(true)}
              className="mt-3 text-[13px] font-medium text-emerald-600 hover:text-emerald-700"
            >
              + Add Payment Plan
            </button>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Invoices</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{invoices.length}</span>
          </div>
          <button
            type="button"
            onClick={() => setInvoiceModal(true)}
            disabled={services.length === 0}
            title={services.length === 0 ? 'Add services to this order before invoicing' : 'Generate an invoice from this order'}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
              <path d="M9 8h6M9 12h6M9 16h3" />
            </svg>
            Generate Invoice
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-[13px] text-slate-400">
              No invoices yet. {services.length === 0 ? 'Add services first, then generate an invoice from the order.' : 'Generate the first invoice from this order.'}
            </p>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Invoice</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Schedule Stage</th>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 font-semibold">Due Date</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoiceId} onClick={() => navigate(`/invoices/${inv.invoiceId}`)} className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700 hover:underline">{inv.invoiceId}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{inv.invoiceType}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{inv.planStage || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(inv.invoiceDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(inv.dueDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-800">{fmtINR(inv.total)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge status={getInvoiceStatus(inv, payments)} map={INVOICE_STATUS} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PTD modal */}
      {ptdService && (
        <PtdModal
          order={order}
          service={ptdService}
          onClose={() => setPtdService(null)}
          onSave={savePtd}
        />
      )}

      {/* Assign modal */}
      {assignService && (
        <AssignModal
          order={order}
          service={assignService}
          assigner={user}
          onClose={() => setAssignService(null)}
          onAssign={assignServiceHandler}
        />
      )}

      {/* Record payment modal */}
      {payModal && (
        <PaymentModal
          order={order}
          summary={pSummary}
          user={user}
          plan={planView}
          onClose={() => setPayModal(false)}
          onRecord={recordPayment}
        />
      )}

      {/* Payment schedule modal */}
      {scheduleModal && (
        <ScheduleModal
          order={order}
          plan={planView}
          onClose={() => setScheduleModal(false)}
          onSave={saveSchedule}
        />
      )}

      {/* Generate invoice modal */}
      {invoiceModal && (
        <InvoiceModal
          order={order}
          services={services}
          plan={planView}
          existingInvoiced={invoicedTotal}
          onClose={() => setInvoiceModal(false)}
          onSave={generateInvoice}
        />
      )}
    </Layout>
  );
}

export default OrderDetail;