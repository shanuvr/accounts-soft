import { useSyncExternalStore } from 'react';
import { getAllRenewables, getRenewalStatus, subscribe as subscribeRenewables } from './renewableStore';
import { fmtDate, fmtINR } from '../data/mockData';

const READ_STORAGE_KEY = 'account_soft_read_notifications';
const DISMISSED_POPUPS_KEY = 'account_soft_dismissed_popup_notifications';

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // ignore local storage errors
  }
}

let readNotificationIds = loadSet(READ_STORAGE_KEY);
let dismissedPopupIds = loadSet(DISMISSED_POPUPS_KEY);
let customNotifications = [];
const listeners = new Set();

let cachedNotifications = [];
let cachedUnreadCount = 0;
let cachedPendingPopups = [];
let cachedNotificationsState = {
  notifications: cachedNotifications,
  unreadCount: cachedUnreadCount,
  hasUnread: false,
};

function computeRenewalNotifications() {
  const renewals = getAllRenewables() || [];
  const list = [];

  for (const r of renewals) {
    if (!r.expiryDate) continue;
    const status = getRenewalStatus(r);
    if (status.key === 'Overdue' || status.key === 'Expiring Soon') {
      const isOverdue = status.key === 'Overdue';
      const id = `renewal-${r.id}-${r.expiryDate}`;
      const daysText = isOverdue
        ? `Expired ${Math.abs(status.daysLeft)} day${Math.abs(status.daysLeft) === 1 ? '' : 's'} ago`
        : `Expires in ${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'}`;

      list.push({
        id,
        source: 'renewal',
        renewalId: r.id,
        name: r.name,
        type: r.type,
        customer: r.customer,
        amount: r.amount,
        amountFormatted: r.amount ? fmtINR(r.amount) : '',
        expiryDate: r.expiryDate,
        expiryDateFormatted: fmtDate(r.expiryDate),
        statusKey: status.key,
        daysLeft: status.daysLeft,
        daysText,
        title: isOverdue ? `Renewal Overdue: ${r.name}` : `Renewal Expiring Soon: ${r.name}`,
        message: `${r.customer && r.customer !== '—' ? `${r.customer} · ` : ''}${daysText} (${fmtDate(r.expiryDate)})`,
        severity: isOverdue ? 'error' : 'warning',
        link: `/renewals?highlight=${r.id}`,
      });
    }
  }

  // Sort: Overdue first (most overdue first), then Expiring Soon (soonest expiry first)
  list.sort((a, b) => {
    if (a.statusKey === 'Overdue' && b.statusKey !== 'Overdue') return -1;
    if (a.statusKey !== 'Overdue' && b.statusKey === 'Overdue') return 1;
    return a.daysLeft - b.daysLeft;
  });

  return list;
}

function updateSnapshots() {
  const renewalNotifs = computeRenewalNotifications();
  cachedNotifications = [...renewalNotifs, ...customNotifications];
  cachedUnreadCount = cachedNotifications.filter((n) => !readNotificationIds.has(n.id)).length;
  cachedPendingPopups = cachedNotifications.filter((n) => !dismissedPopupIds.has(n.id));
  cachedNotificationsState = {
    notifications: cachedNotifications,
    unreadCount: cachedUnreadCount,
    hasUnread: cachedUnreadCount > 0,
  };
}

// Initial calculation
updateSnapshots();

function emit() {
  updateSnapshots();
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Automatically subscribe to renewals updates
subscribeRenewables(() => {
  emit();
});

export function getAllNotifications() {
  return cachedNotifications;
}

export function getUnreadCount() {
  return cachedUnreadCount;
}

export function getPendingPopups() {
  return cachedPendingPopups;
}

export function markAsRead(id) {
  if (!readNotificationIds.has(id)) {
    readNotificationIds.add(id);
    saveSet(READ_STORAGE_KEY, readNotificationIds);
    emit();
  }
}

export function markAllAsRead() {
  const all = cachedNotifications;
  let changed = false;
  for (const n of all) {
    if (!readNotificationIds.has(n.id)) {
      readNotificationIds.add(n.id);
      changed = true;
    }
  }
  if (changed) {
    saveSet(READ_STORAGE_KEY, readNotificationIds);
    emit();
  }
}

export function dismissPopup(id) {
  if (!dismissedPopupIds.has(id)) {
    dismissedPopupIds.add(id);
    saveSet(DISMISSED_POPUPS_KEY, dismissedPopupIds);
    emit();
  }
}

export function dismissAllPopups() {
  const pending = cachedPendingPopups;
  let changed = false;
  for (const p of pending) {
    if (!dismissedPopupIds.has(p.id)) {
      dismissedPopupIds.add(p.id);
      changed = true;
    }
  }
  if (changed) {
    saveSet(DISMISSED_POPUPS_KEY, dismissedPopupIds);
    emit();
  }
}

export function addCustomNotification(notification) {
  if (!notification || !notification.id) return;
  customNotifications = [notification, ...customNotifications.filter((n) => n.id !== notification.id)];
  emit();
}

function getNotificationsSnapshot() {
  return cachedNotificationsState;
}

function getPendingPopupsSnapshot() {
  return cachedPendingPopups;
}

// React hooks
export function useNotifications() {
  const state = useSyncExternalStore(subscribe, getNotificationsSnapshot);
  return {
    ...state,
    markAsRead,
    markAllAsRead,
    dismissPopup,
    dismissAllPopups,
  };
}

export function usePendingPopups() {
  return useSyncExternalStore(subscribe, getPendingPopupsSnapshot);
}
