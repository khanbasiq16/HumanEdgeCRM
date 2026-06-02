"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, MoreHorizontal, Trash, Search, Download,
  CheckCircle2, XCircle, LogIn, LogOut, SlidersHorizontal,
  Building2, Pencil,
} from "lucide-react";
import AssignCompanyDialog from "../dialog/AssignCompanydIalog";
import EditEmployeeDialog  from "../dialog/EditEmployeeDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { createemployees } from "@/features/Slice/EmployeeSlice";
import { useDispatch } from "react-redux";
import axios from "axios";

/* ── avatar colour cycle ───────────────────────────────── */
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

/* ── helpers ──────────────────────────────────────────── */
const fetchKarachiTime = () => {
  try {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  } catch {
    return new Date();
  }
};

const isoTo12Hour = (date) => {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
};

const getCurrentIp = async () => {
  const res = await fetch("https://api.ipify.org?format=json");
  const { ip } = await res.json();
  return ip;
};

/* ── Main component ───────────────────────────────────── */
export function EmployeeTable({ employees }) {
  const [sorting, setSorting]             = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection]   = React.useState({});
  const [deleteloading, setDeleteloading] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [editingRowId, setEditingRowId]   = React.useState(null);
  const [checkinLoadingMap, setCheckinLoadingMap]   = React.useState({});
  const [checkoutLoadingMap, setCheckoutLoadingMap] = React.useState({});
  const [assignOpen,    setAssignOpen]    = React.useState(false);
  const [assignEmployee,setAssignEmployee]= React.useState(null);
  const [editOpen,      setEditOpen]      = React.useState(false);
  const [editEmployee,  setEditEmployee]  = React.useState(null);

  const dispatch = useDispatch();

  /* ── handlers ─────────────────────────────────────────── */
  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const toastId = toast.loading("Updating status…");
      const res = await fetch("/api/update-employee-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { id: toastId });
        dispatch(createemployees(data.employees));
      } else {
        toast.error(data.message || "Failed to update status", { id: toastId });
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdatingStatus(false);
      setEditingRowId(null);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    const ids = table.getFilteredSelectedRowModel().rows.map((r) => r.original.employeeId);
    if (ids.length === 0) { toast.error("Select at least one employee"); return; }
    try {
      setUpdatingStatus(true);
      const toastId = toast.loading("Updating status…");
      const res = await fetch("/api/bulk-update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: ids, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Status updated", { id: toastId });
        dispatch(createemployees(data.employees));
      } else {
        toast.error(data.message || "Failed", { id: toastId });
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    const ids = table.getFilteredSelectedRowModel().rows.map((r) => r.original.employeeId);
    if (ids.length === 0) { toast.error("Select at least one employee"); return; }
    try {
      setDeleteloading(true);
      const res = await fetch("/api/delete-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: ids }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        dispatch(createemployees(data.employees));
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteloading(false);
    }
  };

  const handleCheckIn = async (empid, employeeName) => {
    const toastId = toast.loading("Checking in…");
    setCheckinLoadingMap((p) => ({ ...p, [empid]: true }));
    try {
      const ip   = await getCurrentIp();
      const time = isoTo12Hour(fetchKarachiTime());
      const res  = await axios.post("/api/admin/check-in", { employeeId: empid, ip, time, note: "" });
      if (res.data.success) {
        toast.success(`${employeeName} checked in`, { id: toastId });
        dispatch(createemployees(res.data.employees));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed", { id: toastId });
    } finally {
      setCheckinLoadingMap((p) => ({ ...p, [empid]: false }));
    }
  };

  const handleCheckOut = async (empid, employeeName) => {
    const toastId = toast.loading("Checking out…");
    setCheckoutLoadingMap((p) => ({ ...p, [empid]: true }));
    try {
      const ip   = await getCurrentIp();
      const time = isoTo12Hour(fetchKarachiTime());
      const res  = await axios.post("/api/admin/check-out", { employeeId: empid, ip, time, note: "" });
      if (res.data.success) {
        toast.success(`${employeeName} checked out`, { id: toastId });
        dispatch(createemployees(res.data.employees));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed", { id: toastId });
    } finally {
      setCheckoutLoadingMap((p) => ({ ...p, [empid]: false }));
    }
  };

  const downloadSalaryExcel = async () => {
    try {
      const res = await fetch("/api/admin/export-salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Download failed");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const d    = new Date();
      a.download = `Salary_Report_${d.getMonth() + 1}_${d.getFullYear()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };

  /* ── columns ──────────────────────────────────────────── */
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          className="border-slate-300"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          className="border-slate-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: "employeeName",
      header: "Employee",
      cell: ({ row }) => {
        const emp    = row.original;
        const name   = emp.employeeName || "";
        const initials = name.slice(0, 2).toUpperCase() || "EM";
        const color  = AVATAR_COLORS[row.index % AVATAR_COLORS.length];
        const dept   = (
          emp.department?.departmentName ||
          (typeof emp.department === "string" ? emp.department : "") ||
          emp.designation || ""
        ).toLowerCase();
        const isSales = dept.includes("sales");
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                {isSales && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200 shrink-0">
                    SALES
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{emp.employeeId}</p>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "employeeemail",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email <ArrowUpDown size={12} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 truncate block max-w-[180px]">
          {row.getValue("employeeemail")}
        </span>
      ),
    },

    {
      accessorKey: "employeePhone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">{row.getValue("employeePhone") || "—"}</span>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status    = row.getValue("status");
        const isEditing = editingRowId === row.original.employeeId;
        const isActive  = status?.toLowerCase() === "active";

        return (
          <div onDoubleClick={() => setEditingRowId(row.original.employeeId)} className="cursor-pointer">
            {isEditing ? (
              <Select
                onValueChange={(val) => handleStatusChange(row.original.employeeId, val)}
                defaultValue={status?.toLowerCase()}
              >
                <SelectTrigger className="w-[130px] h-7 text-xs border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border
                ${isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"}
              `}>
                {isActive
                  ? <CheckCircle2 size={10} className="text-emerald-500" />
                  : <XCircle size={10} className="text-slate-400" />}
                {isActive ? "Active" : "Inactive"}
              </span>
            )}
          </div>
        );
      },
    },

    {
      accessorKey: "employeeCNIC",
      header: "CNIC",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 whitespace-nowrap font-mono text-xs">
          {row.getValue("employeeCNIC") || "—"}
        </span>
      ),
    },

    {
      accessorKey: "checkIn",
      header: "Check In",
      cell: ({ row }) => {
        const emp      = row.original;
        const isActive = emp.status === "active";
        const loading  = checkinLoadingMap[emp.employeeId];
        const done     = emp.isCheckedin;
        return (
          <button
            disabled={!isActive || done || loading}
            onClick={() => handleCheckIn(emp.employeeId, emp.employeeName)}
            className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border transition-all
              ${!isActive || done
                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"}
            `}
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <LogIn size={11} />}
            {done ? "Done" : "Check In"}
          </button>
        );
      },
    },

    {
      accessorKey: "checkOut",
      header: "Check Out",
      cell: ({ row }) => {
        const emp      = row.original;
        const isActive = emp.status === "active";
        const loading  = checkoutLoadingMap[emp.employeeId];
        const done     = emp.isCheckedout;
        return (
          <button
            disabled={!isActive || done || loading}
            onClick={() => handleCheckOut(emp.employeeId, emp.employeeName)}
            className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border transition-all
              ${!isActive || done
                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"}
            `}
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
            {done ? "Done" : "Check Out"}
          </button>
        );
      },
    },

    {
      id: "assignCompany",
      header: () => <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Companies</span>,
      enableHiding: true,
      cell: ({ row }) => {
        const emp     = row.original;
        const dept    = (
          emp.department?.departmentName ||
          (typeof emp.department === "string" ? emp.department : "") ||
          emp.designation || ""
        ).toLowerCase();
        const isSales = dept.includes("sales");
        if (!isSales) return null;
        return (
          <button
            onClick={() => { setAssignEmployee(emp); setAssignOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all whitespace-nowrap shadow-sm"
          >
            <Building2 size={12}/> Assign Companies
          </button>
        );
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const emp     = row.original;
        const dept    = (
          emp.department?.departmentName ||
          (typeof emp.department === "string" ? emp.department : "") ||
          emp.designation || ""
        ).toLowerCase();
        const isSales = dept.includes("sales");
        return (
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-sm cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(emp.employeeemail)}
                >
                  Copy Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin/employees/${emp.employeeId}/viewdetails`} className="text-sm cursor-pointer">
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-sm cursor-pointer flex items-center gap-2 text-indigo-600 focus:text-indigo-600 focus:bg-indigo-50"
                  onClick={() => { setEditEmployee(emp); setEditOpen(true); }}
                >
                  <Pencil size={13} />
                  Edit Employee
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  /* ── table instance ───────────────────────────────────── */
  const table = useReactTable({
    data: employees,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="w-full">

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-slate-100">
        {/* Left: search + bulk actions */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search by email…"
              value={table.getColumn("employeeemail")?.getFilterValue() ?? ""}
              onChange={(e) => table.getColumn("employeeemail")?.setFilterValue(e.target.value)}
              className="pl-8 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1"
            />
          </div>

          {/* Bulk actions — only when rows are selected */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{selectedCount} selected</span>

              <Select disabled={updatingStatus} onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="h-9 w-36 text-xs bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activate</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                </SelectContent>
              </Select>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                    <Trash size={13} />
                    Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedCount} employee{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteloading}
                      className="rounded-xl bg-red-600 hover:bg-red-700"
                    >
                      {deleteloading ? (
                        <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Deleting…</span>
                      ) : "Confirm Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Right: export + column toggle */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            onClick={downloadSalaryExcel}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
          >
            <Download size={13} />
            Export Salary
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <SlidersHorizontal size={13} />
                Columns
                <ChevronDown size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize text-sm"
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-100">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors data-[state=selected]:bg-blue-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-slate-400">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-medium">
          {selectedCount} of {table.getFilteredRowModel().rows.length} row{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""} selected
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

      {/* ── Assign Company Dialog ── */}
      <AssignCompanyDialog
        open={assignOpen}
        setOpen={setAssignOpen}
        employeeId={assignEmployee?.employeeId}
        employeeName={assignEmployee?.employeeName}
        assigncompanies={assignEmployee?.companyIds || []}
      />

      {/* ── Edit Employee Dialog ── */}
      {editEmployee && (
        <EditEmployeeDialog
          employee={editEmployee}
          setemployee={(updated) => {
            setEditEmployee(updated);
            dispatch(createemployees(
              employees.map((e) => e.employeeId === updated.employeeId ? updated : e)
            ));
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
