"use client";
import React, { useState, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
} from "@tanstack/react-table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Trash2, Loader2, MoreHorizontal, ChevronLeft, ChevronRight,
  Users, Calendar, DollarSign, AlertTriangle, TrendingDown, TrendingUp,
  LogIn, LogOut, SlidersHorizontal,
} from "lucide-react";
import MonthPicker from "../basecomponent/MonthPicker";
import { useDispatch, useSelector } from "react-redux";
import Listallattendancewithgraph from "./Listallattendancewithgraph";
import axios from "axios";
import toast from "react-hot-toast";
import AttendanceImportDialog from "../dialog/AttendanceImportDialog";
import { createemployees } from "@/features/Slice/EmployeeSlice";

/* ── Status pill ────────────────────────────────────────── */
const STATUS_STYLE = {
  "On Time":           "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Late":              "bg-amber-50 text-amber-700 border-amber-200",
  "Half Day":          "bg-blue-50 text-blue-700 border-blue-200",
  "Short Day":         "bg-violet-50 text-violet-700 border-violet-200",
  "Early Check Out":   "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Late Check Out":    "bg-violet-50 text-violet-700 border-violet-200",
  "On Time Check Out": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Absent":            "bg-red-50 text-red-700 border-red-200",
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
    {status || "—"}
  </span>
);

/* ── Salary stat card ───────────────────────────────────── */
const SalaryCard = ({ icon: Icon, label, value, colorClass, sub }) => (
  <div className={`flex items-start gap-3 p-4 rounded-2xl border ${colorClass}`}>
    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
      <Icon size={15} />
    </div>
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-lg font-extrabold tabular-nums leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── DataTable ──────────────────────────────────────────── */
const DataTable = ({ columns, data, rowSelection, setRowSelection, selectedEmployee, setSelectedEmployee, activeTab }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteloading, setDeleteloading] = useState(false);

  const { employees } = useSelector((s) => s.Employee);
  const dispatch = useDispatch();

  const CHECKIN_STATUSES  = ["On Time", "Late", "Half Day", "Short Day", "Absent"];
  const CHECKOUT_STATUSES = ["On Time Check Out", "Late Check Out", "Early Check Out", "Absent"];

  const handledatadelete = async (selectedRows) => {
    setDeleteloading(true);
    try {
      const attendanceIds = selectedRows.map((r) => r.attendanceId);
      const employee = employees?.find((e) => e.employeeName === selectedEmployee);
      const res = await axios.post("/api/attendance/delete-attendance", {
        attendanceIds,
        employeeId: employee.employeeId,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedEmployee(res.data.employee);
      }
    } catch {
      toast.error("Failed to delete attendance");
    } finally {
      setDeleteloading(false);
    }
  };

  const handlechangestatus = async (status, selectedRows) => {
    const toastId = toast.loading("Updating status…");
    try {
      const attendanceIds = selectedRows.map((r) => r.attendanceId);
      const employee = employees?.find((e) => e.employeeName === selectedEmployee);
      const url = activeTab === "checkin"
        ? "/api/attendance/change-checkin-attendance-status"
        : "/api/attendance/change-checkout-attendance-status";
      const res = await axios.post(url, {
        ids: attendanceIds,
        employeeid: employee.employeeId,
        status,
      }, { headers: { "Content-Type": "application/json" } });
      if (res.data.success) {
        toast.success(res.data.message, { id: toastId });
        dispatch(createemployees(res.data.allemployees));
      }
    } catch {
      toast.error("Update failed", { id: toastId });
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows  = table.getSelectedRowModel().rows.map((r) => r.original);
  const selectedCount = selectedRows.length;

  return (
    <div className="space-y-0">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-slate-100">
        {/* Left */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-60 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search records…"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1"
            />
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{selectedCount} selected</span>
              <Select onValueChange={(s) => handlechangestatus(s, selectedRows)}>
                <SelectTrigger className="h-9 w-44 text-xs bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  {(activeTab === "checkin" ? CHECKIN_STATUSES : CHECKOUT_STATUSES).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <AttendanceImportDialog selectedEmployee={selectedEmployee} />
          <button
            disabled={deleteloading || selectedCount === 0}
            onClick={() => handledatadelete(selectedRows)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {deleteloading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-slate-50/70 border-b border-slate-100">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler?.()}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors"
                  style={{ background: row.getIsSelected() ? "rgba(59,130,246,0.05)" : undefined }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-medium">
          Showing {table.getRowModel().rows.length} of {data.length} records
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ─────────────────────────────────────── */
const ListAllAttendance = () => {
  const { employees } = useSelector((s) => s.Employee);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth]       = useState("");
  const [selectedStatus, setSelectedStatus]     = useState("");
  const [activeTab, setActiveTab]               = useState("checkin");
  const [rowSelection, setRowSelection]         = useState({});

  const absentConversion = {
    Late:       { count: 3, toAbsent: 1 },
    "Half Day": { count: 2, toAbsent: 1 },
    "Short Day":{ count: 3, toAbsent: 1 },
  };

  const filteredAttendance = useMemo(() => {
    if (!selectedEmployee) return [];
    const emp = employees?.find((e) => e.employeeName === selectedEmployee);
    if (!emp) return [];

    let list = [...emp.Attendance];
    if (selectedMonth) {
      list = list.filter((att) => {
        const [, month, year] = att.date.split("/");
        return `${year}-${month}` === selectedMonth;
      });
    }
    return list
      .map((att) => ({
        ...att,
        checkin:  att.checkin  || { status: "Absent", ip: "-", time: "-", note: "-", stopwatchTime: "-" },
        checkout: att.checkout || { status: "Absent", ip: "-", time: "-", note: "-", stopwatchTime: "-" },
      }))
      .filter((att) => {
        if (selectedStatus && selectedStatus !== "All Status") {
          const s = activeTab === "checkin" ? att.checkin.status : att.checkout.status;
          return s === selectedStatus;
        }
        return true;
      });
  }, [employees, selectedEmployee, selectedMonth, selectedStatus, activeTab]);

  const statusCounts = useMemo(() => {
    const counts = {};
    filteredAttendance.forEach((att) => {
      const s = activeTab === "checkin" ? att.checkin.status : att.checkout.status;
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [filteredAttendance, activeTab]);

  const totalAbsentDays = useMemo(() => {
    if (!selectedEmployee || activeTab !== "checkin") return 0;
    const counts = { Late: 0, "Half Day": 0, "Short Day": 0, Absent: 0 };
    filteredAttendance.forEach((att) => {
      const s = att.checkin.status;
      counts[s] = (counts[s] || 0) + 1;
    });
    let effective = counts["Absent"] || 0;
    Object.keys(absentConversion).forEach((s) => {
      const { count, toAbsent } = absentConversion[s];
      effective += Math.floor((counts[s] || 0) / count) * toAbsent;
    });
    return effective;
  }, [filteredAttendance, selectedEmployee, activeTab]);

  const getDaysInMonth = (m) => {
    if (!m) return 30;
    const [y, mo] = m.split("-");
    return new Date(y, parseInt(mo), 0).getDate();
  };

  const selectedEmp  = employees?.find((e) => e.employeeName === selectedEmployee);
  const totalSalary  = selectedEmp?.employeeSalary || 0;
  const totalDeduction = useMemo(() => {
    if (!selectedEmployee || activeTab !== "checkin") return 0;
    const daysInMonth   = getDaysInMonth(selectedMonth);
    const perDaySalary  = totalSalary / daysInMonth;
    return Math.round(perDaySalary * totalAbsentDays);
  }, [totalAbsentDays, totalSalary, selectedMonth, selectedEmployee, activeTab]);

  const netSalary = totalSalary - totalDeduction;

  const columns = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      accessorKey: "formattedDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700">{row.getValue("formattedDate")}</span>
      ),
    },
    {
      accessorKey: "ip",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-500">{row.getValue("ip") || "—"}</span>
      ),
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-slate-800">{row.getValue("time") || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "stopwatchTime",
      header: "Duration",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.original.stopwatchTime || "—"}</span>
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => (
        <span className="text-xs italic text-slate-400">{row.getValue("note") || "—"}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
              <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => navigator.clipboard.writeText(record.ip)}>
                Copy IP
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => alert(`Note: ${record.note || "No note"}`)}>
                View Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [activeTab]);

  const formattedData = useMemo(() => filteredAttendance.map((att) => ({
    attendanceId:  att.id,
    formattedDate: att.date.replace(/-/g, "/"),
    stopwatchTime: att.checkout.stopwatchTime,
    note:   activeTab === "checkin" ? att.checkin.note     : att.checkout.note,
    ip:     activeTab === "checkin" ? att.checkin.ip       : att.checkout.ip,
    time:   activeTab === "checkin" ? att.checkin.time     : att.checkout.time,
    status: activeTab === "checkin" ? att.checkin.status   : att.checkout.status,
  })), [filteredAttendance, activeTab]);

  return (
    <div className="space-y-5">

      {/* ── Filter bar ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Users size={15} className="text-slate-400" />
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="h-9 w-52 text-sm bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp?.id} value={emp?.employeeName}>
                    {emp?.employeeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Calendar size={15} className="text-slate-400" />
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={15} className="text-slate-400" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 w-48 text-sm bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="On Time">On Time</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Half Day">Half Day</SelectItem>
                <SelectItem value="Short Day">Short Day</SelectItem>
                <SelectItem value="Early Check Out">Early Check Out</SelectItem>
                <SelectItem value="Late Check Out">Late Check Out</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedEmployee && (
            <span className="ml-auto text-xs text-slate-400 font-medium">
              {filteredAttendance.length} record{filteredAttendance.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Salary summary (checkin only) ─────────────────── */}
      {selectedEmployee && activeTab === "checkin" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SalaryCard
            icon={DollarSign}
            label="Total Salary"
            value={`PKR ${Number(totalSalary).toLocaleString()}`}
            colorClass="bg-blue-50 border-blue-200 text-blue-700"
          />
          <SalaryCard
            icon={AlertTriangle}
            label="Absent Days"
            value={totalAbsentDays}
            sub="effective absences"
            colorClass="bg-amber-50 border-amber-200 text-amber-700"
          />
          <SalaryCard
            icon={TrendingDown}
            label="Deduction"
            value={`PKR ${Number(totalDeduction).toLocaleString()}`}
            colorClass="bg-red-50 border-red-200 text-red-600"
          />
          <SalaryCard
            icon={TrendingUp}
            label="Net Salary"
            value={`PKR ${Number(netSalary).toLocaleString()}`}
            colorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
          />
        </div>
      )}

      {/* ── Main content card ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">

        {/* Tab toggle + status chips */}
        <div className="px-5 pt-4 pb-0 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("checkin")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "checkin"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LogIn size={14} /> Check In
              </button>
              <button
                onClick={() => setActiveTab("checkout")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "checkout"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LogOut size={14} /> Check Out
              </button>
            </div>

            {/* Status count chips */}
            {Object.keys(statusCounts).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    {status} <span className="font-extrabold">·{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table or empty state */}
        {!selectedEmployee ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Select an employee to view attendance</p>
            <p className="text-xs text-slate-400">Use the filter above to choose an employee</p>
          </div>
        ) : formattedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Calendar size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No records found</p>
            <p className="text-xs text-slate-400">Try adjusting your month or status filter</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={formattedData}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            activeTab={activeTab}
          />
        )}
      </div>

      {/* ── Graph ─────────────────────────────────────────── */}
      {filteredAttendance.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <Listallattendancewithgraph
            data={filteredAttendance}
            activeTab={activeTab}
            selectedMonth={selectedMonth}
          />
        </div>
      )}
    </div>
  );
};

export default ListAllAttendance;
