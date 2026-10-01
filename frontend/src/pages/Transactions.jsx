import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import Layout from '../layouts/Layout';
import { useTransactions, addTransaction, deleteTransaction } from '../store/transactionStore';
import { useCategories, useSubcategories } from '../store/categorySubcategoryStore';
import { useIncomeHeads, useExpenseHeads } from '../store/transactionHeadStore';
import { fmtINR, fmtDate } from '../data/mockData';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500';

const BANK_LIST = [
  'HDFC BANK',
  'ICICI BANK',
  'AXIS BANK',
  'STATE BANK OF INDIA',
  'KOTAK MAHINDRA BANK',
  'BANK OF BARODA',
];

function Transactions() {
  const transactions = useTransactions();
  const categories = useCategories();
  const subcategories = useSubcategories();
  const incomeHeads = useIncomeHeads();
  const expenseHeads = useExpenseHeads();

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [txType, setTxType] = useState('Expense'); // Income, Expense
  const [head, setHead] = useState('');
  const [category, setCategory] = useState('Administrative');
  const [subcategory, setSubcategory] = useState('Office Stationery');
  const [amount, setAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank'); // Cash, Bank, Both
  const [bankPaymentType, setBankPaymentType] = useState('UPI'); // UPI, Card
  const [bankName, setBankName] = useState('HDFC BANK');
  const [description, setDescription] = useState('');

  const headOptions = useMemo(() => (txType === 'Income' ? incomeHeads : expenseHeads), [txType, incomeHeads, expenseHeads]);
  const activeHead = headOptions.includes(head) ? head : headOptions[0] || '';

  const categoryOptions = categories.map((c) => c.name);
  const activeCategory = categoryOptions.includes(category) ? category : categoryOptions[0] || '';
  const subcategoryOptions = subcategories.filter((s) => s.categoryName === activeCategory).map((s) => s.name);
  const activeSubcategory = subcategoryOptions.includes(subcategory) ? subcategory : subcategoryOptions[0] || '';

  // Table Filter State
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.trim().toLowerCase();
      if (
        q &&
        !`${t.id} ${t.type} ${t.head} ${t.category} ${t.subcategory} ${t.bankName} ${t.description}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [transactions, search, dateFrom, dateTo]);

  const totalIncomeAmount = useMemo(() => {
    return filtered.reduce((sum, t) => (t.type === 'Income' ? sum + (Number(t.amount) || 0) : sum), 0);
  }, [filtered]);

  const totalExpenseAmount = useMemo(() => {
    return filtered.reduce((sum, t) => (t.type === 'Expense' ? sum + (Number(t.amount) || 0) : sum), 0);
  }, [filtered]);

  const handleCategoryChange = (e) => {
    const next = e.target.value;
    setCategory(next);
    setSubcategory(subcategories.filter((s) => s.categoryName === next).map((s) => s.name)[0] || '');
  };

  const handleTypeChange = (next) => {
    setTxType(next);
    setHead(next === 'Income' ? incomeHeads[0] || '' : expenseHeads[0] || '');
  };

  const handleResetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setHead(txType === 'Income' ? incomeHeads[0] || '' : expenseHeads[0] || '');
    setCategory(categoryOptions[0] || 'Administrative');
    setSubcategory(subcategories.filter((s) => s.categoryName === (categoryOptions[0] || 'Administrative')).map((s) => s.name)[0] || '');
    setAmount('');
    setCashAmount('');
    setBankAmount('');
    setPaymentMethod('Bank');
    setBankPaymentType('UPI');
    setBankName('HDFC BANK');
    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalAmount;
    if (paymentMethod === 'Both') {
      finalAmount = (Number(cashAmount) || 0) + (Number(bankAmount) || 0);
      if (finalAmount <= 0) {
        alert('Please enter a valid Cash Amount or Bank Amount.');
        return;
      }
    } else {
      finalAmount = Number(amount);
      if (!amount || finalAmount <= 0) {
        alert('Please enter a valid transaction amount.');
        return;
      }
    }

    const res = await addTransaction({
      type: txType,
      date,
      head: activeHead,
      category: activeCategory,
      subcategory: activeSubcategory,
      amount: finalAmount,
      cashAmount: paymentMethod === 'Both' ? (Number(cashAmount) || 0) : 0,
      bankAmount: paymentMethod === 'Both' ? (Number(bankAmount) || 0) : 0,
      paymentMethod,
      bankPaymentType: paymentMethod !== 'Cash' ? bankPaymentType : '',
      bankName: paymentMethod !== 'Cash' ? bankName : '',
      description,
    });
    if (!res.ok) {
      alert('Failed to save the transaction. Please try again.');
      return;
    }
    handleResetForm();
  };

  const downloadPdf = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 36;

    const fmtPdfAmt = (val) => {
      const num = Number(val) || 0;
      return 'Rs. ' + new Intl.NumberFormat('en-IN').format(num);
    };

    const cols = [
      { label: 'Date', w: 75, align: 'left' },
      { label: 'Type', w: 70, align: 'left' },
      { label: 'Head', w: 120, align: 'left' },
      { label: 'Category & Subcategory', w: 145, align: 'left' },
      { label: 'Payment Method', w: 120, align: 'left' },
      { label: 'Amount', w: 85, align: 'right' },
      { label: 'Description', w: 155, align: 'left' },
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
      doc.addImage(dataUrl, 'PNG', M, 10, 130, 26);
      logoLoaded = true;
    } catch {
      /* fallback */
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

    // 3. Header Title & Period
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('TRANSACTIONS REPORT', rightX, 30, { align: 'right' });

    const period = `${dateFrom ? fmtDate(dateFrom) : 'All'} — ${dateTo ? fmtDate(dateTo) : 'All'}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Period: ${period}   |   Generated: ${new Date().toLocaleString('en-IN')}`, rightX, 47, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(M, 57, rightX, 57);

    let y = 66;

    // 4. Header Renderer
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

    // 5. Data Rows
    filtered.forEach((t, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      const descLines = t.description
        ? doc.splitTextToSize(String(t.description), colMeta[6].w - 12)
        : [];
      const numLines = Math.max(1, descLines.length);
      const currentRowH = Math.max(28, 16 + numLines * 9.5);

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

      // Col 0: Date
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(fmtDate(t.date), colMeta[0].leftX, y + (currentRowH / 2) + 2.5);

      // Col 1: Type
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const typeColor = t.type === 'Income' ? [16, 185, 129] : [225, 29, 72];
      doc.setTextColor(...typeColor);
      doc.text(t.type.toUpperCase(), colMeta[1].leftX, y + (currentRowH / 2) + 2.5);

      // Col 2: Head
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(fitText(t.head, colMeta[2].w - 8), colMeta[2].leftX, y + (currentRowH / 2) + 2.5);

      // Col 3: Category & Subcategory
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(51, 65, 85);
      doc.text(fitText(t.category, colMeta[3].w - 8), colMeta[3].leftX, y + 11);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      doc.text(fitText(t.subcategory, colMeta[3].w - 8), colMeta[3].leftX, y + 21);

      // Col 4: Payment Method
      const methodText =
        t.paymentMethod !== 'Cash'
          ? `${t.paymentMethod} (${t.bankPaymentType || 'Bank'}) · ${t.bankName || 'HDFC BANK'}`
          : 'Cash';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(fitText(methodText, colMeta[4].w - 8), colMeta[4].leftX, y + (currentRowH / 2) + 2.5);

      // Col 5: Amount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...typeColor);
      doc.text(fmtPdfAmt(t.amount), colMeta[5].rightX, y + (currentRowH / 2) + 2.5, { align: 'right' });

      // Col 6: Description
      if (descLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        descLines.forEach((line, lIdx) => {
          doc.text(line, colMeta[6].leftX, y + 11 + lIdx * 9.5);
        });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('—', colMeta[6].leftX, y + (currentRowH / 2) + 2.5);
      }

      y += currentRowH;
    });

    if (filtered.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(M, y, totalTableW, 35, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('No transactions found matching filter criteria.', M + totalTableW / 2, y + 22, { align: 'center' });
      y += 35;
    }

    // 6. Totals Row
    if (filtered.length > 0) {
      if (y + 24 > H - 45) {
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
      doc.text('TOTAL INCOME', M + 8, y + 15.5);
      doc.setTextColor(16, 185, 129);
      doc.text(fmtPdfAmt(totalIncomeAmount), colMeta[5].rightX, y + 15.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL EXPENSE', colMeta[2].leftX, y + 15.5);
      doc.setTextColor(225, 29, 72);
      doc.text(fmtPdfAmt(totalExpenseAmount), colMeta[3].rightX, y + 15.5, { align: 'right' });
    }

    // 7. Page Footer
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(M, H - 24, rightX, H - 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Account Soft — Confidential Transactions Report', M, H - 12);
      doc.text(`Page ${p} of ${totalPages}`, rightX, H - 12, { align: 'right' });
    }

    doc.save(`Transactions_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Layout active="transactions">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">Record and manage income and expense transactions by head, category, subcategory and payment method.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side Form (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">New Transaction Entry</h2>
            <p className="mt-0.5 text-xs text-slate-400">Fill in transaction details to log an income or expense.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Transaction Type */}
              <div>
                <label className={labelCls}>Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Income', 'Expense'].map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => handleTypeChange(tp)}
                      className={`h-9 rounded-lg border text-[13px] font-medium transition ${
                        txType === tp
                          ? tp === 'Income'
                            ? 'border-emerald-600 bg-emerald-600 text-white font-semibold shadow-sm'
                            : 'border-rose-500 bg-rose-500 text-white font-semibold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="tx-date" className={labelCls}>Date</label>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Head */}
              <div>
                <label htmlFor="tx-head" className={labelCls}>{txType === 'Income' ? 'Income Head' : 'Expense Head'}</label>
                <select
                  id="tx-head"
                  value={activeHead}
                  onChange={(e) => setHead(e.target.value)}
                  className={inputCls}
                >
                  {headOptions.length === 0 && (
                    <option value="">No {txType === 'Income' ? 'income' : 'expense'} heads configured</option>
                  )}
                  {headOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="tx-category" className={labelCls}>Category</label>
                <select
                  id="tx-category"
                  value={activeCategory}
                  onChange={handleCategoryChange}
                  className={inputCls}
                >
                  {categoryOptions.length === 0 && <option value="">No categories available</option>}
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label htmlFor="tx-subcat" className={labelCls}>Subcategory</label>
                <select
                  id="tx-subcat"
                  value={activeSubcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className={inputCls}
                >
                  {subcategoryOptions.length === 0 && <option value="">No subcategories</option>}
                  {subcategoryOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* PAYMENT METHOD */}
              <div>
                <label className={labelCls}>Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'Bank', 'Both'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`h-9 rounded-lg border text-[13px] font-medium transition ${
                        paymentMethod === m
                          ? 'border-slate-900 bg-slate-100 text-slate-900 font-semibold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Fields based on Payment Method */}
              {paymentMethod === 'Both' ? (
                <div className="space-y-3.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                  {/* SELECT BANK */}
                  <div>
                    <label htmlFor="tx-bankname-both" className={labelCls}>Select Bank</label>
                    <select
                      id="tx-bankname-both"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={inputCls}
                    >
                      {BANK_LIST.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* CASH AMOUNT (₹) */}
                  <div>
                    <label htmlFor="tx-cash-amt" className={labelCls}>Cash Amount (₹)</label>
                    <input
                      id="tx-cash-amt"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* BANK AMOUNT (₹) */}
                  <div>
                    <label htmlFor="tx-bank-amt" className={labelCls}>Bank Amount (₹)</label>
                    <input
                      id="tx-bank-amt"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              ) : paymentMethod === 'Bank' ? (
                <div className="space-y-3.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                  {/* BANK PAYMENT TYPE */}
                  <div>
                    <label className={labelCls}>Bank Payment Type</label>
                    <div className="mt-1.5 flex items-center gap-5 text-[13px] text-slate-700">
                      {['UPI', 'Card'].map((tpge) => (
                        <label key={tpge} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="bankPaymentType"
                            value={tpge}
                            checked={bankPaymentType === tpge}
                            onChange={(e) => setBankPaymentType(e.target.value)}
                            className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                          />
                          <span>{tpge}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SELECT BANK */}
                  <div>
                    <label htmlFor="tx-bankname" className={labelCls}>Select Bank</label>
                    <select
                      id="tx-bankname"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={inputCls}
                    >
                      {BANK_LIST.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Single Amount */}
                  <div>
                    <label htmlFor="tx-amount" className={labelCls}>Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">₹</span>
                      <input
                        id="tx-amount"
                        type="number"
                        min="1"
                        placeholder="e.g. 5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`${inputCls} pl-7`}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Cash Only */
                <div>
                  <label htmlFor="tx-amount" className={labelCls}>Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">₹</span>
                    <input
                      id="tx-amount"
                      type="number"
                      min="1"
                      placeholder="e.g. 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`${inputCls} pl-7`}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label htmlFor="tx-desc" className={labelCls}>Description</label>
                <textarea
                  id="tx-desc"
                  rows="2.5"
                  placeholder="Enter detailed description or remarks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 h-9 rounded-lg bg-slate-900 text-[13px] font-medium text-white transition hover:bg-slate-800 shadow-sm active:scale-[0.99]"
                >
                  Save Transaction
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side Table (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Top Toolbar */}
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
                <div>
                  <label htmlFor="tx-search" className={labelCls}>Search</label>
                  <input
                    id="tx-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search type, head, category, bank or notes..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="tx-from" className={labelCls}>From Date</label>
                  <input id="tx-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="tx-to" className={labelCls}>To Date</label>
                  <input id="tx-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={downloadPdf}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Head</th>
                    <th className="px-4 py-2.5 font-semibold">Category / Sub</th>
                    <th className="px-4 py-2.5 font-semibold">Payment Method</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const isIncome = t.type === 'Income';
                    return (
                      <tr key={t.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                            isIncome
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-600'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{t.head}</span>
                            </div>
                            <span className="mt-0.5 text-[11.5px] text-slate-400">{fmtDate(t.date)}</span>
                            {t.description && (
                              <span className="mt-0.5 text-[11.5px] leading-tight text-slate-500">{t.description}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700">{t.category}</span>
                            <span className="text-[11.5px] text-slate-400">{t.subcategory}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                              {t.paymentMethod}
                            </span>
                            {t.paymentMethod === 'Both' ? (
                              <span className="mt-1 text-[11px] text-slate-500">
                                Cash: {fmtINR(t.cashAmount || 0)} · Bank: {fmtINR(t.bankAmount || 0)} ({t.bankName || 'Bank'})
                              </span>
                            ) : t.paymentMethod !== 'Cash' ? (
                              <span className="mt-1 text-[11px] text-slate-500">
                                {t.bankPaymentType && `${t.bankPaymentType} · `}{t.bankName}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {fmtINR(t.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteTransaction(t.id)}
                            className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete entry"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center">
                        <p className="text-sm text-slate-400">No transactions found.</p>
                        <p className="mt-1 text-[12.5px] text-slate-400">Add a new entry using the form on the left.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50/60">
                      <td colSpan="4" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Totals</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-600">{fmtINR(totalIncomeAmount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-600">{fmtINR(totalExpenseAmount)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[12px] text-slate-400">
              <span>Showing {filtered.length} of {transactions.length} entries</span>
              {filtered.length > 0 && (
                <span className="text-[11.5px] text-slate-400">
                  <span className="font-medium text-emerald-600">Income {fmtINR(totalIncomeAmount)}</span>
                  <span> · </span>
                  <span className="font-medium text-rose-600">Expense {fmtINR(totalExpenseAmount)}</span>
                  <span> · Net {fmtINR(totalIncomeAmount - totalExpenseAmount)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Transactions;