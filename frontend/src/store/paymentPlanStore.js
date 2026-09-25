import { createApiStore } from './createApiStore';
import * as api from '../api/data';
import { ensureLocalOrder } from './orderStore';

function mapRecord(r) {
  return {
    stageId: r.id,
    orderId: r.order_id || '',
    customer: r.customer_name || '',
    name: r.name || 'Payment Plan',
    type: r.plan_type || 'Milestone',
    title: r.notes || 'Stage',
    amount: Number(r.amount) || 0,
    dueDate: (r.due_date || '').slice(0, 10),
    status: r.status || 'Pending',
  };
}

const store = createApiStore({
  fetchList: api.getPaymentSchedules,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function usePaymentPlans() {
  return store.useItems();
}

export function getPlanFor(orderId) {
  const stages = store.all().filter((s) => s.orderId === orderId);
  if (stages.length === 0) return null;
  const first = stages[0];
  return {
    planId: `PLAN-${orderId}`,
    orderId,
    customer: first.customer,
    name: first.name,
    type: first.type,
    stages,
  };
}

export function getStageStatus(stage, orderId, payments) {
  const received = payments
    .filter((p) => p.orderId === orderId && p.planStage === stage.title)
    .reduce((s, p) => s + p.amount, 0);
  if (Number(received) >= Number(stage.amount)) return 'Paid';
  if (Number(received) > 0) return 'Partial';
  return 'Pending';
}

export function getPlanView(orderId, payments) {
  const plan = getPlanFor(orderId);
  if (!plan) return null;
  return { ...plan, stages: plan.stages.map((s) => ({ ...s, status: getStageStatus(s, orderId, payments) })) };
}

export function getScheduledStages(payments) {
  const plansByOrder = new Map();
  for (const s of store.all()) {
    const plan = plansByOrder.get(s.orderId) ?? { orderId: s.orderId, customer: s.customer, planId: `PLAN-${s.orderId}`, planName: s.name, planType: s.type, stages: [] };
    plan.stages.push(s);
    plansByOrder.set(s.orderId, plan);
  }
  const out = [];
  for (const plan of plansByOrder.values()) {
    for (const stage of plan.stages) {
      const received = payments
        .filter((p) => p.orderId === plan.orderId && p.planStage === stage.title)
        .reduce((s, p) => s + p.amount, 0);
      out.push({
        orderId: plan.orderId,
        customer: plan.customer,
        planId: plan.planId,
        planName: plan.name,
        planType: plan.type,
        stageId: stage.stageId,
        stageTitle: stage.title,
        amount: Number(stage.amount),
        dueDate: stage.dueDate,
        received: Number(received),
        remaining: Math.max(0, Number(stage.amount) - Number(received)),
        status: getStageStatus(stage, plan.orderId, payments),
      });
    }
  }
  return out.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
}

export async function createPaymentPlan({ orderId, name, type, stages }) {
  const orderPk = await ensureLocalOrder(orderId);
  if (!orderPk) return null;
  const existing = getPlanFor(orderId);
  if (existing) {
    for (const st of existing.stages) {
      await store.run(() => api.deletePaymentSchedule(st.stageId));
    }
  }
  for (const s of stages) {
    const payload = {
      order: orderPk,
      name: name || 'Payment Plan',
      plan_type: type || 'Milestone',
      due_date: s.dueDate,
      amount: Math.max(0, Number(s.amount) || 0),
      status: 'Pending',
      notes: s.title,
    };
    await store.run(() => api.createPaymentSchedule(payload));
  }
  return getPlanFor(orderId);
}