import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import Layout from '../layouts/Layout';
import { useJournal, getJournalSummary } from '../store/journalStore';
import { fmtINR, fmtDate } from '../data/mockData';

const SOURCE_BADGE = {
  Bank: 'border-sky-200 bg-sky-50 text-sky-700',
  Cash: 'border-amber-200 bg-amber-50 text-amber-700',
};

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400';

const fmtNet = (v) => (v < 0 ? `-${fmtINR(Math.abs(v))}` : fmtINR(v));

function Stat({ label, value, sub, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-[17px] font-semibold tracking-tight ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10.5px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Journal() {
  const entries = useJournal();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const summary = useMemo(() => getJournalSummary(entries), [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        const q = search.trim().toLowerCase();
        if (q && !`${e.id} ${e.customer} ${e.particular} ${e.particularsDetail}`.toLowerCase().includes(q)) return false;
        if (sourceFilter !== 'All' && e.source !== sourceFilter) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [entries, search, sourceFilter, dateFrom, dateTo]
  );

  const filteredIncome = filtered.reduce((s, e) => s + e.income, 0);
  const filteredExpense = filtered.reduce((s, e) => s + e.expense, 0);

  const clearFilters = () => {
    setSearch('');
    setSourceFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  const downloadPdf = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 36;
    const rowH = 28;

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

    const fmtPdfNet = (val) => {
      const num = Number(val) || 0;
      if (num === 0) return 'Rs. 0';
      const prefix = num < 0 ? '-Rs. ' : 'Rs. ';
      return `${prefix}${new Intl.NumberFormat('en-IN').format(Math.abs(num))}`;
    };

    const cols = [
      { label: 'Payment ID', w: 85, align: 'left' },
      { label: 'Date', w: 75, align: 'center' },
      { label: 'Particulars', w: 320, align: 'left' },
      { label: 'Income', w: 100, align: 'right' },
      { label: 'Expense', w: 100, align: 'right' },
      { label: 'Source', w: 90, align: 'center' },
    ];

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

    // 1. Top Accent Line
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 4, 'F');

    // 2. Company Brand & Logo
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
      doc.addImage(dataUrl, 'PNG', M, 12, 140, 30);
      logoLoaded = true;
    } catch {
      /* fallback */
    }

    if (!logoLoaded) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('PROGRAMERS', M, 30);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ACCOUNT SOFT', M, 49);

    // 3. Document Title & Period Info (Right-aligned to avoid logo collision)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('FINANCIAL JOURNAL REPORT', rightX, 32, { align: 'right' });

    const period = `${dateFrom ? fmtDate(dateFrom) : 'All'} — ${dateTo ? fmtDate(dateTo) : 'All'}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Period: ${period}   |   Generated: ${new Date().toLocaleString('en-IN')}`, rightX, 48, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(M, 58, rightX, 58);

    let y = 66;

    // 4. Table Header Renderer
    const headerH = 23;
    const drawTableHeader = (yy) => {
      doc.setFillColor(30, 41, 59);
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
    const partCol = colMeta.find((c) => c.label === 'Particulars');
    filtered.forEach((e, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      const subLines = e.particularsDetail ? doc.splitTextToSize(String(e.particularsDetail), (partCol?.w || 300) - 8) : [];
      const numSubLines = subLines.length;
      const currentRowH = Math.max(28, 16 + numSubLines * 9.5);

      if (y + currentRowH > H - 45) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 4, 'F');
        y = drawTableHeader(M);
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(M, y, totalTableW, currentRowH, 'F');

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(M, y + currentRowH, rightX, y + currentRowH);

      colMeta.forEach((c) => {
        if (c.label === 'Particulars') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(fitText(e.customer || e.id, c.w - 8), c.leftX, y + 11);

          if (subLines.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.2);
            doc.setTextColor(100, 116, 139);
            subLines.forEach((line, lineIdx) => {
              doc.text(line, c.leftX, y + 20 + lineIdx * 9.5);
            });
          }
        } else {
          let val = '—';
          let color = [51, 65, 85];
          let fontStyle = 'normal';

          if (c.label === 'Payment ID') {
            val = e.id || '—';
            fontStyle = 'bold';
            color = [30, 41, 59];
          } else if (c.label === 'Date') {
            val = fmtDate(e.date);
            color = [71, 85, 105];
          } else if (c.label === 'Income') {
            val = fmtPdfAmt(e.income);
            if (e.income) {
              color = [4, 120, 87];
              fontStyle = 'bold';
            }
          } else if (c.label === 'Expense') {
            val = fmtPdfAmt(e.expense);
            if (e.expense) {
              color = [225, 29, 72];
              fontStyle = 'bold';
            }
          } else if (c.label === 'Source') {
            val = e.source || '—';
            color = e.source === 'Bank' ? [3, 105, 161] : [180, 83, 9];
            fontStyle = 'bold';
          }

          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(8.5);
          doc.setTextColor(color[0], color[1], color[2]);
          const cx = c.align === 'left' ? c.leftX : c.align === 'center' ? c.centerX : c.rightX;
          const cellY = y + (currentRowH / 2) + 2.5;
          doc.text(String(val), cx, cellY, { align: c.align });
        }
      });

      y += currentRowH;
    });

    if (filtered.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(M, y, totalTableW, 35, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('No journal entries found matching current filter criteria.', M + totalTableW / 2, y + 22, { align: 'center' });
      y += 35;
    }

    // 7. Totals Row
    if (filtered.length > 0) {
      if (y + 26 > H - 45) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 4, 'F');
        y = M;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(M, y, totalTableW, 24, 'F');

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.8);
      doc.line(M, y, rightX, y);
      doc.line(M, y + 24, rightX, y + 24);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);

      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL SUMMARY', M + 8, y + 15.5);

      const incomeCol = colMeta.find((c) => c.label === 'Income');
      if (incomeCol) {
        doc.setTextColor(4, 120, 87);
        doc.text(fmtPdfTotal(filteredIncome), incomeCol.rightX, y + 15.5, { align: 'right' });
      }

      const expenseCol = colMeta.find((c) => c.label === 'Expense');
      if (expenseCol) {
        doc.setTextColor(225, 29, 72);
        doc.text(fmtPdfTotal(filteredExpense), expenseCol.rightX, y + 15.5, { align: 'right' });
      }
    }

    // 8. Page Numbers & Footers
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(M, H - 24, rightX, H - 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Account Soft — Confidential Financial Journal', M, H - 12);
      doc.text(`Page ${p} of ${totalPages}`, rightX, H - 12, { align: 'right' });
    }

    const filename = `Journal_Report_${dateFrom || 'all'}_to_${dateTo || 'all'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  return (
    <Layout active="journal">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Journal</h1>
      <p className="mt-1 text-sm text-slate-500">Read-only cash & bank book — every movement recorded in the app appears here automatically.</p>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Stat label="Total Income" value={fmtINR(summary.income)} sub="money received" tone="text-emerald-700" />
        <Stat label="Total Expense" value={fmtINR(summary.expense)} sub="money spent" tone="text-rose-600" />
        <Stat label="Entries" value={summary.count} sub="recorded transactions" tone="text-sky-600" />
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5 xl:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
            <div>
              <label htmlFor="jn-search" className={labelCls}>Search</label>
              <input
                id="jn-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payment id, customer or reference"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="jn-srcfilter" className={labelCls}>Source</label>
              <select id="jn-srcfilter" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={inputCls}>
                <option value="All">All Sources</option>
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label htmlFor="jn-from" className={labelCls}>From</label>
              <input id="jn-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="jn-to" className={labelCls}>To</label>
              <input id="jn-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
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
                onClick={clearFilters}
                className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-semibold">Payment ID</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Particular</th>
                <th className="px-4 py-2.5 text-right font-semibold">Income</th>
                <th className="px-4 py-2.5 text-right font-semibold">Expense</th>
                <th className="px-4 py-2.5 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">{e.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(e.date)}</td>
                  <td className="max-w-[360px] px-4 py-3 text-slate-800">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{e.customer}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium tracking-tight ${
                          e.docType === 'Refund'
                            ? 'border border-rose-200 bg-rose-50 text-rose-700'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}>
                          {e.docType}
                        </span>
                      </div>
                      {e.particularsDetail && (
                        <div className="mt-0.5 text-[11.5px] leading-tight text-slate-500">{e.particularsDetail}</div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-700">
                    {e.income ? fmtINR(e.income) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">
                    {e.expense ? fmtINR(e.expense) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${SOURCE_BADGE[e.source] ?? 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                      {e.source}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-400">No journal entries found.</p>
                    <p className="mt-1 text-[12.5px] text-slate-400">Record a payment in the Payments module and it will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td colSpan="3" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">{fmtINR(filteredIncome)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-600">{fmtINR(filteredExpense)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-[12px] text-slate-400">
          <span>Showing {filtered.length} of {entries.length} entries</span>
        </div>
      </div>
    </Layout>
  );
}

export default Journal;