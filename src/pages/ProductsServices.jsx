import { useState } from 'react';
import { useServices, addService, updateService, deleteService } from '../store/serviceStore';
import { useServiceCategories } from '../store/serviceCategoryStore';
import { PTD_TEMPLATES } from '../data/ptdTemplates';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const EMPTY = { name: '', category: '', ptdRequired: true, template: 'generic' };

function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      {category}
    </span>
  );
}

export default function ProductsServices() {
  const services = useServices();
  const serviceCategories = useServiceCategories();
  const [form, setForm] = useState(EMPTY);
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');

  const categories = Array.from(new Set([...services.map((s) => s.category), ...serviceCategories])).filter(Boolean);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const beginAdd = () => {
    setForm(EMPTY);
    setEditingName(null);
    setError('');
  };

  const beginEdit = (service) => {
    setForm({
      name: service.name,
      category: service.category,
      ptdRequired: service.ptdRequired,
      template: service.template || 'generic',
    });
    setEditingName(service.name);
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Service name is required.');
      return;
    }
    const payload = {
      category: form.category,
      ptdRequired: form.ptdRequired,
      template: form.template,
    };
    const result = editingName
      ? updateService(editingName, payload)
      : addService({ ...payload, name: form.name });
    if (!result.ok) {
      setError(result.reason === 'duplicate' ? 'A service with this name already exists.' : 'Could not save service.');
      return;
    }
    beginAdd();
  };

  const remove = (service) => {
    if (window.confirm(`Delete "${service.name}" from the service catalogue?`)) {
      deleteService(service.name);
      if (editingName === service.name) beginAdd();
    }
  };

  return (
    <Layout active="masters">
    <div className="p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Products / Services</h1>
          <p className="text-[13px] text-slate-400">Service catalogue used across orders, PTD and invoicing.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
          <p className="text-xl font-semibold text-emerald-600">{services.length}</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-700">{editingName ? 'Edit Service' : 'Add Service'}</p>
              {editingName && (
                <button type="button" onClick={beginAdd} className="text-[12px] font-medium text-emerald-600 hover:underline">
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">
                  Service Name<span className="text-red-400"> *</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Website Design, SEO / SMO"
                  disabled={!!editingName}
                  className={`${inputCls} ${editingName ? 'cursor-not-allowed bg-slate-50' : ''}`}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="e.g. Design, Marketing"
                  list="svc-categories"
                  className={inputCls}
                />
                <datalist id="svc-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-600">PTD Requirement</label>
                <div className="flex gap-2">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => set('ptdRequired', val)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition ${
                        form.ptdRequired === val
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {val ? 'PTD Required' : 'No PTD'}
                    </button>
                  ))}
                </div>
              </div>

              {form.ptdRequired && (
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-600">PTD Template</label>
                  <select value={form.template} onChange={(e) => set('template', e.target.value)} className={inputCls}>
                    {Object.entries(PTD_TEMPLATES).map(([key, t]) => (
                      <option key={key} value={key}>
                        {t.title} ({key})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-[12px] font-medium text-red-500">{error}</p>}

              <button
                type="submit"
                className="mt-1 w-full rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
              >
                {editingName ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>

        <div className="xl:col-span-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-700">Service Catalogue</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {services.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{s.name}</p>
                      {s.ptdRequired ? (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          PTD Required
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          No PTD
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                      <CategoryBadge category={s.category} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => beginEdit(s)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {services.length === 0 && (
                <li className="px-4 py-10 text-center text-[13px] text-slate-400">
                  No services yet. Add your first service using the form on the left.
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