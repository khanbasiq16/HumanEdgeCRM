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
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  Search, Trash2, CheckCircle2, XCircle, Mail, ExternalLink,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { createAccountants } from "@/features/Slice/AccountantSlice";
import Link from "next/link";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];

export function AccountsTable({ accountants }) {
  const [sorting, setSorting]               = React.useState([]);
  const [columnFilters, setColumnFilters]   = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection]     = React.useState({});
  const [deleteloading, setDeleteloading]   = React.useState(false);
  const [editingRowId, setEditingRowId]     = React.useState(null);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  const dispatch = useDispatch();

  const handleStatusChange = async (accountId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const toastId = toast.loading("Updating status...");
      const res = await fetch("/api/acounts/update-account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { id: toastId });
        dispatch(createAccountants(data.accounts));
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
    const accountIds = table.getFilteredSelectedRowModel().rows.map((r) => r.original.accountId);
    if (!accountIds.length) { toast.error("Select at least one account"); return; }
    try {
      setUpdatingStatus(true);
      const toastId = toast.loading("Updating status...");
      const res = await fetch("/api/acounts/bulk-update-account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountIds, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Status updated for selected accounts", { id: toastId });
        dispatch(createAccountants(data.accounts));
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
    const accountIds = table.getFilteredSelectedRowModel().rows.map((r) => r.original.accountId);
    if (!accountIds.length) { toast.error("Select at least one account to delete"); return; }
    try {
      setDeleteloading(true);
      const res = await fetch("/api/acounts/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        dispatch(createAccountants(data.accounts));
      } else {
        toast.error(data.message || "Failed to delete accounts");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteloading(false);
    }
  };

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
      id: "account",
      header: "Account",
      accessorKey: "accountuserName",
      cell: ({ row }) => {
        const name  = row.original.accountuserName || "—";
        const email = row.original.accountuseremail || "";
        const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        const color = AVATAR_COLORS[row.index % AVATAR_COLORS.length];
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate capitalize">{name}</p>
              <p className="text-xs text-slate-400 truncate">{email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "accountuserphone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.getValue("accountuserphone") || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status    = row.getValue("status") || "";
        const isEditing = editingRowId === row.original.accountId;
        const isActive  = status.toLowerCase() === "active";
        return (
          <div onDoubleClick={() => setEditingRowId(row.original.accountId)}>
            {isEditing ? (
              <Select
                defaultValue={status.toLowerCase()}
                onValueChange={(val) => handleStatusChange(row.original.accountId, val)}
              >
                <SelectTrigger className="h-8 w-[130px] text-xs border-slate-200 bg-slate-50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-default
                ${isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"}
              `}>
                {isActive
                  ? <CheckCircle2 size={10} />
                  : <XCircle size={10} />}
                {isActive ? "Active" : "Inactive"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <Link
          href={`/admin/accounts/${row.original.accountId}/viewdetails`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          View <ExternalLink size={11} />
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: accountants,
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

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3.5 border-b border-slate-100">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by email…"
            value={table.getColumn("accountuseremail")?.getFilterValue() ?? ""}
            onChange={(e) => table.getColumn("accountuseremail")?.setFilterValue(e.target.value)}
            className="pl-8 h-8 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Bulk actions */}
          {selectedCount > 0 && (
            <>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {selectedCount} selected
              </span>
              <Select disabled={updatingStatus} onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="h-8 w-[140px] text-xs border-slate-200 bg-white rounded-lg">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Set Active</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                </SelectContent>
              </Select>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedCount} account{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The selected accounts will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteloading}
                      className="rounded-xl bg-red-600 hover:bg-red-700"
                    >
                      {deleteloading ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {/* Column toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Columns <ChevronDown size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
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

      {/* Table */}
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-slate-100 bg-slate-50/60">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 data-[state=selected]:bg-blue-50/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-sm text-slate-400">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {selectedCount} of {table.getFilteredRowModel().rows.length} selected
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-slate-500 px-2">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
