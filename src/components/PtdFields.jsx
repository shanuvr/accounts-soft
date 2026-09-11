import { PTD_TEMPLATES } from '../data/ptdTemplates';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function Field({ f, value, readOnly, onChange }) {
  if (readOnly) {
    return (
      <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{f.label}</p>
        <p className="mt-0.5 whitespace-pre-wrap text-[13px] font-medium text-slate-800">{value || '—'}</p>
      </div>
    );
  }
  const set = (v) => onChange(f.key, v);

  if (f.type === 'select') {
    return (
      <div key={f.key}>
        <label htmlFor={`pf-${f.key}`} className="mb-1 block text-[12px] font-medium text-slate-600">
          {f.label}{f.required && <span className="text-red-400"> *</span>}
        </label>
        <select id={`pf-${f.key}`} value={value || ''} onChange={(e) => set(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (f.type === 'textarea') {
    return (
      <div key={f.key} className="md:col-span-2">
        <label htmlFor={`pf-${f.key}`} className="mb-1 block text-[12px] font-medium text-slate-600">
          {f.label}{f.required && <span className="text-red-400"> *</span>}
        </label>
        <textarea id={`pf-${f.key}`} rows={3} value={value || ''} onChange={(e) => set(e.target.value)} className={`${inputCls} min-h-[70px] resize-y py-2`} />
      </div>
    );
  }

  return (
    <div key={f.key}>
      <label htmlFor={`pf-${f.key}`} className="mb-1 block text-[12px] font-medium text-slate-600">
        {f.label}{f.required && <span className="text-red-400"> *</span>}
      </label>
      <input id={`pf-${f.key}`} type={f.type} value={value || ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} className={inputCls} />
    </div>
  );
}

export default function PtdFields({ template, values, readOnly = false, onChange }) {
  const t = PTD_TEMPLATES[template] ?? PTD_TEMPLATES.generic;
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">{t.title}</p>
      <div className={`mt-2.5 grid grid-cols-1 md:grid-cols-2 ${readOnly ? 'gap-x-8 gap-y-2.5' : 'gap-3.5'}`}>
        {t.fields.map((f) => (
          <Field key={f.key} f={f} value={values?.[f.key]} readOnly={readOnly} onChange={onChange} />
        ))}
      </div>
    </>
  );
}