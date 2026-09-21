import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

export default function MasterCrud({
  active = 'masters',
  title,
  subtitle,
  counterLabel,
  namePlaceholder,
  items = [],
  addItem,
  updateItem,
  deleteItem,
}) {
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.toLowerCase().includes(q));
  }, [items, search]);

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
          {/* Left Side Form (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{editingName ? `Edit ${title}` : `Add New ${title}`}</h2>
                  <p className="text-[11.5px] text-slate-400">Specify details to manage {title.toLowerCase()} records.</p>
                </div>
                {editingName && (
                  <button
                    type="button"
                    onClick={beginAdd}
                    className="text-[12px] font-medium text-emerald-600 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Name<span className="text-rose-500"> *</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={namePlaceholder}
                    className={inputCls}
                    required
                  />
                </div>

                {error && <p className="text-[12px] font-medium text-rose-600">{error}</p>}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-[13px] font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 active:scale-[0.99]"
                  >
                    {editingName ? 'Save Changes' : `Save ${title}`}
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold w-12">#</th>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 text-center font-semibold w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((n, idx) => (
                      <tr key={n} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 text-slate-400 text-[12px]">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{n}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => beginEdit(n)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit item"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(n)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete item"
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
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-5 py-12 text-center text-slate-400">
                          No items found matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[12px] text-slate-400">
                <span>Showing {filteredItems.length} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}