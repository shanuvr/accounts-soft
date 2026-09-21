import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500';

export default function SimpleMaster({
  active = 'masters',
  title,
  subtitle,
  counterLabel,
  namePlaceholder = 'Enter name...',
  items = [],
  addItem,
  updateItem,
  deleteItem,
  fields = [],
}) {
  const blank = () => Object.fromEntries(fields.map((f) => [f.key, '']));
  const [form, setForm] = useState(blank);
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      `${it.name} ${fields.map((f) => it[f.key] ?? '').join(' ')}`.toLowerCase().includes(q)
    );
  }, [items, search, fields]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const beginAdd = () => {
    setForm(blank());
    setEditingName(null);
    setError('');
  };

  const beginEdit = (it) => {
    setForm(Object.fromEntries(fields.map((f) => [f.key, it[f.key] ?? ''])));
    setEditingName(it.name);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    const extras = Object.fromEntries(fields.filter((f) => f.key !== 'name').map((f) => [f.key, form[f.key]]));
    const result = editingName
      ? await updateItem(editingName, extras)
      : await addItem({ name: form.name.trim(), ...extras });
    setSaving(false);
    if (!result.ok) {
      setError(result.reason === 'duplicate' ? 'This item already exists.' : 'Could not save.');
      return;
    }
    beginAdd();
  };

  const remove = async (name) => {
    if (window.confirm(`Delete "${name}"?`)) {
      await deleteItem(name);
      if (editingName === name) beginAdd();
    }
  };

  return (
    <Layout active={active}>
      <div className="p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{items.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{counterLabel}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{editingName ? `Edit ${title}` : `Add New ${title}`}</h2>
                  <p className="text-[11.5px] text-slate-400">Specify details to manage {title.toLowerCase()} records.</p>
                </div>
                {editingName && (
                  <button type="button" onClick={beginAdd} className="text-[12px] font-medium text-emerald-600 hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Name<span className="text-rose-500"> *</span></label>
                  <input
                    value={form.name ?? ''}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder={namePlaceholder}
                    className={inputCls}
                    required
                  />
                </div>

                {fields.filter((f) => f.key !== 'name').map((f) => (
                  <Field key={f.key} field={f} value={form[f.key] ?? ''} onChange={(v) => set(f.key, v)} labelCls={labelCls} inputCls={inputCls} editing={!!editingName} />
                ))}

                {error && <p className="text-[12px] font-medium text-rose-600">{error}</p>}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-[13px] font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 active:scale-[0.99] disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingName ? 'Save Changes' : `Save ${title}`}
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

          <div className="lg:col-span-7 xl:col-span-8">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{title} List</h3>
                  <p className="text-[11.5px] text-slate-400">Total {items.length} records configured</p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${title.toLowerCase()}...`}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold w-12">#</th>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      {fields.filter((f) => f.key !== 'name').map((f) => (
                        <th key={f.key} className="px-5 py-3 font-semibold">{f.label}</th>
                      ))}
                      <th className="px-5 py-3 text-center font-semibold w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((it, idx) => (
                      <tr key={it.name} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 text-slate-400 text-[12px]">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{it.name}</td>
                        {fields.filter((f) => f.key !== 'name').map((f) => (
                          <td key={f.key} className="px-5 py-3 text-slate-600">{it[f.key] || '—'}</td>
                        ))}
                        <td className="whitespace-nowrap px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => beginEdit(it)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(it.name)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={fields.filter((f) => f.key !== 'name').length + 3} className="px-5 py-12 text-center text-slate-400">
                          No records found matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[12px] text-slate-400">
                <span>Showing {filtered.length} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ field, value, onChange, labelCls, inputCls, editing }) {
  const locked = editing && field.lockOnEdit;
  return (
    <div>
      <label className={labelCls}>
        {field.label}
        {field.required && <span className="text-rose-500"> *</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`${inputCls} h-auto py-2`}
        />
      ) : (
        <input
          type={field.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={locked}
          className={`${inputCls} ${locked ? 'cursor-not-allowed bg-slate-50' : ''}`}
          required={field.required}
        />
      )}
    </div>
  );
}