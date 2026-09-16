import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import Layout from '../layouts/Layout';
import { useLedger } from '../store/ledgerStore';
import { fmtINR, fmtDate } from '../data/mockData';

const BOOK_BADGE = {
  Bank: 'border-sky-200 bg-sky-50 text-sky-700',
  Cash: 'border-amber-200 bg-amber-50 text-amber-700',
};

const shortCustomer = (name) => (name || '—').replace(/\s*Pvt Ltd\s*$/i, '');

function Ledger() {
  const { entries } = useLedger();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [type, setType] = useState('All');

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (type !== 'All' && e.book !== type) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [entries, dateFrom, dateTo, type]
  );

  const totals = useMemo(
    () => ({
      debit: filtered.reduce((s, e) => s + e.debit, 0),
      credit: filtered.reduce((s, e) => s + e.credit, 0),
    }),
    [filtered]
  );

  const inputCls = 'h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400';

  const downloadPdf = async () => {
    // Landscape A4 has 841.89pt width x 595.28pt height
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 36;
    const rowH = 21;

    // Currency formatters for PDF using pure ASCII 'Rs. ' to prevent jsPDF Helvetica glyph corruption
    const fmtPdfAmt = (val) => {
      if (val === null || val === undefined || val === '' || val === 0) return '—';
      const num = Number(val);
      if (isNaN(num) || num === 0) return '—';
      return 'Rs. ' + new Intl.NumberFormat('en-IN').format(num);
    };

    const fmtPdfTotal = (val) => {
      const num = Number(val) || 0;
      return 'Rs. ' + new Intl.NumberFormat('en-IN').format(num);
    };

    const fmtPdfBal = (val) => {
      if (val === undefined || val === null) return '—';
      const num = Number(val);
      if (isNaN(num)) return '—';
      if (num === 0) return 'Rs. 0';
      const prefix = num < 0 ? '-Rs. ' : 'Rs. ';
      return `${prefix}${new Intl.NumberFormat('en-IN').format(Math.abs(num))}`;
    };

    // 10 columns totaling exactly 770 pt (centered headings & data, generous gap between Project Ref & Type)
    const cols = [
      { label: 'Date', w: 68, align: 'center' },
      { label: 'Particulars', w: 78, align: 'center' },
      { label: 'Customer', w: 115, align: 'center' },
      { label: 'Project Ref', w: 75, align: 'center' },
      { label: 'Type', w: 50, align: 'center' },
      { label: 'Invoice Amt', w: 76, align: 'center' },
      { label: 'Tax / TDS', w: 58, align: 'center' },
      { label: 'Debit', w: 83, align: 'center' },
      { label: 'Credit', w: 83, align: 'center' },
      { label: 'Running Bal', w: 84, align: 'center' },
    ];

    // Pre-calculate exact sub-pixel column positions so headers, rows, and totals align identically
    let curX = M;
    const colMeta = cols.map((c) => {
      const x = curX;
      curX += c.w;
      return {
        ...c,
        x,
        leftX: x + 6,
        centerX: x + c.w / 2,
        rightX: x + c.w - 6,
      };
    });
    const totalTableW = curX - M; // 770 pt
    const rightX = M + totalTableW;

    const fitText = (text, maxW) => {
      const s = String(text ?? '—');
      if (doc.getTextWidth(s) <= maxW) return s;
      let t = s;
      while (doc.getTextWidth(t + '…') > maxW && t.length > 0) t = t.slice(0, -1);
      return t + '…';
    };

    // 1. Top Executive Accent Line (Dark Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 4, 'F');

    // 2. Company Brand & Logo (scaled with true 4.665 aspect ratio for crispness)
    let logoLoaded = false;
    try {
      const res = await fetch('/programers-logo-BLACCK.png');
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      doc.addImage(dataUrl, 'PNG', M, 16, 165, 35.4);
      logoLoaded = true;
    } catch {
      /* fallback text below */
    }

    if (!logoLoaded) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('PROGRAMERS', M, 36);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ACCOUNT SOFT  ·  FINANCIAL LEDGER REPORT', M, 60);

    // 3. Document Title & Period Information (Right-aligned, prominent header hierarchy)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('STATEMENT OF ACCOUNT', rightX, 32, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('General Ledger · Transaction Register & Running Balances', rightX, 47, { align: 'right' });

    const period = `${dateFrom ? fmtDate(dateFrom) : 'All'} — ${dateTo ? fmtDate(dateTo) : 'All'}`;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${period}   |   Generated: ${new Date().toLocaleString('en-IN')}`, rightX, 60, { align: 'right' });

    // Subtle header divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(M, 69, rightX, 69);

    // 4. Executive KPI Summary Cards: Total Debit, Total Credit, Total Running Balance
    const netPosition = totals.debit - totals.credit;
    const cards = [
      { label: 'TOTAL DEBIT', val: fmtPdfTotal(totals.debit), accent: [30, 41, 59] },
      { label: 'TOTAL CREDIT', val: fmtPdfTotal(totals.credit), accent: [4, 120, 87] },
      { label: 'TOTAL RUNNING BALANCE', val: fmtPdfBal(netPosition), accent: [37, 99, 235] },
    ];

    const cardGap = 14;
    const cardW = (totalTableW - cardGap * (cards.length - 1)) / cards.length;
    const cardY = 77;
    const cardH = 40;

    cards.forEach((c, idx) => {
      const cx = M + idx * (cardW + cardGap);
      // Box background & border
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(cx, cardY, cardW, cardH, 2.5, 2.5, 'FD');

      // Left color accent bar
      doc.setFillColor(c.accent[0], c.accent[1], c.accent[2]);
      doc.roundedRect(cx, cardY, 2.5, cardH, 1, 1, 'F');

      // Card Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cx + 10, cardY + 14);

      // Card Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(c.val, cx + 10, cardY + 31);
    });

    let y = cardY + cardH + 14;

    // 5. Table Header Renderer
    const headerH = 23;
    const drawTableHeader = (yy) => {
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(M, yy, totalTableW, headerH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);

      colMeta.forEach((c) => {
        const cx = c.align === 'left' ? c.leftX : c.align === 'center' ? c.centerX : c.rightX;
        doc.text(c.label.toUpperCase(), cx, yy + 15, { align: c.align });
      });
      return yy + headerH;
    };

    y = drawTableHeader(y);

    // 6. Data Rows
    filtered.forEach((e, i) => {
      if (y > H - 55) {
        doc.addPage();
        y = 35;
        y = drawTableHeader(y);
      }

      // Zebra striping: Slate-50 vs pure white
      const isOdd = i % 2 === 1;
      doc.setFillColor(isOdd ? 248 : 255, isOdd ? 250 : 255, isOdd ? 252 : 255);
      doc.rect(M, y, totalTableW, rowH, 'F');

      // Bottom row separator hairline
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.4);
      doc.line(M, y + rowH, M + totalTableW, y + rowH);

      const vals = [
        fmtDate(e.date),
        e.docId || '—',
        shortCustomer(e.customer),
        e.projectReference || '—',
        e.book || '—',
        fmtPdfAmt(e.invoiceAmount),
        fmtPdfAmt(e.taxTds),
        fmtPdfAmt(e.debit),
        fmtPdfAmt(e.credit),
        fmtPdfBal(e.balance),
      ];

      doc.setFontSize(8.5);
      colMeta.forEach((c, ci) => {
        if (ci === 1) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42); // Doc ID bold
        } else if (ci === 2) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42); // Customer bold
        } else if (ci === 7) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42); // Debit bold
        } else if (ci === 8) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(4, 120, 87); // Credit subtle deep forest
        } else if (ci === 9) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42); // Balance bold
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(ci === 0 || ci === 3 || ci === 4 ? 71 : 30, ci === 0 || ci === 3 || ci === 4 ? 85 : 41, ci === 0 || ci === 3 || ci === 4 ? 105 : 59);
        }

        const cx = c.align === 'left' ? c.leftX : c.align === 'center' ? c.centerX : c.rightX;
        const textVal = fitText(vals[ci], c.w - 10);
        doc.text(textVal, cx, y + 14, { align: c.align });
      });
      y += rowH;
    });

    // Empty state if no records
    if (filtered.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(M, y, totalTableW, 30, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('No ledger transactions found matching the selected filters.', W / 2, y + 18, { align: 'center' });
      y += 30;
    }

    // 7. Accounting Totals Row (with double underline)
    if (y > H - 60) {
      doc.addPage();
      y = 35;
      y = drawTableHeader(y);
    }

    const totalRowH = 26;
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(M, y, totalTableW, totalRowH, 'F');

    // Top border line
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.75);
    doc.line(M, y, M + totalTableW, y);

    // Accounting double-underline at bottom
    doc.line(M, y + totalRowH - 2, M + totalTableW, y + totalRowH - 2);
    doc.line(M, y + totalRowH, M + totalTableW, y + totalRowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL MOVEMENT', colMeta[0].leftX, y + 17);

    // Debit Total (col index 7) - exactly centered at colMeta[7].centerX
    doc.text(fmtPdfTotal(totals.debit), colMeta[7].centerX, y + 17, { align: 'center' });

    // Credit Total (col index 8) - exactly centered at colMeta[8].centerX
    doc.setTextColor(4, 120, 87);
    doc.text(fmtPdfTotal(totals.credit), colMeta[8].centerX, y + 17, { align: 'center' });

    // Net Position (col index 9) - exactly centered at colMeta[9].centerX
    doc.setTextColor(15, 23, 42);
    const netStr = netPosition === 0 ? 'Rs. 0' : fmtPdfBal(netPosition);
    doc.text(netStr, colMeta[9].centerX, y + 17, { align: 'center' });

    // 8. Multi-Page Footer (Page numbers, confidentiality & timestamps)
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p += 1) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(M, H - 24, rightX, H - 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Account Soft · Official Financial Statement · Confidential', M, H - 12);
      doc.text(`Period: ${period}`, W / 2, H - 12, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${p} of ${totalPages}`, rightX, H - 12, { align: 'right' });
    }

    doc.save(`Ledger-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Layout active="ledger">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ledger</h1>
      <p className="mt-1 text-sm text-slate-500">Debit and credit entries across the books.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className={labelCls}>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} aria-label="Date from" />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} aria-label="Date to" />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="All">All</option>
              <option value="Bank">Bank</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={downloadPdf}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-4 text-[13px] font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); setType('All'); }}
              className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-center text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-2 py-2 font-semibold">Date</th>
                <th className="px-2 py-2 font-semibold">Particulars</th>
                <th className="px-2 py-2 font-semibold">Customer</th>
                <th className="px-2 py-2 font-semibold">Project Reference</th>
                <th className="px-2 py-2 font-semibold">Type</th>
                <th className="px-2 py-2 text-center font-semibold">Invoice Amount</th>
                <th className="px-2 py-2 text-center font-semibold">Tax / TDS</th>
                <th className="px-2 py-2 text-center font-semibold">Debit</th>
                <th className="px-2 py-2 text-center font-semibold">Credit</th>
                <th className="px-3 py-3 text-center font-semibold">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={`${e.docId}-${i}`} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-2 py-2 text-slate-600">{fmtDate(e.date)}</td>
                  <td className="max-w-[280px] truncate px-2 py-2 text-slate-800">
                    <span className="font-semibold">{e.docId}</span>
                  </td>
                  <td className="max-w-[240px] truncate px-2 py-2 font-medium text-slate-700">
                    {shortCustomer(e.customer)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 font-medium text-emerald-700">
                    {e.projectReference || '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${BOOK_BADGE[e.book] ?? 'border-slate-200 bg-slate-100 text-slate-400'}`}>
                      {e.book ?? '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-center text-slate-700">
                    {e.invoiceAmount ? fmtINR(e.invoiceAmount) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-center text-slate-700">
                    {e.taxTds ? fmtINR(e.taxTds) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-center font-medium text-slate-800">
                    {e.debit ? fmtINR(e.debit) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-center font-medium text-emerald-600">
                    {e.credit ? fmtINR(e.credit) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-center font-semibold">
                    {e.balance === 0 ? (
                      '—'
                    ) : (
                      <span className={e.balance > 0 ? 'text-slate-800' : 'text-emerald-600'}>
                        {fmtINR(Math.abs(e.balance))}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-sm text-slate-400">No ledger entries match your filters.</td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td colSpan="8" className="px-2 py-2 text-center text-[12px] font-semibold uppercase tracking-wider text-slate-500">Total</td>
                  <td className="whitespace-nowrap px-2 py-2 text-center font-semibold text-slate-800">{fmtINR(totals.debit)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-center font-semibold text-emerald-600">{fmtINR(totals.credit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default Ledger;