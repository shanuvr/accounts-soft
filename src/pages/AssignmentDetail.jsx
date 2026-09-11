import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { useAssignments, createAssignment, reassignAssignment, ASSIGNMENT_STATUSES } from '../store/assignmentStore';
import { getPtdFor } from '../store/ptdStore';
import { useAuth } from '../store/authStore';
import { useEmployees } from '../store/employeeStore';
import { useDepartments } from '../store/departmentStore';
import { fmtDate } from '../data/mockData';

const ASSIGNMENT_STATUS_COLORS = {
  Assigned: 'border-sky-200 bg-sky-50 text-sky-700',
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'On Hold': 'border-orange-200 bg-orange-50 text-orange-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const PRIORITY_COLORS = {
  Low: 'border-slate-200 bg-slate-100 text-slate-600',
  Normal: 'border-slate-200 bg-slate-100 text-slate-600',
  High: 'border-orange-200 bg-orange-50 text-orange-700',
  Urgent: 'border-red-200 bg-red-50 text-red-700',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${ASSIGNMENT_STATUS_COLORS[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.Normal}`}>
      {priority}
    </span>
  );
}

function Info({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{children}</span>
    </div>
  );
}

const fieldCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function ReassignModal({ assignment, onClose, onReassign }) {
  const employees = useEmployees();
  const departments = useDepartments();
  const [employee, setEmployee] = useState('');
  const [team, setTeam] = useState('');
  const [note, setNote] = useState('');

  const valid = employee && team;

  const pickEmployee = (name) => {
    setEmployee(name);
    setTeam(`${employees.find((e) => e.name === name)?.department ?? ''} Team`.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Reassign</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-[12px] text-slate-500">
            {assignment.id} · {assignment.serviceName} ·{' '}
            <span className="text-slate-400">Currently: {assignment.assignedTo}</span>
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="rsn-employee" className="mb-1 block text-[12px] font-medium text-slate-600">Assign To <span className="text-red-400">*</span></label>
              <select id="rsn-employee" value={employee} onChange={(e) => pickEmployee(e.target.value)} className={fieldCls}>
                <option value="">Select Employee</option>
                {employees.map((e) => <option key={e.name} value={e.name}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rsn-team" className="mb-1 block text-[12px] font-medium text-slate-600">Assigned Team <span className="text-red-400">*</span></label>
              <select id="rsn-team" value={team} onChange={(e) => setTeam(e.target.value)} className={fieldCls}>
                <option value="">Select Team</option>
                {departments.map((d) => <option key={d} value={`${d} Team`}>{d} Team</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3.5">
            <label htmlFor="rsn-note" className="mb-1 block text-[12px] font-medium text-slate-600">Reason / Note</label>
            <textarea id="rsn-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why is this being reassigned?"
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onReassign({ assignedTo: employee, assignedTeam: team, note })}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentDetail() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const assignments = useAssignments();
  const assignment = assignments.find((a) => a.id === assignmentId);
  const user = useAuth();
  const employees = useEmployees();
  const departments = useDepartments();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [reassigning, setReassigning] = useState(false);

  if (!assignment) {
    return (
      <Layout active="assignments">
        <button type="button" onClick={() => navigate('/assignments')} className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to Assignments
        </button>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-500">Assignment {assignmentId} was not found.</p>
        </div>
      </Layout>
    );
  }

  const ptd = getPtdFor(assignment.orderId, assignment.serviceName);

  const startEdit = () => {
    setDraft({
      assignedTo: assignment.assignedTo,
      assignedTeam: assignment.assignedTeam,
      assignedOn: assignment.assignedOn,
      expectedDelivery: assignment.expectedDelivery,
      estimatedHours: assignment.estimatedHours ?? 0,
      allocatedHours: assignment.allocatedHours ?? 0,
      priority: assignment.priority,
      status: assignment.status,
      instructions: assignment.instructions,
    });
    setEditing(true);
  };

  const pickEmployee = (name) => {
    setDraft((d) => ({ ...d, assignedTo: name, assignedTeam: `${employees.find((e) => e.name === name)?.department ?? ''} Team`.trim() }));
  };

  const save = () => {
    if (!draft.assignedTo || !draft.assignedTeam || !draft.assignedOn || !draft.expectedDelivery) return;
    createAssignment({ orderId: assignment.orderId, customer: assignment.customer, serviceName: assignment.serviceName, ...draft });
    setEditing(false);
  };

  const reassign = (payload) => {
    reassignAssignment(assignment.id, { ...payload, by: user.name });
    setReassigning(false);
  };

  return (
    <Layout active="assignments">
      {/* Back + title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate('/assignments')} className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to Assignments
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{assignment.id}</h1>
            <span className="text-slate-400">/</span>
            <span className="text-[15px] text-slate-600">{assignment.serviceName}</span>
            <span className="text-slate-400">·</span>
            <span className="text-[15px] text-slate-600">{assignment.customer}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PriorityBadge priority={assignment.priority} />
          <Badge status={assignment.status} />
          {!editing && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/orders/${assignment.orderId}`)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l2-5Z" />
                  <path d="M4 7h16M9 12h6" />
                </svg>
                View Order
              </button>
              <button type="button" onClick={() => setReassigning(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Reassign
              </button>
              <button type="button" onClick={startEdit} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Assignment information */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Assignment Information</h2>
        </div>

        {editing ? (
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-assignee" className="mb-1 block text-[12px] font-medium text-slate-600">Assign To <span className="text-red-400">*</span></label>
                <select id="edit-assignee" value={draft.assignedTo} onChange={(e) => pickEmployee(e.target.value)} className={fieldCls}>
                  <option value="">Select Employee</option>
{employees.map((e) => <option key={e.name} value={e.name}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-team" className="mb-1 block text-[12px] font-medium text-slate-600">Assigned Team <span className="text-red-400">*</span></label>
                <select id="edit-team" value={draft.assignedTeam} onChange={(e) => setDraft((d) => ({ ...d, assignedTeam: e.target.value }))} className={fieldCls}>
                  <option value="">Select Team</option>
                  {departments.map((d) => <option key={d} value={`${d} Team`}>{d} Team</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-assignedon" className="mb-1 block text-[12px] font-medium text-slate-600">Assigned On <span className="text-red-400">*</span></label>
                <input id="edit-assignedon" type="date" value={draft.assignedOn} onChange={(e) => setDraft((d) => ({ ...d, assignedOn: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label htmlFor="edit-expected" className="mb-1 block text-[12px] font-medium text-slate-600">Expected Completion <span className="text-red-400">*</span></label>
                <input id="edit-expected" type="date" value={draft.expectedDelivery} onChange={(e) => setDraft((d) => ({ ...d, expectedDelivery: e.target.value }))} className={fieldCls} />
              </div>
              <div>
                <label htmlFor="edit-priority" className="mb-1 block text-[12px] font-medium text-slate-600">Priority</label>
                <select id="edit-priority" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))} className={fieldCls}>
                  {['Low', 'Normal', 'High', 'Urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-estimate" className="mb-1 block text-[12px] font-medium text-slate-600">Estimated Hours</label>
                <div className="relative">
                  <input id="edit-estimate" type="number" step="0.5" min="0" value={draft.estimatedHours} onChange={(e) => setDraft((d) => ({ ...d, estimatedHours: e.target.value }))} className={`${fieldCls} pr-9`} />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">hrs</span>
                </div>
              </div>
              <div>
                <label htmlFor="edit-allocated" className="mb-1 block text-[12px] font-medium text-slate-600">Allocated Hours</label>
                <div className="relative">
                  <input id="edit-allocated" type="number" step="0.5" min="0" value={draft.allocatedHours} onChange={(e) => setDraft((d) => ({ ...d, allocatedHours: e.target.value }))} className={`${fieldCls} pr-9`} />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-slate-400">hrs</span>
                </div>
              </div>
              <div>
                <label htmlFor="edit-status" className="mb-1 block text-[12px] font-medium text-slate-600">Status</label>
                <select id="edit-status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} className={fieldCls}>
                  {ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-instructions" className="mb-1 block text-[12px] font-medium text-slate-600">Instructions / Remarks</label>
                <textarea id="edit-instructions" rows={3} value={draft.instructions ?? ''} onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))}
                  className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={save} className="rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-500">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-10 px-6 py-2 sm:grid-cols-2">
            <div className="divide-y divide-slate-100">
              <Info label="Order">
                <button type="button" onClick={() => navigate(`/orders/${assignment.orderId}`)} className="font-medium text-emerald-600 hover:underline">
                  {assignment.orderId}
                </button>
              </Info>
              <Info label="Customer">{assignment.customer}</Info>
              <Info label="Service">{assignment.serviceName}</Info>
              <Info label="PTD">
                {ptd ? (
                  <button type="button" onClick={() => navigate(`/orders/${assignment.orderId}`)} className="font-medium text-emerald-600 hover:underline">
                    {ptd.id}
                  </button>
                ) : (
                  '—'
                )}
              </Info>
            </div>
            <div className="divide-y divide-slate-100">
              <Info label="Assigned To">{assignment.assignedTo}</Info>
              <Info label="Assigned Team">{assignment.assignedTeam || '—'}</Info>
              <Info label="Assigned By">{assignment.assignedBy || '—'}</Info>
              <Info label="Assigned On">{assignment.assignedOn ? fmtDate(assignment.assignedOn) : '—'}</Info>
              <Info label="Expected Completion">{assignment.expectedDelivery ? fmtDate(assignment.expectedDelivery) : '—'}</Info>
              <Info label="Estimated Hours">{assignment.estimatedHours ?? 0} hrs</Info>
              <Info label="Allocated Hours">{assignment.allocatedHours ?? 0} hrs</Info>
              <Info label="Priority"><PriorityBadge priority={assignment.priority} /></Info>
              <Info label="Status"><Badge status={assignment.status} /></Info>
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Instructions</h2>
          </div>
          <div className="px-6 py-5">
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
              {assignment.instructions?.trim() ? assignment.instructions : 'No instructions provided for this assignment.'}
            </p>
          </div>
        </div>
      )}

      {/* Activity history */}
      {!editing && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Activity</h2>
          </div>
          <div className="px-6 py-4">
            {(assignment.activity?.length ?? 0) === 0 ? (
              <p className="text-[12.5px] text-slate-400">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {[...assignment.activity].reverse().map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <div className="flex-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-[13px] text-slate-700">{e.text}</p>
                      <span className="text-[11.5px] tabular-nums text-slate-400">{fmtDate(e.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {reassigning && (
        <ReassignModal
          assignment={assignment}
          onClose={() => setReassigning(false)}
          onReassign={reassign}
        />
      )}
    </Layout>
  );
}

export default AssignmentDetail;