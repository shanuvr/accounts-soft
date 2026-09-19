import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import Layout from '../layouts/Layout';
import { useLedger, withRunningBalance } from '../store/ledgerStore';
import { CUSTOMERS, fmtINR, fmtDate } from '../data/mockData';

const BOOK_BADGE = {
  Bank: 'border-sky-200 bg-sky-50 text-sky-700',
  Cash: 'border-amber-200 bg-amber-50 text-amber-700',
};

const shortCustomer = (name) => (name || '—').replace(/\s*Pvt Ltd\s*$/i, '');

const comboInputCls = 'h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function CustomerFilter({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
        if (query.trim() === '') {
          onChange('All');
        }
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, query, onChange]);

  const trimmed = query.trim().toLowerCase();
  const matches = options.filter((c) => c.toLowerCase().includes(trimmed));
  const showAll = !trimmed || 'all customers'.includes(trimmed);

  const select = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onChange('All');
    setQuery('');
    setOpen(false);
    if (inputRef.current) inputRef.current.blur();
  };

  const optionCls = (selected) =>
    `flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-emerald-50 ${
      selected ? 'font-semibold text-emerald-700' : 'text-slate-700'
    }`;

  const hasSelectionOrQuery = (value && value !== 'All') || query !== '';

  return (
    <div ref={boxRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? query : value === 'All' ? '' : value}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          setOpen(true);
          if (val.trim() === '') {
            onChange('All');
          }
        }}
        onFocus={(e) => {
          setOpen(true);
          setQuery(value === 'All' ? '' : value);
          e.target.select();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (matches.length > 0) {
              select(matches[0]);
            } else if (query.trim() === '') {
              select('All');
            }
          }
        }}
        placeholder="All Customers"
        aria-label="Search customer"
        className={comboInputCls}
      />

      {hasSelectionOrQuery ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          title="Clear customer filter"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )}

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {showAll && (
            <button type="button" onClick={() => select('All')} className={optionCls(value === 'All')}>
              <span>All Customers</span>
              {value === 'All' && <span className="text-emerald-600">✓</span>}
            </button>
          )}
          {matches.map((c) => (
            <button key={c} type="button" onClick={() => select(c)} className={optionCls(value === c)}>
              <span className="truncate">{c}</span>
              {value === c && <span className="shrink-0 text-emerald-600">✓</span>}
            </button>
          ))}
          {matches.length === 0 && !showAll && (
            <p className="px-3 py-3 text-center text-[12.5px] text-slate-400">No customers found.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Ledger() {
  const { entries, register } = useLedger();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [type, setType] = useState('All');

  const customer = searchParams.get('customer') || 'All';
  const setCustomer = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== 'All') next.set('customer', value);
        else next.delete('customer');
        return next;
      },
      { replace: true }
    );
  };

  const customerOptions = useMemo(
    () => [...new Set(entries.map((e) => e.customer))].filter(Boolean).sort(),
    [entries]
  );

  const scoped = useMemo(
    () => withRunningBalance(customer === 'All' ? entries : entries.filter((e) => e.customer === customer)),
    [entries, customer]
  );

  const filtered = useMemo(
    () =>
      scoped.filter((e) => {
        if (type !== 'All' && e.book !== type) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [scoped, dateFrom, dateTo, type]
  );

  const customerSummary = customer !== 'All' ? register.find((r) => r.customer === customer) : null;
  const customerInfo = customer !== 'All' ? CUSTOMERS.find((c) => c.name === customer) : null;

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
    const rowH = 28;

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
      { label: 'Date', w: 60, align: 'center' },
      { label: 'Particulars', w: 155, align: 'left' },
      { label: 'Customer', w: 105, align: 'left' },
      { label: 'Project Ref', w: 70, align: 'center' },
      { label: 'Type', w: 45, align: 'center' },
      { label: 'Invoice Amt', w: 68, align: 'right' },
      { label: 'Tax / TDS', w: 55, align: 'right' },
      { label: 'Debit', w: 70, align: 'right' },
      { label: 'Credit', w: 70, align: 'right' },
      { label: 'Running Bal', w: 72, align: 'right' },
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
      doc.addImage(dataUrl, 'PNG', M, 10, 130, 26);
      logoLoaded = true;
    } catch {
      /* fallback text below */
    }

    if (!logoLoaded) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('PROGRAMERS', M, 28);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ACCOUNT SOFT', M, 50);

    const isCustomerScoped = customer && customer !== 'All';
    const reportTitle = isCustomerScoped ? 'Customer Ledger Report' : 'General Ledger Report';

    // 3. Document Title & Period Information (Right-aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(reportTitle, rightX, 30, { align: 'right' });

    const period = `${dateFrom ? fmtDate(dateFrom) : 'All'} — ${dateTo ? fmtDate(dateTo) : 'All'}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Period: ${period}   |   Generated: ${new Date().toLocaleString('en-IN')}`, rightX, 47, { align: 'right' });

    // Subtle header divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(M, 57, rightX, 57);

    // 3b. Customer details strip (only on customer-scoped statements)
    let customerStripBottom = 0;
    if (isCustomerScoped) {
      const client = customerInfo || {
        customerId: '—',
        name: customer,
        contactPerson: '—',
        phone: '—',
        email: '—',
        type: 'Customer',
        status: 'Active',
      };

      const stripY = 66;
      const stripH = 50;

      // Outer Box: Crisp pure white background with subtle slate border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.setLineWidth(0.6);
      doc.roundedRect(M, stripY, totalTableW, stripH, 3, 3, 'FD');

      // Header Banner Ribbon inside Card
      const bannerH = 17;
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.roundedRect(M, stripY, totalTableW, bannerH, 3, 3, 'F');
      doc.rect(M, stripY + bannerH - 3, totalTableW, 3, 'F'); // square bottom corners of banner

      // Thin divider under banner
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(M, stripY + bannerH, rightX, stripY + bannerH);

      // Banner text right: Customer ID
      if (client.customerId && client.customerId !== '—') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`CUSTOMER ID: ${client.customerId}`, rightX - 12, stripY + 11.5, { align: 'right' });
      }

      // Body - Left zone: Customer Name
      const bodyY = stripY + bannerH;
      const bodyH = stripH - bannerH;
      const leftColW = 240;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(fitText(client.name, leftColW - 20), M + 12, bodyY + (bodyH / 2) + 4);

      // Vertical Divider between Identity and Contact Info
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.6);
      doc.line(M + leftColW, bodyY + 4, M + leftColW, bodyY + bodyH - 4);

      // Body - Right zone: 3 Structured Contact Columns
      const rightAreaX = M + leftColW + 16;
      const rightAreaW = totalTableW - leftColW - 28;
      const contactCols = [
        { label: 'CONTACT PERSON', val: client.contactPerson || '—', w: rightAreaW * 0.33 },
        { label: 'PHONE NUMBER', val: client.phone || '—', w: rightAreaW * 0.31 },
        { label: 'EMAIL ADDRESS', val: client.email || '—', w: rightAreaW * 0.36 },
      ];

      let curCx = rightAreaX;
      contactCols.forEach((col, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(col.label, curCx, bodyY + 11.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(fitText(col.val, col.w - 8), curCx, bodyY + 24.5);

        if (idx < contactCols.length - 1) {
          curCx += col.w;
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.5);
          doc.line(curCx - 8, bodyY + 6, curCx - 8, bodyY + bodyH - 6);
        }
      });

      customerStripBottom = stripY + stripH;
    }

    // 4. Executive KPI Summary Cards: Total Debit, Total Credit, Total Running Balance
    const netPosition = totals.debit - totals.credit;
    const cards = [
      { label: 'TOTAL DEBIT', val: fmtPdfTotal(totals.debit), accent: [30, 41, 59] },
      { label: 'TOTAL CREDIT', val: fmtPdfTotal(totals.credit), accent: [4, 120, 87] },
      { label: 'TOTAL RUNNING BALANCE', val: fmtPdfBal(netPosition), accent: [37, 99, 235] },
    ];

    const cardGap = 14;
    const cardW = (totalTableW - cardGap * (cards.length - 1)) / cards.length;
    const cardY = customerStripBottom ? customerStripBottom + 12 : 77;
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
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      const subLines = e.particularsDetail
        ? doc.splitTextToSize(String(e.particularsDetail), colMeta[1].w - 8)
        : [];
      const numSubLines = subLines.length;
      const currentRowH = Math.max(28, 16 + numSubLines * 9.5);

      if (y + currentRowH > H - 55) {
        doc.addPage();
        y = 35;
        y = drawTableHeader(y);
      }

      // Zebra striping: Slate-50 vs pure white
      const isOdd = i % 2 === 1;
      doc.setFillColor(isOdd ? 248 : 255, isOdd ? 250 : 255, isOdd ? 252 : 255);
      doc.rect(M, y, totalTableW, currentRowH, 'F');

      // Bottom row separator hairline
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.4);
      doc.line(M, y + currentRowH, M + totalTableW, y + currentRowH);

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

      colMeta.forEach((c, ci) => {
        if (ci === 1) {
          // Line 1: Document ID bold
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(fitText(e.docId, c.w - 8), c.leftX, y + 11);

          // Lines 2+: Wrapped details subtext below
          if (subLines.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.2);
            doc.setTextColor(100, 116, 139);
            subLines.forEach((line, lineIdx) => {
              doc.text(line, c.leftX, y + 20 + lineIdx * 9.5);
            });
          }
        } else {
          doc.setFontSize(8.5);
          if (ci === 2) {
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
          const textVal = fitText(vals[ci], c.w - 8);
          const cellY = y + (currentRowH / 2) + 2.5;
          doc.text(textVal, cx, cellY, { align: c.align });
        }
      });
      y += currentRowH;
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
      doc.text(`${isCustomerScoped ? `${shortCustomer(customer)}  ·  ` : ''}Period: ${period}`, W / 2, H - 12, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${p} of ${totalPages}`, rightX, H - 12, { align: 'right' });
    }

    const scope = customer && customer !== 'All' ? `-${shortCustomer(customer).replace(/[^a-z0-9]+/gi, '-')}` : '';
    doc.save(`Ledger${scope}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Layout active="ledger">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ledger</h1>
      <p className="mt-1 text-sm text-slate-500">
        {customer !== 'All' ? `Showing the ledger for ${shortCustomer(customer)} only.` : 'Debit and credit entries across the books.'}
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1fr_auto]">
          <div>
            <label className={labelCls}>Customer</label>
            <CustomerFilter value={customer} options={customerOptions} onChange={setCustomer} />
          </div>
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
              onClick={() => { setCustomer('All'); setDateFrom(''); setDateTo(''); setType('All'); }}
              className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {customerSummary && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-1 gap-5 px-5 py-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] lg:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[15px] font-bold text-emerald-700">
                {customerInfo
                  ? customerInfo.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                  : shortCustomer(customer).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-slate-900">{customer}</p>
                <div className="mt-2 grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12.5px]">
                  <span className="text-slate-400">Customer ID</span>
                  <span className="font-medium text-slate-700">{customerInfo?.customerId ?? '—'}</span>
                  <span className="text-slate-400">Contact</span>
                  <span className="font-medium text-slate-700">{customerInfo?.contactPerson ?? '—'}</span>
                  <span className="text-slate-400">Phone</span>
                  <span className="font-medium text-slate-700">{customerInfo?.phone ?? '—'}</span>
                  <span className="text-slate-400">Email</span>
                  <span className="break-all font-medium text-slate-700">{customerInfo?.email ?? '—'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">Total Debit</p>
                <p className="mt-1 text-[16px] font-semibold text-slate-800">{fmtINR(customerSummary.invoiced)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">Total Credit</p>
                <p className="mt-1 text-[16px] font-semibold text-emerald-700">{fmtINR(customerSummary.received)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <td className="max-w-[320px] px-3 py-2 text-left text-slate-800">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{e.docId}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium tracking-tight ${
                          e.docType === 'Invoice'
                            ? 'border border-slate-200 bg-slate-100 text-slate-700'
                            : e.docType === 'Refund'
                            ? 'border border-rose-200 bg-rose-50 text-rose-700'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}>
                          {e.docType}
                        </span>
                      </div>
                      {e.particularsDetail && (
                        <p className="mt-0.5 text-[11.5px] leading-tight text-slate-500 font-normal">
                          {e.particularsDetail}
                        </p>
                      )}
                    </div>
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