import { useSyncExternalStore } from 'react';

const SEED_EXPENSES = [
  {
    id: 'EX-101',
    date: '2026-09-02',
    expenseHead: 'Office Supplies',
    category: 'Administrative',
    subcategory: 'Office Stationery',
    amount: 4500,
    paymentMethod: 'Cash',
    bankPaymentType: '',
    bankName: '',
    description: 'Printer paper reams, file folders & ballpoint pens for admin office',
  },
  {
    id: 'EX-102',
    date: '2026-09-05',
    expenseHead: 'Travel & Conveyance',
    category: 'Operating Expenses',
    subcategory: 'Fuel & Transit',
    amount: 12800,
    paymentMethod: 'Bank',
    bankPaymentType: 'Card',
    bankName: 'HDFC BANK',
    description: 'Executive flight tickets & taxi fare for Mumbai client meeting',
  },
  {
    id: 'EX-103',
    date: '2026-09-08',
    expenseHead: 'Utilities & Internet',
    category: 'IT & Infrastructure',
    subcategory: 'Internet & Phone',
    amount: 8200,
    paymentMethod: 'Bank',
    bankPaymentType: 'UPI',
    bankName: 'ICICI BANK',
    description: 'Monthly high-speed fiber broadband & VoIP lease line charges',
  },
  {
    id: 'EX-104',
    date: '2026-09-12',
    expenseHead: 'Staff Refreshments',
    category: 'Administrative',
    subcategory: 'Pantry & Catering',
    amount: 3400,
    paymentMethod: 'Cash',
    bankPaymentType: '',
    bankName: '',
    description: 'Monthly pantry coffee beans, tea packets & snacks for team',
  },
  {
    id: 'EX-105',
    date: '2026-09-15',
    expenseHead: 'Equipment Maintenance',
    category: 'Operating Expenses',
    subcategory: 'Hardware Repair',
    amount: 16500,
    paymentMethod: 'Both',
    bankPaymentType: 'UPI',
    bankName: 'AXIS BANK',
    description: 'Server room UPS battery replacement and HVAC routine servicing',
  },
];

let records = [...SEED_EXPENSES];
let counter = 106;
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  return records;
}

export function useExpenseHeads() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function addExpenseHead(data) {
  const newRecord = {
    id: `EX-${counter}`,
    date: data.date || new Date().toISOString().slice(0, 10),
    expenseHead: data.expenseHead || 'General Expense',
    category: data.category || 'Operating Expenses',
    subcategory: data.subcategory || 'General',
    amount: Number(data.amount) || 0,
    cashAmount: Number(data.cashAmount) || 0,
    bankAmount: Number(data.bankAmount) || 0,
    paymentMethod: data.paymentMethod || 'Cash',
    bankPaymentType: data.paymentMethod !== 'Cash' ? (data.bankPaymentType || 'UPI') : '',
    bankName: data.paymentMethod !== 'Cash' ? (data.bankName || 'HDFC BANK') : '',
    description: data.description || '',
  };
  counter += 1;
  records = [newRecord, ...records];
  emit();
  return newRecord;
}

export function deleteExpenseHead(id) {
  records = records.filter((r) => r.id !== id);
  emit();
}
