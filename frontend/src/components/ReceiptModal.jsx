import { useState } from 'react';
import { getOrderPaymentSummary } from '../store/paymentStore';
import { useAuth } from '../store/authStore';
import { downloadReceiptPdf, numberToWords, fmtReceiptDate, fmtAmount } from '../utils/receiptPdf';

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

  const dateNow = new Date();
  const dateStamp = `${dateNow.getFullYear()}.${String(dateNow.getMonth() + 1).padStart(2, '0')}.${String(dateNow.getDate()).padStart(2, '0')} 07:45:30 +00:00`;
  const signer = (user && user.name) || payment.receivedBy || 'Husna M S';
  const stageStr = payment.planStage ? ` (${payment.planStage.toUpperCase()})` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 sm:p-6">
      {/* Modal Dialog Container */}
      <div className="relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* Top toolbar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-slate-800">
              Receipt Preview · <span className="text-emerald-700">RCP-{payment.paymentId}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-[12.5px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {downloading ? 'Generating PDF…' : 'Download PDF'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 transition hover:bg-slate-100"
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

        {/* Printable / Viewable Receipt Document - EXACT mirror of Cash Invoice layout */}
        <div className="max-h-[80vh] overflow-y-auto bg-slate-100/60 p-4 sm:p-6">
          <div id="receipt-print-area" className="mx-auto max-w-[680px] border border-slate-900 bg-white p-6 font-sans text-slate-900 shadow-sm print:m-0 print:max-w-none print:border-none print:p-0 print:shadow-none">
            
            {/* 1. Header (Logo on left, Company title & [ Cash Receipt ] on right) */}
            <div className="flex items-start justify-between">
              <div>
                <img
                  src="/programers-logo-BLACCK.png"
                  alt="PROGRAMERS"
                  className="h-7 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                  }}
                />
                <span className="hidden text-[16px] font-black tracking-tight text-slate-900">PROGRAMERS</span>
              </div>
              <div className="text-right">
                <h2 className="text-[13px] font-bold text-slate-900">Programers International</h2>
                <p className="text-[12px] font-bold text-slate-900">[ Cash Receipt ]</p>
              </div>
            </div>

            {/* 2. Metadata Section (Order No, Date, To on left; Box, Original, Receipt No on right) */}
            <div className="mt-4 grid grid-cols-2 items-start gap-4">
              <div className="space-y-1 text-[11px]">
                <div className="flex">
                  <span className="w-16 font-bold text-slate-800">Order No :</span>
                  <span className="font-medium text-slate-700">{payment.orderId || '—'}</span>
                </div>
                <div className="flex">
                  <span className="w-16 font-bold text-slate-800">Date       :</span>
                  <span className="font-medium text-slate-700">{fmtReceiptDate(payment.date)}</span>
                </div>
                <div className="flex">
                  <span className="w-16 font-bold text-slate-800">To          :</span>
                  <span className="font-medium text-slate-700">{payment.customer || '—'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end text-right">
                <div className="border border-slate-800 px-3 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-slate-900">
                  PAYMENT RECEIPT
                </div>
                <p className="mt-2 text-[14px] font-bold text-slate-900">Original</p>
                <p className="text-[11px] text-slate-700">
                  Receipt No: <span className="font-bold text-slate-900">RCP-{payment.paymentId}</span>
                </p>
              </div>
            </div>

            {/* 3. Main Items Table (Identical 5-column structure & dashed borders) */}
            <div className="mt-4 border border-dashed border-slate-700 text-[11.5px]">
              {/* Table Header */}
              <div className="grid grid-cols-12 border-b border-dashed border-slate-700 bg-slate-50/50 py-1.5 font-bold text-slate-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-7 px-2">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-1 text-right">Rate</div>
                <div className="col-span-2 pr-3 text-right">Amount</div>
              </div>

              {/* Table Body */}
              <div className="min-h-[160px] py-2">
                <div className="grid grid-cols-12 py-1 text-slate-800">
                  <div className="col-span-1 text-center font-normal">1</div>
                  <div className="col-span-7 px-2 font-normal">
                    <p className="font-medium text-slate-900">
                      PAYMENT RECEIVED - ORDER #{payment.orderId}{stageStr}
                    </p>
                    <div className="mt-1.5 space-y-0.5 text-[10.5px] text-slate-600">
                      <p>• Payment Mode: {(payment.method || 'Cash').toUpperCase()}</p>
                      {payment.reference && <p>• Txn / Ref No: {payment.reference.toUpperCase()}</p>}
                      {payment.invoiceId && <p>• Invoice Reference: {payment.invoiceId}</p>}
                      {payment.notes && <p>• Remarks: {payment.notes}</p>}
                    </div>

                    {summary && summary.orderValue > 0 && (
                      <p className="mt-3 text-[10px] font-semibold text-slate-700">
                        [ Order Value: Rs. {fmtAmount(summary.orderValue)} | Prev. Paid: Rs. {fmtAmount(previouslyReceived)} | Balance: Rs. {fmtAmount(balance)} ]
                      </p>
                    )}
                  </div>
                  <div className="col-span-1 text-right text-slate-700">1</div>
                  <div className="col-span-1 text-right font-medium text-slate-800">{fmtAmount(payment.amount)}</div>
                  <div className="col-span-2 pr-3 text-right font-medium text-slate-900">{fmtAmount(payment.amount)}</div>
                </div>
              </div>

              {/* Sub Total Row */}
              <div className="grid grid-cols-12 border-t border-dashed border-slate-700 py-1.5 font-bold text-slate-900">
                <div className="col-span-10 pr-2 text-right">Sub Total</div>
                <div className="col-span-2 pr-3 text-right">{fmtAmount(payment.amount)}</div>
              </div>

              {/* Total & Words Row */}
              <div className="grid grid-cols-12 items-center border-t border-dashed border-slate-700 py-1.5 text-slate-900">
                <div className="col-span-8 pl-2 text-[10px] font-bold text-slate-800">
                  {numberToWords(payment.amount)}
                </div>
                <div className="col-span-2 text-right text-[11px] font-bold">Total</div>
                <div className="col-span-2 pr-3 text-right text-[12px] font-bold">{fmtAmount(payment.amount)}</div>
              </div>
            </div>

            {/* 4. Notice Box on Left & Digital Signature on Right */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {/* Left notice box with dashed border */}
              <div className="flex flex-col justify-center rounded border border-dashed border-slate-700 p-3 text-center text-[8.5px] leading-relaxed text-slate-600">
                <p>All Payments should be made by cash/cheque/UPI payable to</p>
                <p>Programers International. Claims are accepted only before</p>
                <p>delivery.</p>
              </div>

              {/* Right Digital signature block */}
              <div className="flex flex-col items-center justify-center text-center text-slate-800">
                <p className="text-[10px] font-bold">For Programers International</p>
                <p className="mt-1 text-[10.5px] font-bold text-slate-900">Authorized Signature Valid</p>
                <p className="mt-0.5 text-[9px] text-slate-600">Digitally signed by {signer}</p>
                <p className="text-[8.5px] text-slate-500">Date: {dateStamp}</p>
                <p className="text-[8.5px] text-slate-500">Location: Thrissur</p>
              </div>
            </div>

            {/* 5. Bottom Address Footer Banner */}
            <div className="mt-5 border-t border-slate-900 pt-2 text-center text-slate-900">
              <p className="text-[11.5px] font-bold">Programers International</p>
              <p className="text-[9.5px] text-slate-600">
                4th Floor, Park House ,Round North, Thrissur, Kerala, India - 680 001 | info@programers.in,
              </p>
              <p className="text-[10px] font-bold">
                www.programers.in | Ph: 9447151442, 9495951442, 9446451442
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ReceiptModal;
