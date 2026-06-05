"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminClientdialog from "../dialog/AdminClientdialog";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search, ChevronLeft, ChevronRight, Copy, ExternalLink,
  Check, Building2, Users, Filter, Trash2, AlertTriangle, Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import toast from "react-hot-toast";

/* ── Confirm Delete Dialog (single & bulk) ── */
const ConfirmDelete = ({ name, count, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {count ? `Delete ${count} Clients` : "Delete Client"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {count
          ? <>Are you sure you want to delete <span className="font-semibold text-slate-900">{count} selected clients</span>? All their data will be permanently removed.</>
          : <>Are you sure you want to delete <span className="font-semibold text-slate-900">{name}</span>?</>}
      </p>
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          {deleting ? (
            <><Loader2 size={14} className="animate-spin" /> Deleting…</>
          ) : count ? (
            `Delete ${count}`
          ) : (
            "Delete"
          )}
        </button>
      </div>
    </div>
  </div>
);

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const ListAllClients = () => {
  const [clients, setClients]           = useState([]);
  const [companies, setCompanies]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [copiedId, setCopiedId]         = useState(null);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [deleteTarget, setDeleteTarget]   = useState(null); // { id, name }
  const [deleting, setDeleting]           = useState(false);
  const [rowSelection, setRowSelection]   = useState({});
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [cliRes, compRes] = await Promise.all([
          axios.get("/api/all-clients"),
          axios.get("/api/get-all-companies"),
        ]);
        if (cliRes.data.success)  setClients(cliRes.data.clients || []);
        if (compRes.data.success) setCompanies(compRes.data.companies || []);
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleCopyEmail = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/delete-client/${deleteTarget.id}`);
      if (res.data.success) {
        setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        toast.success("Client deleted successfully");
      } else {
        toast.error(res.data.error || "Failed to delete client");
      }
    } catch {
      toast.error("Error deleting client");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((r) => r.original.id);
    if (!ids.length) return;
    setDeleting(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => axios.delete(`/api/delete-client/${id}`))
      );
      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && r.value?.data?.success
      ).length;
      const succeededIds = ids.filter(
        (_, i) => results[i].status === "fulfilled" && results[i].value?.data?.success
      );
      setClients((prev) => prev.filter((c) => !succeededIds.includes(c.id)));
      setRowSelection({});
      setBulkDeleteConfirm(false);
      if (succeeded === ids.length) {
        toast.success(`${succeeded} client${succeeded !== 1 ? "s" : ""} deleted`);
      } else {
        toast.error(`${succeeded} deleted, ${ids.length - succeeded} failed`);
      }
    } catch {
      toast.error("Error deleting clients");
    } finally {
      setDeleting(false);
    }
  };

  const filteredData = companyFilter === "all"
    ? clients
    : clients.filter((c) => c.companySlug === companyFilter || c.companyName?.toLowerCase() === companyFilter.toLowerCase());

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => {
        const name     = row.getValue("clientName") || "";
        const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        const colorCls = AVATAR_COLORS[row.index % AVATAR_COLORS.length];
        return (
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorCls}`}>
              {initials}
            </div>
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[130px]">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Building2 size={12} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-600 truncate max-w-[110px]">{row.getValue("companyName") || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "assignedEmployeeName",
      header: "Employee",
      cell: ({ row }) => {
        const name = row.getValue("assignedEmployeeName");
        return name ? (
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-600 truncate max-w-[100px]">{name}</span>
          </div>
        ) : <span className="text-xs text-slate-300">—</span>;
      },
    },
    {
      accessorKey: "clientEmail",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 truncate max-w-[150px] block">
          {row.getValue("clientEmail")}
        </span>
      ),
    },
    {
      accessorKey: "clientPhone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 whitespace-nowrap">{row.getValue("clientPhone") || "—"}</span>
      ),
    },
    {
      accessorKey: "clientWebsite",
      header: "Website",
      cell: ({ row }) => {
        const url = row.getValue("clientWebsite");
        if (!url) return <span className="text-xs text-slate-300">—</span>;
        const display = url.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "");
        return (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            {display.length > 18 ? display.slice(0, 18) + "…" : display}
            <ExternalLink size={9} />
          </a>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const client = row.original;
        const copied = copiedId === client.id;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCopyEmail(client.clientEmail, client.id)}
              title="Copy email"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
            {client.companySlug && (
              <Link
                href={`/admin/company/${client.companySlug}/clients/${client.id}/client-details`}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="View details"
              >
                <ExternalLink size={13} />
              </Link>
            )}
            <button
              onClick={() => setDeleteTarget({ id: client.id, name: client.clientName })}
              title="Delete client"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const totalCount    = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <>
    {deleteTarget && (
      <ConfirmDelete
        name={deleteTarget.name}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        deleting={deleting}
      />
    )}
    {bulkDeleteConfirm && (
      <ConfirmDelete
        count={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleBulkDelete}
        onCancel={() => !deleting && setBulkDeleteConfirm(false)}
        deleting={deleting}
      />
    )}
    <Card className="p-6 rounded-xl shadow-md flex flex-col min-h-[64vh]">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400 animate-pulse">Loading clients…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search clients…"
                value={table.getColumn("clientName")?.getFilterValue() ?? ""}
                onChange={(e) => table.getColumn("clientName")?.setFilterValue(e.target.value)}
                className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500"
              />
            </div>

            {/* Company filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-slate-400" />
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="h-9 pl-2 pr-7 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.companyslug}>
                    {c.name || c.companyslug}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-400 font-medium ml-auto">
              {selectedCount > 0 ? `${selectedCount} selected · ` : ""}{totalCount} clients
            </span>

            {selectedCount > 0 && (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
                Delete Selected ({selectedCount})
              </button>
            )}

            <AdminClientdialog setClients={setClients} />
          </div>

          {/* Empty state */}
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Users size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">No clients yet.</p>
              <AdminClientdialog setClients={setClients} />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-100 bg-slate-50/60">
                        {hg.headers.map((h) => (
                          <th key={h.id} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors data-[state=selected]:bg-blue-50/40"
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
                        <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                          No clients match your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
    </>
  );
};

export default ListAllClients;
