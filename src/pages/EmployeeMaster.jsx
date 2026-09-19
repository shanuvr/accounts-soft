import { useMemo, useState } from 'react';
import { useEmployees, addEmployee, updateEmployee, deleteEmployee } from '../store/employeeStore';
import { useDepartments } from '../store/departmentStore';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const EMPTY = { name: '', department: 'Operations' };

function DepartmentBadge({ department }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
      {department}
    </span>
  );
}

export default function EmployeeMaster() {
  const employees = useEmployees();
  const departments = useDepartments();
  const [form, setForm] = useState(EMPTY);
  const [editingName, setEditingName] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const beginAdd = () => {
    setForm(EMPTY);
    setEditingName(null);
    setError('');
  };

  const beginEdit = (emp) => {
    setForm({ name: emp.name, department: emp.department });
    setEditingName(emp.name);
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Employee name is required.');
      return;
    }
    const result = editingName
      ? updateEmployee(editingName, { department: form.department })
      : addEmployee({ name: form.name, department: form.department });
    if (!result.ok) {
      setError(result.reason === 'duplicate' ? 'An employee with this name already exists.' : 'Could not save employee.');
      return;
    }
    beginAdd();
  };

  const remove = (emp) => {
    if (window.confirm(`Delete "${emp.name}" from the employee master?`)) {
      deleteEmployee(emp.name);
      if (editingName === emp.name) beginAdd();
    }
  };

  return (
    <Layout active="masters">
      <div className="p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Employee Master</h1>
            <p className="mt-1 text-sm text-slate-500">Employees available when assigning services.</p>
          </div>
          <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{employees.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Employees</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Side Form (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{editingName ? 'Edit Employee' : 'Add New Employee'}</h2>
                  <p className="text-[11.5px] text-slate-400">Specify employee name and department.</p>
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
                    Employee Name<span className="text-rose-500"> *</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Ravi Kumar"
                    disabled={!!editingName}
                    className={`${inputCls} ${editingName ? 'cursor-not-allowed bg-slate-50' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Department<span className="text-rose-500"> *</span>
                  </label>
                  <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inputCls}>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
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
                    {editingName ? 'Save Changes' : 'Save Employee'}
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
                  <h3 className="text-sm font-semibold text-slate-900">Employee List</h3>
                  <p className="text-[11.5px] text-slate-400">Total {employees.length} employees registered</p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search employees or department..."
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
                      <th className="px-5 py-3 font-semibold">Employee Name</th>
                      <th className="px-5 py-3 font-semibold">Department</th>
                      <th className="px-5 py-3 text-center font-semibold w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp, idx) => (
                      <tr key={emp.name} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 text-slate-400 text-[12px]">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{emp.name}</td>
                        <td className="px-5 py-3">
                          <DepartmentBadge department={emp.department} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => beginEdit(emp)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit employee"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(emp)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete employee"
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
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                          No employees found matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[12px] text-slate-400">
                <span>Showing {filteredEmployees.length} employees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}