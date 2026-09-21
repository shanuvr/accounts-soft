import { useMemo, useState } from 'react';
import { useTaxMaster, addTax, updateTax, deleteTax } from '../store/taxStore';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const TAX_TYPES = ['CGST + SGST', 'IGST', 'Exempt', 'Other'];

const EMPTY = { name: '', rate: '', type: 'CGST + SGST' };

function TypeBadge({ type }) {
  const cls =
    type === 'Exempt'
      ? 'bg-slate-100 text-slate-600 border-slate-200'
      : type === 'IGST'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {type}
    </span>
  );
}

export default function TaxMaster() {
  const taxes = useTaxMaster();
  const [form, setForm] = useState(EMPTY);
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const filteredTaxes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return taxes;
    return taxes.filter(
      (t) => t.name.toLowerCase().includes(q) || String(t.rate).includes(q) || t.type.toLowerCase().includes(q)
    );
  }, [taxes, search]);

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

  const submit = async (e) => {
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
    const result = editingName ? await updateTax(editingName, payload) : await addTax({ ...payload, name: form.name });
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
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tax Master</h1>
            <p className="mt-1 text-sm text-slate-500">Tax rates used when generating invoices.</p>
          </div>
          <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{taxes.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Taxes</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Side Form (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{editingName ? 'Edit Tax' : 'Add New Tax'}</h2>
                  <p className="text-[11.5px] text-slate-400">Specify tax rate and tax type classification.</p>
                </div>
                {editingName && (
                  <button type="button" onClick={beginAdd} className="text-[12px] font-medium text-emerald-600 hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Tax Name<span className="text-rose-500"> *</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. GST 18%"
                    disabled={!!editingName}
                    className={`${inputCls} ${editingName ? 'cursor-not-allowed bg-slate-50' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Rate (%)<span className="text-rose-500"> *</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rate}
                    onChange={(e) => set('rate', e.target.value)}
                    placeholder="e.g. 18"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Tax Type</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                    {TAX_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-[12px] font-medium text-rose-600">{error}</p>}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-[13px] font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 active:scale-[0.99]"
                  >
                    {editingName ? 'Save Changes' : 'Save Tax'}
                  </button>
                  {editingName && (
                    <button
                      type="button"
                      onClick={beginAdd}
                      className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right Side Table (7 cols) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Header Toolbar */}
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Tax List</h3>
                  <p className="text-[11.5px] text-slate-400">Total {taxes.length} tax rates configured</p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tax name or type..."
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold w-12">#</th>
                      <th className="px-5 py-3 font-semibold">Tax Name</th>
                      <th className="px-5 py-3 font-semibold">Rate (%)</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 text-center font-semibold w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTaxes.map((t, idx) => (
                      <tr key={t.name} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 text-slate-400 text-[12px]">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{t.name}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-700">
                            {t.rate}%
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <TypeBadge type={t.type} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => beginEdit(t)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit tax"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(t)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete tax"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTaxes.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                          No tax records found matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[12px] text-slate-400">
                <span>Showing {filteredTaxes.length} taxes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}