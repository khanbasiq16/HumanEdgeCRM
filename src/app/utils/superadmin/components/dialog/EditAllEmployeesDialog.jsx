"use client";
import React, { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { createemployees } from "@/features/Slice/EmployeeSlice";
import {
  Loader2, Save, RotateCcw, Search, Pencil,
  CheckCircle2, XCircle,
} from "lucide-react";
import { BANKS } from "@/app/utils/constants/banks";

/* ── constants ──────────────────────────────────────────── */
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

/* ── cell input styles ──────────────────────────────────── */
const cIn  = "h-7 w-full px-1.5 py-0 text-sm bg-transparent border border-transparent rounded hover:border-slate-200 focus:border-blue-400 focus:bg-blue-50/40 focus:outline-none transition-colors";
const cSel = "h-7 w-full px-1 py-0 text-sm bg-transparent border border-transparent rounded hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-colors cursor-pointer appearance-none";

/* ══════════════════════════════════════════════════════════ */
const EditAllEmployeesDialog = ({ open, onOpenChange }) => {
  const dispatch = useDispatch();
  const { employees } = useSelector((s) => s.Employee);
  const { department: departments } = useSelector((s) => s.Department);

  const [search,      setSearch]      = useState("");
  const [rowEdits,    setRowEdits]    = useState({});
  const [savingRows,  setSavingRows]  = useState({});
  const [savingAll,   setSavingAll]   = useState(false);

  /* filtered list */
  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter((e) =>
      (e.employeeName  || "").toLowerCase().includes(q) ||
      (e.employeeemail || "").toLowerCase().includes(q) ||
      (e.department?.departmentName || e.department || "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  /* ── inline edit helpers ──────────────────────────────── */
  const getVal = (emp, field) => {
    const edits = rowEdits[emp.employeeId];
    if (edits && field in edits) return edits[field];
    return emp[field] ?? "";
  };

  const setVal = (id, field, value) =>
    setRowEdits((p) => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));

  const isDirty = (id) => !!rowEdits[id] && Object.keys(rowEdits[id]).length > 0;

  const discard = (id) =>
    setRowEdits((p) => { const n = { ...p }; delete n[id]; return n; });

  const handleSave = async (emp) => {
    if (!isDirty(emp.employeeId)) return;
    setSavingRows((p) => ({ ...p, [emp.employeeId]: true }));
    try {
      const res = await axios.post(`/api/update-employee/${emp.employeeId}`, rowEdits[emp.employeeId]);
      if (res.data.success) {
        toast.success(`${res.data.employee?.employeeName || emp.employeeName} updated`);
        dispatch(createemployees(
          employees.map((e) => e.employeeId === emp.employeeId ? res.data.employee : e)
        ));
        discard(emp.employeeId);
      } else {
        toast.error(res.data.error || "Update failed");
      }
    } catch {
      toast.error("Error updating employee");
    } finally {
      setSavingRows((p) => ({ ...p, [emp.employeeId]: false }));
    }
  };

  const handleSaveAll = async () => {
    const dirtyIds = Object.keys(rowEdits);
    if (!dirtyIds.length) return;
    setSavingAll(true);
    const dirtyEmps = employees.filter((e) => dirtyIds.includes(e.employeeId));
    const results = await Promise.allSettled(
      dirtyEmps.map((emp) =>
        axios.post(`/api/update-employee/${emp.employeeId}`, rowEdits[emp.employeeId])
      )
    );
    let updatedList = [...employees];
    let successCount = 0;
    let failCount = 0;
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value.data.success) {
        const updated = result.value.data.employee;
        updatedList = updatedList.map((e) => e.employeeId === updated.employeeId ? updated : e);
        successCount++;
      } else {
        failCount++;
      }
    });
    dispatch(createemployees(updatedList));
    setRowEdits((prev) => {
      const next = { ...prev };
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value.data.success) {
          delete next[dirtyEmps[idx].employeeId];
        }
      });
      return next;
    });
    if (successCount > 0) toast.success(`${successCount} employee${successCount !== 1 ? "s" : ""} saved`);
    if (failCount > 0) toast.error(`${failCount} failed to save`);
    setSavingAll(false);
  };

  const dirtyCount = Object.keys(rowEdits).length;

  /* ── thead columns config ─────────────────────────────── */
  const heads = [
    "Employee", "Email", "Phone", "CNIC", "Status",
    "Department", "Designation", "Salary", "Hrs/Day",
    "Join Date", "Bank", "Account #", "Sales Target", "Save",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-full p-0 gap-0 rounded-2xl overflow-hidden flex flex-col" style={{ height: "90vh" }}>

        {/* ── Header ────────────────────────────────────────── */}
        <DialogHeader className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Pencil size={16} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Edit All Employees
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit any field directly in the table — save per row
              </p>
            </div>

            {/* unsaved badge + save all */}
            {dirtyCount > 0 && (
              <div className="ml-2 flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                  {dirtyCount} unsaved row{dirtyCount !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleSaveAll}
                  disabled={savingAll}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
                >
                  {savingAll
                    ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
                    : <><Save size={12} /> Save All ({dirtyCount})</>}
                </button>
              </div>
            )}

            {/* search */}
            <div className="ml-auto relative w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee…"
                className="w-full pl-8 h-9 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
              {filtered.length} / {employees.length}
            </span>
          </div>
        </DialogHeader>

        {/* ── Table area ────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                {heads.map((h) => (
                  <th
                    key={h}
                    className="px-2 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={heads.length} className="py-16 text-center text-sm text-slate-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((emp, i) => {
                  const dirty  = isDirty(emp.employeeId);
                  const saving = savingRows[emp.employeeId];
                  const color  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const status = getVal(emp, "status");
                  const isActive = status?.toLowerCase() === "active";

                  const dept = (
                    emp.department?.departmentName ||
                    (typeof emp.department === "string" ? emp.department : "") ||
                    emp.designation || ""
                  ).toLowerCase();
                  const isSales = dept.includes("sales");

                  const currentDept = getVal(emp, "department");
                  const deptName = currentDept?.departmentName ||
                    (typeof currentDept === "string" ? currentDept : "");

                  const rawDate = getVal(emp, "dateOfJoining");
                  const joinVal = rawDate ? rawDate.split("T")[0] : "";

                  return (
                    <tr
                      key={emp.employeeId}
                      className={`border-b border-slate-50 transition-colors ${
                        dirty ? "bg-amber-50/50 hover:bg-amber-50/70" : "hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Employee name + avatar */}
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2 min-w-40">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${color}`}>
                            {(getVal(emp, "employeeName") || "EM").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              value={getVal(emp, "employeeName")}
                              onChange={(e) => setVal(emp.employeeId, "employeeName", e.target.value)}
                              className={cIn}
                              placeholder="Name"
                            />
                            <p className="text-[10px] text-slate-400 px-1.5 truncate">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-2 py-1.5">
                        <input
                          type="email"
                          value={getVal(emp, "employeeemail")}
                          onChange={(e) => setVal(emp.employeeId, "employeeemail", e.target.value)}
                          className={`${cIn} min-w-44`}
                          placeholder="email@example.com"
                        />
                      </td>

                      {/* Phone */}
                      <td className="px-2 py-1.5">
                        <input
                          value={getVal(emp, "employeePhone")}
                          onChange={(e) => setVal(emp.employeeId, "employeePhone", e.target.value)}
                          className={`${cIn} min-w-28`}
                          placeholder="03xx-xxxxxxx"
                        />
                      </td>

                      {/* CNIC */}
                      <td className="px-2 py-1.5">
                        <input
                          value={getVal(emp, "employeeCNIC")}
                          onChange={(e) => setVal(emp.employeeId, "employeeCNIC", e.target.value)}
                          className={`${cIn} min-w-32 font-mono text-xs`}
                          placeholder="xxxxx-xxxxxxx-x"
                        />
                      </td>

                      {/* Status */}
                      <td className="px-2 py-1.5">
                        <div className="min-w-28 flex items-center gap-1">
                          <span className={`shrink-0 ${isActive ? "text-emerald-500" : "text-slate-400"}`}>
                            {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          </span>
                          <select
                            value={status?.toLowerCase() || ""}
                            onChange={(e) => setVal(emp.employeeId, "status", e.target.value)}
                            className={cSel}
                          >
                            <option value="active">Active</option>
                            <option value="deactivate">Deactivate</option>
                          </select>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-2 py-1.5">
                        <select
                          value={deptName}
                          onChange={(e) => setVal(emp.employeeId, "department", e.target.value)}
                          className={`${cSel} min-w-32`}
                        >
                          <option value="">— Select —</option>
                          {(departments || []).map((d) => (
                            <option key={d._id || d.id} value={d.departmentName}>{d.departmentName}</option>
                          ))}
                        </select>
                      </td>

                      {/* Designation */}
                      <td className="px-2 py-1.5">
                        <input
                          value={getVal(emp, "designation")}
                          onChange={(e) => setVal(emp.employeeId, "designation", e.target.value)}
                          className={`${cIn} min-w-32`}
                          placeholder="e.g. Engineer"
                        />
                      </td>

                      {/* Salary */}
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={getVal(emp, "employeeSalary")}
                          onChange={(e) => setVal(emp.employeeId, "employeeSalary", e.target.value)}
                          className={`${cIn} min-w-24`}
                          placeholder="PKR"
                        />
                      </td>

                      {/* Working Hours */}
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={getVal(emp, "totalWorkingHours")}
                          onChange={(e) => setVal(emp.employeeId, "totalWorkingHours", e.target.value)}
                          className={`${cIn} min-w-16`}
                          placeholder="8"
                        />
                      </td>

                      {/* Join Date */}
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={joinVal}
                          onChange={(e) => setVal(emp.employeeId, "dateOfJoining", e.target.value)}
                          className={`${cIn} min-w-32`}
                        />
                      </td>

                      {/* Bank Name */}
                      <td className="px-2 py-1.5">
                        <select
                          value={getVal(emp, "bankName")}
                          onChange={(e) => {
                            const bank = BANKS.find((b) => b.name === e.target.value);
                            setVal(emp.employeeId, "bankName", e.target.value);
                            setVal(emp.employeeId, "bankCode", bank?.code || "");
                          }}
                          className={`${cSel} min-w-44`}
                        >
                          <option value="">— Select Bank —</option>
                          {BANKS.map((b) => (
                            <option key={b.code} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Account Number */}
                      <td className="px-2 py-1.5">
                        <input
                          value={getVal(emp, "bankAccountNumber")}
                          onChange={(e) => setVal(emp.employeeId, "bankAccountNumber", e.target.value)}
                          className={`${cIn} min-w-36 font-mono text-xs`}
                          placeholder="IBAN / Account No."
                        />
                      </td>

                      {/* Sales Target */}
                      <td className="px-2 py-1.5">
                        {isSales ? (
                          <input
                            type="number"
                            value={getVal(emp, "salesTarget")}
                            onChange={(e) => setVal(emp.employeeId, "salesTarget", e.target.value)}
                            className={`${cIn} min-w-24`}
                            placeholder="Target"
                          />
                        ) : (
                          <span className="text-xs text-slate-300 px-1.5">—</span>
                        )}
                      </td>

                      {/* Save / Discard */}
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          {dirty ? (
                            <>
                              <button
                                onClick={() => handleSave(emp)}
                                disabled={saving}
                                title="Save"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                              >
                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              </button>
                              <button
                                onClick={() => discard(emp.employeeId)}
                                title="Discard"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-200 transition-all"
                              >
                                <RotateCcw size={11} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-300 px-1.5">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default EditAllEmployeesDialog;
