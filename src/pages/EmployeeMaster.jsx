import { useState } from 'react';
import { useEmployees, addEmployee, updateEmployee, deleteEmployee } from '../store/employeeStore';
import { useDepartments } from '../store/departmentStore';
import Layout from '../layouts/Layout';

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const EMPTY = { name: '', department: 'Operations' };

function DepartmentBadge({ department }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
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
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Employee Master</h1>
            <p className="text-[13px] text-slate-400">Employees available when assigning services.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-xl font-semibold text-emerald-600">{employees.length}</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Employees</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-700">{editingName ? 'Edit Employee' : 'Add Employee'}</p>
                {editingName && (
                  <button type="button" onClick={beginAdd} className="text-[12px] font-medium text-emerald-600 hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-600">
                    Employee Name<span className="text-red-400"> *</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Ravi Kumar"
                    disabled={!!editingName}
                    className={`${inputCls} ${editingName ? 'cursor-not-allowed bg-slate-50' : ''}`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-600">
                    Department<span className="text-red-400"> *</span>
                  </label>
                  <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inputCls}>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-[12px] font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="mt-1 w-full rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
                >
                  {editingName ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>

          <div className="xl:col-span-3">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[13px] font-semibold text-slate-700">Employee List</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <li key={emp.name} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{emp.name}</p>
                      </div>
                      <div className="mt-1">
                        <DepartmentBadge department={emp.department} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => beginEdit(emp)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(emp)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
                {employees.length === 0 && (
                  <li className="px-4 py-10 text-center text-[13px] text-slate-400">
                    No employees yet. Add your first employee using the form on the left.
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