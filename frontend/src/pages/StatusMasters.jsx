import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';
import { useStatuses, STATUS_GROUPS, addStatus, updateStatus, deleteStatus } from '../store/statusStore';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const GROUP_LABELS = {
  order: 'Order Status',
  ptda: 'PTDA Status',
  assignment: 'Assignment Status',
  delivery: 'Delivery Status',
  payment: 'Payment Status',
};

export default function StatusMasters() {
  const statuses = useStatuses();
  const [group, setGroup] = useState('order');
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [terminal, setTerminal] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return statuses
      .filter((s) => s.group === group)
      .filter((s) => {
        if (!q) return true;
        return `${s.name} ${s.label}`.toLowerCase().includes(q);
      });
  }, [statuses, group, search]);

  const beginAdd = () => {
    setName('');
    setLabel('');
    setTerminal(false);
    setEditingName(null);
    setError('');
  };

  const beginEdit = (s) => {
    setName(s.name);
    setLabel(s.label);
    setTerminal(s.isTerminal);
    setEditingName(s.name);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Status name is required.');
      return;
    }
    setSaving(true);
    const result = editingName
      ? await updateStatus(group, editingName, { label, isTerminal: terminal })
      : await addStatus(group, { name: name.trim(), label: label.trim() || name.trim(), isTerminal: terminal });
    setSaving(false);
    if (!result.ok) {
      setError(result.reason === 'duplicate' ? 'A status with this name already exists.' : 'Could not save status.');
      return;
    }
    beginAdd();
  };

  const remove = async (s) => {
    if (window.confirm(`Delete "${s.name}"?`)) {
      await deleteStatus(group, s.name);
      if (editingName === s.name) beginAdd();
    }
  };

  return (
    <Layout active="masters">
      <div className="p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Status Masters</h1>
            <p className="mt-1 text-sm text-slate-500">Centralized status configuration for each module.</p>
          </div>
          <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{statuses.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Statuses</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition ${
                group === g
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/25'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {GROUP_LABELS[g]} ({statuses.filter((s) => s.group === g).length})
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{editingName ? 'Edit Status' : 'Add New Status'}</h2>
                  <p className="text-[11.5px] text-slate-400">{GROUP_LABELS[group]}</p>
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
                    Status Name<span className="text-rose-500"> *</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. In Progress"
                    disabled={!!editingName}
                    className={`${inputCls} ${editingName ? 'cursor-not-allowed bg-slate-50' : ''}`}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Display Label</label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. In Progress"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Terminal State</label>
                  <div className="flex gap-2">
                    {[false, true].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setTerminal(val)}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${
                          terminal === val
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {val ? 'Terminal' : 'Open'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-[12px] font-medium text-rose-600">{error}</p>}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-[13px] font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 active:scale-[0.99] disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingName ? 'Save Changes' : 'Save Status'}
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
                  <h3 className="text-sm font-semibold text-slate-900">{GROUP_LABELS[group]} List</h3>
                  <p className="text-[11.5px] text-slate-400">Total {rows.length} statuses configured</p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search statuses..."
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
                      <th className="px-5 py-3 font-semibold">Label</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 text-center font-semibold w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s, idx) => (
                      <tr key={`${s.group}-${s.name}`} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 text-slate-400 text-[12px]">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{s.name}</td>
                        <td className="px-5 py-3 text-slate-600">{s.label}</td>
                        <td className="px-5 py-3">
                          {s.isTerminal ? (
                            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700">
                              Terminal
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              Open
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => beginEdit(s)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(s)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                          No statuses found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[12px] text-slate-400">
                <span>Showing {rows.length} statuses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}