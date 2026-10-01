import { createApiStore } from './createApiStore';
import * as api from '../api/data';

function mapRecord(r) {
  return {
    id: r.id,
    type: r.entry_type || 'Expense',
    date: (r.date || '').slice(0, 10),
    head: r.head || 'General Expense',
    category: r.category || '',
    subcategory: r.subcategory || '',
    amount: Number(r.amount) || 0,
    cashAmount: Number(r.cash_amount) || 0,
    bankAmount: Number(r.bank_amount) || 0,
    paymentMethod: r.payment_method || 'Cash',
    bankPaymentType: r.bank_payment_type || '',
    bankName: r.bank_name || '',
    description: r.description || '',
  };
}

const store = createApiStore({
  fetchList: api.getTransactions,
  mapRecord,
});

export function subscribe(cb) {
  return store.subscribe(cb);
}

export function getSnapshot() {
  return store.getSnapshot();
}

export function useTransactions() {
  return store.useItems();
}

export function getAllTransactions() {
  return store.all();
}

export async function addTransaction(data) {
  const date = data?.date || new Date().toISOString().slice(0, 10);
  const type = data?.type === 'Income' ? 'Income' : 'Expense';
  let amount = Number(data.amount) || 0;
  let cashAmount = Number(data.cashAmount) || 0;
  let bankAmount = Number(data.bankAmount) || 0;
  const paymentMethod = data?.paymentMethod || 'Cash';
  if (paymentMethod === 'Both') {
    cashAmount = Number(data.cashAmount) || 0;
    bankAmount = Number(data.bankAmount) || 0;
    amount = cashAmount + bankAmount;
  }
  if (amount <= 0) return { ok: false, reason: 'amount' };
  const payload = {
    entry_type: type,
    date,
    head: data?.head?.trim() || (type === 'Income' ? 'Other Income' : 'General Expense'),
    category: data?.category || '',
    subcategory: data?.subcategory || '',
    amount,
    cash_amount: cashAmount,
    bank_amount: bankAmount,
    payment_method: paymentMethod,
    bank_payment_type: paymentMethod !== 'Cash' ? (data?.bankPaymentType || 'UPI') : '',
    bank_name: paymentMethod !== 'Cash' ? (data?.bankName || '') : '',
    description: data?.description || '',
  };
  return store.run(() => api.createTransaction(payload));
}

export async function deleteTransaction(id) {
  return store.run(() => api.deleteTransaction(id));
}