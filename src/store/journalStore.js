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

  const isBank = bookFor(p.method) === 'Bank';
  const bankStr = isBank ? (p.bankName || 'HDFC Bank') : '';
  const methodStr = p.method ? p.method : 'Payment';
  const refStr = p.reference ? p.reference : '';
  const receiver = p.receivedBy ? `By: ${p.receivedBy}` : '';
  const linkedInv = p.invoiceId ? `Against ${p.invoiceId}` : '';

  const detailParts = [
    refunded ? `Refund (${methodStr})` : `${methodStr} Receipt`,
    bankStr,
    refStr,
    linkedInv,
    receiver,
  ].filter(Boolean);

  const particularsDetail = detailParts.join(' · ');
  const particularHeader = p.customer;

  return {
    id: p.paymentId,
    date: p.date,
    customer: p.customer,
    particularHeader,
    particularsDetail,
    particular: `${p.customer} — ${particularsDetail}`,
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