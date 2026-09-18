import { useMemo } from 'react';
import { usePayments } from './paymentStore';

export const JOURNAL_SOURCES = ['Bank', 'Cash'];

function bookFor(method) {
  return method === 'Cash' ? 'Cash' : 'Bank';
}

function entryForPayment(p) {
  if (p.status === 'Failed') return null;
  const refunded = p.status === 'Refunded';
  const amount = Number(p.amount) || 0;
  const ref = p.reference ? ` (${p.reference})` : '';
  return {
    id: p.paymentId,
    date: p.date,
    particular: refunded ? `Refund — ${p.customer}${ref}` : `${p.customer}${ref}`,
    income: refunded ? 0 : amount,
    expense: refunded ? amount : 0,
    source: bookFor(p.method),
    docType: refunded ? 'Refund' : 'Payment',
    orderId: p.orderId,
    note: p.notes || '',
  };
}

function buildEntries(payments) {
  return payments
    .map((p) => entryForPayment(p))
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id.localeCompare(b.id)));
}

export function useJournal() {
  const payments = usePayments();
  return useMemo(() => buildEntries(payments), [payments]);
}

export function getJournalSummary(entries = []) {
  const income = entries.reduce((s, e) => s + e.income, 0);
  const expense = entries.reduce((s, e) => s + e.expense, 0);
  return { income, expense, net: income - expense, count: entries.length };
}