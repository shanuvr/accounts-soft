import { useMemo, useState } from 'react';
import Layout from '../layouts/Layout';
import {
  useCategories,
  useSubcategories,
  addCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
} from '../store/categorySubcategoryStore';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500';

function CategorySubcategoryMaster() {
  const categories = useCategories();
  const subcategories = useSubcategories();

  // Mode: 'category' or 'subcategory'
  const [formMode, setFormMode] = useState('category');
  const [tableTab, setTableTab] = useState('categories');

  // Form Fields - Subcategory
  const [selectedCategoryName, setSelectedCategoryName] = useState(() => categories[0]?.name || 'Administrative');
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');

  // Form Fields - Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Search Filter
  const [search, setSearch] = useState('');

  // Active Category Name fallback
  const activeCategory = selectedCategoryName || (categories[0]?.name || 'Administrative');

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${s.id} ${s.name} ${s.categoryName} ${s.description}`.toLowerCase().includes(q);
    });
  }, [subcategories, search]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${c.id} ${c.name} ${c.description}`.toLowerCase().includes(q);
    });
  }, [categories, search]);

  const handleSubcategorySubmit = (e) => {
    e.preventDefault();
    if (!subName.trim()) {
      alert('Please enter a subcategory name.');
      return;
    }
    addSubcategory({
      categoryName: activeCategory,
      name: subName,
      description: subDesc,
    });
    setSubName('');
    setSubDesc('');
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('Please enter a category name.');
      return;
    }
    const created = addCategory({
      name: catName,
      description: catDesc,
    });
    setSelectedCategoryName(created.name);
    setCatName('');
    setCatDesc('');
    setFormMode('subcategory'); // switch to subcategory after creating category
  };

  return (
    <Layout active="masters">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Category & Subcategory Master</h1>
          <p className="mt-1 text-sm text-slate-500">Manage expense categories and link subcategories for transaction head classification.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side Form (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* Form Mode Switcher Tabs */}
            <div className="mb-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setFormMode('category')}
                className={`flex-1 rounded-md py-1.5 text-[12.5px] font-medium transition ${
                  formMode === 'category'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Category
              </button>
              <button
                type="button"
                onClick={() => setFormMode('subcategory')}
                className={`flex-1 rounded-md py-1.5 text-[12.5px] font-medium transition ${
                  formMode === 'subcategory'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Subcategory
              </button>
            </div>

            {formMode === 'subcategory' ? (
              /* ADD SUBCATEGORY FORM */
              <form onSubmit={handleSubcategorySubmit} className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Add New Subcategory</h2>
                  <p className="text-[11.5px] text-slate-400">Select parent category and specify subcategory details.</p>
                </div>

                {/* Select Parent Category */}
                <div>
                  <label htmlFor="select-parent-cat" className={labelCls}>Select Category</label>
                  <select
                    id="select-parent-cat"
                    value={activeCategory}
                    onChange={(e) => setSelectedCategoryName(e.target.value)}
                    className={inputCls}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Name */}
                <div>
                  <label htmlFor="sub-name" className={labelCls}>Subcategory Name</label>
                  <input
                    id="sub-name"
                    type="text"
                    placeholder="e.g. Office Stationery, Fuel & Transit"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="sub-desc" className={labelCls}>Description (Optional)</label>
                  <textarea
                    id="sub-desc"
                    rows="3"
                    placeholder="Enter short notes or subcategory details..."
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-[13px] font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 active:scale-[0.99]"
                  >
                    Save Subcategory
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSubName(''); setSubDesc(''); }}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            ) : (
              /* ADD CATEGORY FORM */
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Add New Category</h2>
                  <p className="text-[11.5px] text-slate-400">Create a top-level expense category.</p>
                </div>

                {/* Category Name */}
                <div>
                  <label htmlFor="cat-name" className={labelCls}>Category Name</label>
                  <input
                    id="cat-name"
                    type="text"
                    placeholder="e.g. Legal & Professional, Logistics"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="cat-desc" className={labelCls}>Description (Optional)</label>
                  <textarea
                    id="cat-desc"
                    rows="3"
                    placeholder="Enter category description..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-[13px] font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 active:scale-[0.99]"
                  >
                    Save Category
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCatName(''); setCatDesc(''); }}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Side Table (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Table Header Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Table Tabs */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTableTab('categories')}
                  className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition ${
                    tableTab === 'categories'
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/25'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Categories ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab('subcategories')}
                  className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition ${
                    tableTab === 'subcategories'
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/25'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Subcategories ({subcategories.length})
                </button>
              </div>

              {/* Search */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories or subcategories..."
                  className={inputCls}
                />
              </div>
            </div>

            {tableTab === 'subcategories' ? (
              /* SUBCATEGORIES TABLE */
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Subcategory Name</th>
                      <th className="px-4 py-2.5 font-semibold">Parent Category</th>
                      <th className="px-4 py-2.5 font-semibold">Description</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubcategories.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-900 font-semibold">
                          <span>{s.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11.5px] font-medium text-slate-700">
                            {s.categoryName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[12.5px]">
                          {s.description || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteSubcategory(s.id)}
                            className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete Subcategory"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredSubcategories.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-12 text-center text-slate-400">
                          No subcategories found matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CATEGORIES TABLE */
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Category Name</th>
                      <th className="px-4 py-2.5 font-semibold">Linked Subcategories</th>
                      <th className="px-4 py-2.5 font-semibold">Description</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((c) => {
                      const linkedSubs = subcategories.filter((s) => s.categoryName === c.name || s.categoryId === c.id);
                      return (
                        <tr key={c.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                          <td className="px-4 py-3 text-slate-900 font-semibold">
                            <span>{c.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                              {linkedSubs.length} subcategories
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-[12.5px]">
                            {c.description || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => deleteCategory(c.id)}
                              className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Delete Category"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-12 text-center text-slate-400">
                          No categories found matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[12px] text-slate-400">
              <span>
                Showing {tableTab === 'subcategories' ? filteredSubcategories.length : filteredCategories.length} items
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CategorySubcategoryMaster;
