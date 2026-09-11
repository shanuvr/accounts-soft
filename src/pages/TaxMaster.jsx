import { useState } from 'react';
import { useTaxMaster, addTax, updateTax, deleteTax } from '../store/taxStore';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const TAX_TYPES = ['CGST + SGST', 'IGST', 'Exempt', 'Other'];

const EMPTY = { name: '', rate: '', type: 'CGST + SGST' };

function TypeBadge({ type }) {
  const cls =
    type === 'Exempt'
      ? 'bg-slate-100 text-slate-500'
      : type === 'IGST'
        ? 'bg-indigo-50 text-indigo-700'
        : 'bg-emerald-50 text-emerald-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {type}
    </span>
  );
}

export default function TaxMaster() {
  const taxes = useTaxMaster();
  const [form, setForm] = useState(EMPTY);
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const beginAdd = () => {
    setForm(EMPTY);
    setEditingName(null);
    setError('');
  };

  const beginEdit = (t) => {
    setForm({ name: t.name, rate: String(t.rate), type: t.type });
    setEditingName(t.name);
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Tax name is required.');
      return;
    }
    if (form.rate === '' || Number(form.rate) < 0) {
      setError('Enter a valid rate.');
      return;
    }
    const payload = { rate: form.rate, type: form.type };
    const result = editingName ? updateTax(editingName, payload) : addTax({ ...payload, name: form.name });
    if (!result.ok) {
      setError(result.reason === 'duplicate' ? 'A tax with this name already exists.' : 'Could not save tax.');
      return;
    }
    beginAdd();
  };

  const remove = (t) => {
    if (window.confirm(`Delete "${t.name}"?`)) {
      deleteTax(t.name);
      if (editingName === t.name) beginAdd();
    }
  };

  return (
    <Layout active="masters">
      <div className="p-5">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Tax Master</h1>
            <p className="text-[13px] text-slate-400">Tax rates used when generating invoices.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-xl font-semibold text-emerald-600">{taxes.length}</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Taxes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-700">{editingName ? 'Edit Tax' : 'Add Tax'}</p>
                {editingName && (
                  <button type="button" onClick={beginAdd} className="text-[12px] font-medium text-emerald-600 hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-600">
                    Tax Name<span className="text-red-400"> *</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. GST 18%"
                    disabled={!!editingName}
                    className={`${inputCls} ${editingName ? 'cursor-not-allowed bg-slate-50' : ''}`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-600">
                    Rate (%)<span className="text-red-400"> *</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rate}
                    onChange={(e) => set('rate', e.target.value)}
                    placeholder="e.g. 18"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-600">Tax Type</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                    {TAX_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-[12px] font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="mt-1 w-full rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
                >
                  {editingName ? 'Save Changes' : 'Add Tax'}
                </button>
              </div>
            </form>
          </div>

          <div className="xl:col-span-3">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[13px] font-semibold text-slate-700">Tax List</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {taxes.map((t) => (
                  <li key={t.name} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{t.name}</p>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {t.rate}%
                        </span>
                      </div>
                      <div className="mt-1">
                        <TypeBadge type={t.type} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => beginEdit(t)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(t)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
                {taxes.length === 0 && (
                  <li className="px-4 py-10 text-center text-[13px] text-slate-400">
                    No taxes yet. Add your first tax using the form on the left.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}