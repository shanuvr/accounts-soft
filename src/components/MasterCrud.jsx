import { useState } from 'react';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

export default function MasterCrud({ active = 'masters', title, subtitle, counterLabel, namePlaceholder, items = [], addItem, updateItem, deleteItem }) {
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');

  const beginAdd = () => {
    setName('');
    setEditingName(null);
    setError('');
  };

  const beginEdit = (n) => {
    setName(n);
    setEditingName(n);
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    const result = editingName ? updateItem(editingName, name) : addItem(name);
    if (!result.ok) {
      setError(result.reason === 'duplicate' ? 'This item already exists.' : 'Could not save.');
      return;
    }
    beginAdd();
  };

  const remove = (n) => {
    if (window.confirm(`Delete "${n}"?`)) {
      deleteItem(n);
      if (editingName === n) beginAdd();
    }
  };

  return (
    <Layout active={active}>
      <div className="p-5">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
            <p className="text-[13px] text-slate-400">{subtitle}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-xl font-semibold text-emerald-600">{items.length}</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{counterLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-700">{editingName ? 'Edit' : 'Add'}</p>
                {editingName && (
                  <button type="button" onClick={beginAdd} className="text-[12px] font-medium text-emerald-600 hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">
                  Name<span className="text-red-400"> *</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={namePlaceholder}
                  className={inputCls}
                />
              </div>

              {error && <p className="mt-3 text-[12px] font-medium text-red-500">{error}</p>}

              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
              >
                {editingName ? 'Save Changes' : `Add ${title}`}
              </button>
            </form>
          </div>

          <div className="xl:col-span-3">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[13px] font-semibold text-slate-700">List</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {items.map((n) => (
                  <li key={n} className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{n}</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => beginEdit(n)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(n)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="px-4 py-10 text-center text-[13px] text-slate-400">
                    No items yet. Add your first {title.toLowerCase()} using the form on the left.
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