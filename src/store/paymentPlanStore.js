import { useSyncExternalStore } from 'react';

let plans = [];
let planCounter = 1;
let stageCounter = 1;
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return plans;
}

export function usePaymentPlans() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getPlanFor(orderId) {
  return plans.find((p) => p.orderId === orderId);
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

export function createPaymentPlan({ orderId, customer, name, type, stages }) {
  const existing = plans.find((p) => p.orderId === orderId);
  const nextStages = stages.map((s, i) => ({
    stageId: existing?.stages[i]?.stageId ?? `STG-${String(stageCounter++).padStart(3, '0')}`,
    title: s.title,
    amount: Number(s.amount),
    dueDate: s.dueDate,
  }));

  if (existing) {
    plans = plans.map((p) => (p.planId === existing.planId ? { ...p, name, type, stages: nextStages } : p));
  } else {
    const plan = {
      planId: `PAYPLAN-${String(planCounter++).padStart(3, '0')}`,
      orderId,
      customer,
      name,
      type,
      stages: nextStages,
    };
    plans = [...plans, plan];
  }
  emit();
  return plans.find((p) => p.orderId === orderId);
}