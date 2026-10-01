import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  useIncomeExpenseHeads,
  addHead,
  updateHead,
  deleteHead,
} from '../store/transactionHeadStore';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400';

function IncomeExpenseHeadMaster() {
  const heads = useIncomeExpenseHeads();

  const [type, setType] = useState('Income'); // Income, Expense
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { type, name }
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return heads.filter((h) => {
      if (typeFilter && h.type !== typeFilter) return false;
      if (q && !`${h.type} ${h.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [heads, search, typeFilter]);

  const incomeCount = heads.filter((h) => h.type === 'Income').length;
  const expenseCount = heads.filter((h) => h.type === 'Expense').length;

  const beginAdd = () => {
    setName('');
    setEditing(null);
    setError('');
  };

  const beginEdit = (h) => {
    setType(h.type);
    setName(h.name);
    setEditing({ type: h.type, name: h.name });
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Head name is required.');
      return;
    }
    setSaving(true);
    const result = editing ? await updateHead(editing, name) : await addHead({ type, name });
    setSaving(false);
    if (!result.ok) {
      setError(
        result.reason === 'duplicate' ? 'This head already exists.' :
        result.reason === 'notfound' ? 'The head could not be found to update.' :
        'Could not save.'
      );
      return;
    }
    beginAdd();
  };

  const remove = (h) => {
    setConfirm({
      title: 'Delete head',
      message: `Delete "${h.name}" (${h.type})? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const result = await deleteHead({ type: h.type, name: h.name });
        if (!result.ok) {
          setError(
            result.reason === 'notfound'
              ? 'This head could not be found to delete.'
              : 'Could not delete the head.'
          );
        }
        if (editing?.name === h.name) beginAdd();
        setConfirm(null);
      },
    });
  };

  return (
    <Layout active="masters">
      <div className="px-5 pb-5 pt-0">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Income &amp; Expense Master</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage the income and expense head options available in the Transactions module.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{incomeCount}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Income</p>
            <span className="mx-1 h-4 w-px bg-slate-200" />
            <p className="text-xl font-bold text-rose-500">{expenseCount}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Expense</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Side Form */}
          <div className="lg:col-span-5 xl:col-span-4">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{editing ? 'Edit Head' : 'Add New Head'}</h2>
                  <p className="text-[11.5px] text-slate-400">Specify the head name and its type.</p>
                </div>
                {editing && (
                  <button type="button" onClick={beginAdd} className="text-[12px] font-medium text-emerald-600 hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Income', 'Expense'].map((tp) => (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => setType(tp)}
                        className={`h-9 rounded-lg border text-[13px] font-medium transition ${
                          type === tp
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

                <div>
                  <label className={labelCls}>Name <span className="text-rose-500">*</span></label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === 'Income' ? 'e.g. Consulting Fees' : 'e.g. Office Supplies'}
                    className={inputCls}
                    required
                  />
                </div>

                {error && <p className="text-[12px] font-medium text-rose-600">{error}</p>}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-[13px] font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 active:scale-[0.99] disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Head'}
                  </button>
                  {editing && (
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

          {/* Right Side Table */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Heads List</h3>
                  <p className="text-[11.5px] text-slate-400">Total {heads.length} records configured</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    aria-label="Filter by type"
                    className="h-9 w-[130px] rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">All Types</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search heads..."
                    className={`${inputCls} w-full sm:w-52`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold w-12">#</th>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold w-28">Type</th>
                      <th className="px-5 py-3 text-center font-semibold w-36">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((h, idx) => (
                      <tr key={h.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 text-slate-400 text-[12px]">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{h.name}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                            h.type === 'Income'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-600'
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => beginEdit(h)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(h)}
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
                        <td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                          No heads found matching search.
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
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </Layout>
  );
}

export default IncomeExpenseHeadMaster;