import { useState } from 'react';
import { getOrderPaymentSummary } from '../store/paymentStore';
import { useAuth } from '../store/authStore';
import { fmtINR, fmtDate } from '../data/mockData';
import { downloadReceiptPdf, numberToWords, fmtReceiptDate } from '../utils/receiptPdf';

function ReceiptModal({ payment, onClose }) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  if (!payment) return null;

  const summary = getOrderPaymentSummary(payment.orderId);
  const previouslyReceived = Math.max(0, (summary.received || payment.amount) - payment.amount);
  const balance = summary.pending;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadReceiptPdf(payment, summary, user);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 sm:p-6">
      {/* Modal Card */}
      <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* Header / Actions toolbar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Payment Receipt Voucher</h2>
              <p className="text-[12px] text-slate-500">Official receipt for {payment.paymentId} · {payment.customer}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[12.5px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {downloading ? 'Generating PDF…' : 'Download PDF'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              Print
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="receipt-print-area" className="max-h-[75vh] overflow-y-auto p-6 sm:p-8">
          <div className="rounded-xl border-2 border-slate-800 bg-white p-6 sm:p-8">
            
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-800 pb-5">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 sm:text-2xl">PROGRAMERS INTERNATIONAL</h1>
                <p className="mt-1 text-[12px] text-slate-600">4th Floor, Park House, Round North, Thrissur, Kerala - 680 001</p>
                <p className="text-[12px] text-slate-600">Ph: 9447151442, 9495951442 · info@programers.in · www.programers.in</p>
              </div>
              <div className="text-right">
                <div className="inline-block rounded border border-slate-800 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-900">
                  PAYMENT RECEIPT
                </div>
                <p className="mt-2 text-[13px] font-bold text-slate-900">Receipt No: <span className="text-emerald-700">RCP-{payment.paymentId}</span></p>
                <p className="text-[12px] text-slate-600">Date: {fmtReceiptDate(payment.date)}</p>
              </div>
            </div>

            {/* Received from details */}
            <div className="mt-5 grid grid-cols-1 gap-4 border-b border-dashed border-slate-300 pb-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Received With Thanks From</p>
                <p className="mt-1 text-[15px] font-bold text-slate-900">{payment.customer}</p>
                <p className="text-[12.5px] text-slate-600">Order Reference: <span className="font-semibold">{payment.orderId}</span></p>
                {payment.invoiceId && (
                  <p className="text-[12.5px] text-slate-600">Invoice: <span className="font-semibold">{payment.invoiceId}</span></p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payment Channel</p>
                <p className="mt-1 text-[14px] font-bold text-slate-800">{payment.method}</p>
                {payment.reference && (
                  <p className="text-[12.5px] text-slate-600">Ref / UTR: <span className="font-mono text-[12px]">{payment.reference}</span></p>
                )}
                {payment.planStage && (
                  <p className="text-[12.5px] text-slate-600">Stage: <span className="font-medium">{payment.planStage}</span></p>
                )}
              </div>
            </div>

            {/* Amount Box */}
            <div className="mt-5 rounded-lg border-2 border-emerald-600 bg-emerald-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Amount Received</p>
                  <p className="mt-0.5 text-[13px] font-semibold italic text-emerald-950">
                    "{numberToWords(payment.amount)}"
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[24px] font-black tracking-tight text-emerald-800">
                    {fmtINR(payment.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Summary breakdown */}
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Order Payment Ledger Snapshot</p>
              <div className="grid grid-cols-2 gap-2 text-[12.5px] sm:grid-cols-4">
                <div>
                  <span className="text-slate-500">Order Value:</span>
                  <p className="font-semibold text-slate-800">{fmtINR(summary.orderValue)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Previously Paid:</span>
                  <p className="font-semibold text-slate-800">{fmtINR(previouslyReceived)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Paid to Date:</span>
                  <p className="font-semibold text-emerald-700">{fmtINR(summary.received)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Balance Pending:</span>
                  <p className={`font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>{fmtINR(balance)}</p>
                </div>
              </div>
            </div>

            {payment.notes && (
              <div className="mt-4 text-[12px] text-slate-600">
                <span className="font-semibold text-slate-700">Remarks:</span> {payment.notes}
              </div>
            )}

            {/* Footer / Signatory */}
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="text-[11px] text-slate-500">
                <p>• Subject to realization of funds.</p>
                <p>• This is a computer-generated money receipt voucher.</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Authorized Signatory</p>
                <div className="mt-3 h-10 border-b border-slate-400">
                  <span className="font-serif italic text-slate-700">
                    {user?.name || payment.receivedBy || 'Programers International'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Programers International</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ReceiptModal;
