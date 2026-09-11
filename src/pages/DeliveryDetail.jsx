import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { fmtDate } from '../data/mockData';
import { useDeliveries, getDeliveryById, markDelivered, updateDelivery } from '../store/deliveryStore';
import { getAssignmentFor } from '../store/assignmentStore';
import { useAuth } from '../store/authStore';
import { todayStr, isOverdue, DELIVERY_STATUS_COLORS } from './DeliveryList';

const fieldCls =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2.5 first:pt-0 last:border-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[13px] text-slate-700">{value || <span className="text-slate-300">—</span>}</p>
    </div>
  );
}

function Card({ title, action, children }) {
  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
        {action}
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function DeliveryDetail() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const user = useAuth();
  const [marking, setMarking] = useState(false);
  const [editing, setEditing] = useState(false);

  useDeliveries();

  const delivery = getDeliveryById(deliveryId);
  const assignment = delivery ? getAssignmentFor(delivery.orderId, delivery.serviceName) ?? null : null;

  const [form, setForm] = useState(() => delivery ? {
    actualDeliveryDate: delivery.actualDeliveryDate ?? delivery.expectedDeliveryDate ?? todayStr,
    customerConfirmation: delivery.customerConfirmation === 'Confirmed' ? 'Confirmed' : 'Pending',
    notes: delivery.notes ?? '',
  } : null);

  const [editForm, setEditForm] = useState(null);

  if (!delivery) {
    return (
      <Layout active="delivery">
        <div className="p-6 text-[13px] text-slate-500">Delivery record not found. <button type="button" onClick={() => navigate('/delivery')} className="text-emerald-600 hover:underline">Back to Delivery Tracking</button></div>
      </Layout>
    );
  }

  const overdue = isOverdue(delivery);

  const openEdit = () => {
    setEditForm({
      expectedDeliveryDate: delivery.expectedDeliveryDate,
      status: delivery.status,
      customerConfirmation: delivery.customerConfirmation ?? 'Pending',
      notes: delivery.notes ?? '',
    });
    setEditing(true);
  };

  const submitMark = () => {
    markDelivered(delivery.id, {
      actualDeliveryDate: form.actualDeliveryDate,
      deliveredBy: user?.name ?? 'Anita Desai',
      deliveredOn: todayStr,
      customerConfirmation: form.customerConfirmation,
      notes: form.notes,
    });
    setMarking(false);
  };

  const submitEdit = () => {
    updateDelivery(delivery.id, editForm);
    setEditing(false);
  };

  return (
    <Layout active="delivery">
      <div className="p-6">
        <button type="button" onClick={() => navigate('/delivery')} className="mb-4 flex items-center gap-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Delivery Tracking
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-amber-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4L8 19l-4-1-1-4z" /><path d="m12.5 6.5 5 5" /></svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold text-slate-900">{delivery.id}</h1>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${DELIVERY_STATUS_COLORS[delivery.status] ?? DELIVERY_STATUS_COLORS.Pending}`}>{delivery.status}</span>
                {overdue && <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">OVERDUE</span>}
              </div>
              <p className="mt-1 text-[13px] text-slate-500">{delivery.serviceName} · {delivery.customer}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!['Delivered', 'Cancelled'].includes(delivery.status) && (
              <button type="button" onClick={() => setMarking(true)} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-700">Mark Delivered</button>
            )}
            <button type="button" onClick={() => navigate(`/orders/${delivery.orderId}`)} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">View Order</button>
            <button type="button" onClick={openEdit} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-700">Edit</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* DELIVERY */}
          <Card title="Delivery">
            <div className="grid grid-cols-2 gap-x-5">
              <InfoRow label="Order" value={delivery.orderId} />
              <InfoRow label="Service" value={delivery.serviceName} />
              <InfoRow label="Expected Delivery" value={fmtDate(delivery.expectedDeliveryDate)} />
              <InfoRow label="Actual Delivery" value={delivery.actualDeliveryDate ? fmtDate(delivery.actualDeliveryDate) : null} />
              <InfoRow label="Status" value={delivery.status} />
              <InfoRow label="Customer Confirmation" value={delivery.customerConfirmation ?? 'Pending'} />
              <InfoRow label="Delivered By" value={delivery.deliveredBy ?? null} />
              <InfoRow label="Delivered On" value={delivery.deliveredOn ? fmtDate(delivery.deliveredOn) : null} />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Remarks</p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
                {delivery.notes?.trim() ? delivery.notes : <span className="text-slate-300">No remarks.</span>}
              </p>
            </div>
          </Card>

          {/* ASSIGNMENT */}
          <Card title="Assignment">
            {assignment ? (
              <div className="grid grid-cols-2 gap-x-5">
                <InfoRow label="Assignment" value={assignment.id} />
                <InfoRow label="Assigned To" value={assignment.assignedTo} />
                <InfoRow label="Assigned Team" value={assignment.assignedTeam} />
                <InfoRow label="Assigned By" value={assignment.assignedBy} />
                <InfoRow label="Allocated Hours" value={`${assignment.allocatedHours ?? 0} hrs`} />
                <InfoRow label="Expected Completion" value={assignment.expectedDelivery ? fmtDate(assignment.expectedDelivery) : null} />
                <InfoRow label="Assignment Status" value={assignment.status} />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-[12.5px] text-slate-400">
                No assignment yet for this service.
              </div>
            )}
            {assignment && (
              <button type="button" onClick={() => navigate(`/assignments/${assignment.id}`)} className="mt-4 text-[12px] font-medium text-emerald-600 hover:underline">
                Open Assignment →
              </button>
            )}
          </Card>
        </div>
      </div>

      {/* Mark Delivered modal */}
      {marking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-[16px] font-semibold text-slate-900">Mark Delivered</h3>
            <p className="mt-1 text-[12.5px] text-slate-500">{delivery.serviceName} · {delivery.customer}</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Actual Delivery Date</label>
                <input type="date" value={form.actualDeliveryDate} onChange={(e) => setForm((f) => ({ ...f, actualDeliveryDate: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Customer Confirmation</label>
                <select value={form.customerConfirmation} onChange={(e) => setForm((f) => ({ ...f, customerConfirmation: e.target.value }))} className={fieldCls}>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Remarks</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={`${fieldCls} resize-y`} placeholder="Credentials shared, verification notes, etc." />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                Delivered By: <span className="font-medium text-slate-700">{user?.name ?? 'Anita Desai'}</span> · On {todayStr}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setMarking(false)} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={submitMark} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-medium text-white hover:bg-emerald-700">Confirm Delivery</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-[16px] font-semibold text-slate-900">Edit Delivery</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Expected Delivery Date</label>
                <input type="date" value={editForm.expectedDeliveryDate} onChange={(e) => setEditForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Delivery Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className={fieldCls}>
                  {['Pending', 'In Progress', 'Ready for Delivery', 'Delivered', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Customer Confirmation</label>
                <select value={editForm.customerConfirmation} onChange={(e) => setEditForm((f) => ({ ...f, customerConfirmation: e.target.value }))} className={fieldCls}>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Remarks</label>
                <textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className={`${fieldCls} resize-y`} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={submitEdit} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-medium text-white hover:bg-emerald-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default DeliveryDetail;