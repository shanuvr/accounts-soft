export const ORDER_STATUSES = ['Pending', 'Ongoing', 'Delivered', 'Cancelled'];

export const ORDER_STATUS_COLORS = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Ongoing: 'border-blue-200 bg-blue-50 text-blue-700',
  Delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
};

export const CLOSED_ORDER_STATUSES = ['Delivered', 'Cancelled'];

export const isActiveOrder = (status) => !CLOSED_ORDER_STATUSES.includes(status);
