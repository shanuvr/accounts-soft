import { useOrders, getOrderById, updateOrderHours } from './orderStore';

export function useOrderHours() {
  return useOrders();
}

export function getOrderHours(orderId) {
  return getOrderById(orderId)?.projectHours ?? 0;
}

export async function setOrderHours(orderId, hours) {
  return updateOrderHours(orderId, hours);
}

export function getOrderHoursSummary(orderId, assignments) {
  const total = getOrderHours(orderId);
  const used = assignments
    .filter((a) => a.orderId === orderId)
    .reduce((sum, a) => sum + (Number(a.allocatedHours) || 0), 0);
  return { total, used, remaining: Math.max(0, total - used), overBudget: used > total && total > 0 };
}