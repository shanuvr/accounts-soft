import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import Layout from '../layouts/Layout';
import { usePtds, createOrUpdatePtd } from '../store/ptdStore';
import { useAssignments } from '../store/assignmentStore';
import PtdFields from '../components/PtdFields';
import { PTD_TEMPLATES } from '../data/ptdTemplates';
import { fmtDate, fmtINR } from '../data/mockData';

const PTD_STATUS_COLORS = {
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PTD_STATUS_COLORS[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function Info({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{children}</span>
    </div>
  );
}

function PtdDetail() {
  const { ptdId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ptds = usePtds();
  const assignments = useAssignments();
  const record = ptds.find((p) => p.id === ptdId);
  const allocatedHours = record ? assignments.find((a) => a.orderId === record.orderId && a.serviceName === record.serviceName)?.allocatedHours ?? 0 : 0;

  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [draft, setDraft] = useState(() => (record ? { ...record.data } : {}));
  const [billable, setBillable] = useState(record?.billable ?? true);
  const [price, setPrice] = useState(record?.price ?? 0);

  if (!record) {
    return (
      <Layout active="ptd">
        <button type="button" onClick={() => navigate('/ptd')} className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to PTD
        </button>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-500">PTD {ptdId} was not found.</p>
        </div>
      </Layout>
    );
  }

  const tpl = PTD_TEMPLATES[record.template ?? 'generic'];
  const labelOf = (key) => tpl?.fields?.find((f) => f.key === key)?.label ?? key;

  const metaRows = [
    ['Service', record.serviceName],
    ['Customer', record.customer],
    ['Order', record.orderId],
    ['Status', record.status],
    ['Billing', record.billable === false ? 'Non-Billable' : 'Billable'],
    ['Price', record.billable === false ? '—' : fmtINR(Number(record.price) || 0)],
    ['Created By', record.createdBy ?? '—'],
    ['Last Updated', fmtDate(record.updatedAt)],
  ];

  const startEdit = () => {
    setDraft({ ...record.data });
    setBillable(record.billable ?? true);
    setPrice(record.price ?? 0);
    setEditing(true);
  };

  const save = (targetStatus) => {
    createOrUpdatePtd({
      orderId: record.orderId,
      customer: record.customer,
      serviceName: record.serviceName,
      template: record.template,
      status: targetStatus,
      data: draft,
      billable,
      price: billable ? Math.max(0, Number(price) || 0) : 0,
    });
    setEditing(false);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 40;
    const contentW = W - M * 2;
    let y = 0;

    const newPageIfNeeded = (cur) => (cur > H - 80 ? (doc.addPage(), 60) : cur);

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, W, 68, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('PTD — Technical Details', M, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(record.id, W - M, 40, { align: 'right' });
    doc.setFontSize(9);
    doc.text(record.serviceName, W - M, 54, { align: 'right' });

    y = 95;
    doc.setTextColor(30, 35, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(record.customer, M, y);
    y += 16;

    const row = (label, value) => {
      const labelText = String(label);
      const valueText = String(value ?? '') === '' ? '—' : String(value);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(110, 115, 125);
      doc.text(labelText.toUpperCase(), M, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 35, 40);
      const lines = doc.splitTextToSize(valueText, contentW - 140);
      doc.text(lines, M + 145, y);
      const height = Math.max(1, lines.length) * 13 + 6;
      y += height;
      if (y > H - 80) {
        doc.setDrawColor(225, 225, 230);
        doc.setLineWidth(0.75);
        doc.line(M, y - 6, W - M, y - 6);
        y = newPageIfNeeded(y);
      }
    };

    metaRows.forEach(([label, value]) => row(label, value));

    y = newPageIfNeeded(y + 10);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 20, 25);
    doc.text(tpl?.title ?? 'Technical Information', M, y);
    y += 14;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.2);
    doc.line(M, y - 4, W - M, y - 4);

    const entries = Object.entries(record.data ?? {});
    if (entries.length === 0) {
      row('Notes', 'No technical data recorded.');
    }
    entries.forEach(([key, value]) => row(labelOf(key), value));

    y = newPageIfNeeded(y + 6);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 145, 155);
    doc.text(`Generated on ${new Date().toLocaleString()} · Account Soft`, M, y);

    doc.save(`${record.id}.pdf`);
  };

  return (
    <Layout active="ptd">
      {/* Back + title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate('/ptd')} className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to PTD
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{record.id}</h1>
            <span className="text-slate-400">/</span>
            <span className="text-[15px] text-slate-600">{record.serviceName}</span>
            <span className="text-slate-400">·</span>
            <span className="text-[15px] text-slate-600">{record.customer}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={record.status} />
          <button
            type="button"
            onClick={downloadPdf}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Info + fields */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">PTD Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-10 px-5 py-1 sm:grid-cols-2">
          <div className="divide-y divide-slate-100">
            <Info label="Order">
              <button type="button" onClick={() => navigate(`/orders/${record.orderId}`)} className="font-medium text-emerald-600 hover:underline">
                {record.orderId}
              </button>
            </Info>
            <Info label="Service">{record.serviceName}</Info>
            <Info label="Created By">{record.createdBy ?? '—'}</Info>
          </div>
          <div className="divide-y divide-slate-100">
            <Info label="Customer">{record.customer}</Info>
            <Info label="Allocated Hours">{allocatedHours > 0 ? <>{allocatedHours} hrs</> : '—'}</Info>
            <Info label="Status"><Badge status={record.status} /></Info>
            <Info label="Billing">
              {editing ? (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBillable(true)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                        billable ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Billable
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillable(false)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                        !billable ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Non-Billable
                    </button>
                  </div>
                  {billable && (
                    <div className="relative">
                      <input
                        id="ptd-detail-price"
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-7 w-32 rounded-md border border-slate-200 bg-white pr-7 pl-2 text-[12px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] text-slate-400">₹</span>
                    </div>
                  )}
                </div>
              ) : billable === false ? (
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">Non-Billable</span>
              ) : (
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">Billable</span>
              )}
            </Info>
            <Info label="Price">{billable === false ? '—' : fmtINR(Number(record.price) || 0)}</Info>
            <Info label="Last Updated">{fmtDate(record.updatedAt)}</Info>
          </div>
        </div>
      </div>

      {/* Technical fields */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Technical Information</h2>
        </div>
        <div className="px-5 py-3">
          <PtdFields
            template={record.template}
            values={editing ? draft : record.data}
            readOnly={!editing}
            onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={() => save('Draft')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                Save Draft
              </button>
              <button type="button" onClick={() => save('Completed')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                Save PTD
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate(`/orders/${record.orderId}`)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-5Z" />
                  <path d="M4 7h16M9 12h6" />
                </svg>
                View Order
              </button>
              <button type="button" onClick={startEdit} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                Edit PTD
              </button>
            </>
          )}
        </div>
      </div>

      {/* Print-only representation (portal outside the app frame) */}
      {createPortal(
        <div id="ptd-print-area" className="hidden bg-white p-8">
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Account Soft</p>
              <h1 className="text-xl font-bold text-slate-900">PTD — Technical Details</h1>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-700">{record.id}</p>
              <p className="text-xs text-slate-500">{record.serviceName}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3">
            {metaRows.map(([label, value]) => (
              <div key={label} className="py-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>
          <h2 className="mt-6 border-t border-slate-200 pt-4 text-sm font-bold uppercase tracking-wider text-slate-600">
            {tpl?.title ?? 'Technical Information'}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(record.data ?? {}).map(([key, value]) => (
              <div key={key} className="py-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{labelOf(key)}</p>
                <p className="whitespace-pre-wrap text-sm font-medium text-slate-800">{value || '—'}</p>
              </div>
            ))}
            {Object.keys(record.data ?? {}).length === 0 && (
              <p className="py-2 text-sm text-slate-400">No technical data recorded.</p>
            )}
          </div>
          <p className="mt-8 text-[11px] text-slate-400">Generated on {new Date().toLocaleString()} · Account Soft</p>
        </div>,
        document.body
      )}
    </Layout>
  );
}

export default PtdDetail;