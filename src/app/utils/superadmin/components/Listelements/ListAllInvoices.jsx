"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminInvoicedialog from "../dialog/AdminInvoicedialog";
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
  Check, ArrowUpDown, Building2, Users, Filter, Trash2, Clock, AlertTriangle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import toast from "react-hot-toast";

/* ── Confirm Dialog (shared) ── */
const ConfirmDialog = ({ title, message, confirmLabel, confirmCls, icon: Icon, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${confirmCls === "red" ? "bg-red-50" : "bg-orange-50"}`}>
          <Icon size={18} className={confirmCls === "red" ? "text-red-500" : "text-orange-500"} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="flex items-center justify-end gap-3 pt-1">
        <button onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors ${
            confirmCls === "red" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
          }`}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

const STATUS_STYLES = {
  Draft:   "bg-amber-50 text-amber-700 border-amber-200",
  Sent:    "bg-blue-50 text-blue-700 border-blue-200",
  Paid:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Expired: "bg-red-50 text-red-700 border-red-200",
};

const ListAllInvoices = () => {
  const [invoices, setInvoices]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [copiedId, setCopiedId]           = useState(null);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [companies, setCompanies]         = useState([]);
  const [deleteTarget, setDeleteTarget]   = useState(null); // { id, number }
  const [expireTarget, setExpireTarget]   = useState(null); // { id, number }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [invRes, compRes] = await Promise.all([
          axios.get("/api/all-invoices"),
          axios.get("/api/get-all-companies"),
        ]);
        if (invRes.data.success)  setInvoices(invRes.data.invoices || []);
        if (compRes.data.success) setCompanies(compRes.data.companies || []);
      } catch {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/delete-invoice/${deleteTarget.id}`);
      if (res.data.success) {
        setInvoices((prev) => prev.filter((inv) => inv.invoiceId !== deleteTarget.id));
        toast.success("Invoice deleted successfully");
      } else {
        toast.error(res.data.error || "Failed to delete invoice");
      }
    } catch {
      toast.error("Error deleting invoice");
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleExpire = async () => {
    if (!expireTarget) return;
    setActionLoading(true);
    try {
      const res = await axios.patch(`/api/expire-invoice/${expireTarget.id}`);
      if (res.data.success) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.invoiceId === expireTarget.id ? { ...inv, status: "Expired" } : inv
          )
        );
        toast.success("Invoice marked as Expired");
      } else {
        toast.error(res.data.error || "Failed to expire invoice");
      }
    } catch {
      toast.error("Error expiring invoice");
    } finally {
      setActionLoading(false);
      setExpireTarget(null);
    }
  };

  const filteredData = companyFilter === "all"
    ? invoices
    : invoices.filter((inv) => inv.companySlug === companyFilter);

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
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-slate-700 font-mono">
          {row.getValue("invoiceNumber")}
        </span>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Building2 size={12} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700">{row.getValue("companyName") || "—"}</span>
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
            <span className="text-sm text-slate-700">{name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount <ArrowUpDown size={11} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-slate-700">
          ${Number(row.getValue("totalAmount")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-500 border-slate-200";
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${cls}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "invoiceDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">{row.getValue("invoiceDate") || "—"}</span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const invoice = row.original;
        const copied  = copiedId === invoice.invoiceId;
        const isExpired = invoice.status === "Expired";
        const isPaid    = invoice.status === "Paid";
        return (
          <div className="flex items-center gap-1">
            {!isPaid && invoice.invoiceLink && (
              <button
                onClick={() => handleCopyLink(invoice.invoiceLink, invoice.invoiceId)}
                title="Copy invoice link"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            )}
            <Link
              href={`/admin/company/${invoice.companySlug}/invoices/${invoice.invoiceId}/invoice-details`}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="View details"
            >
              <ExternalLink size={13} />
            </Link>
            {!isExpired && !isPaid && (
              <button
                onClick={() => setExpireTarget({ id: invoice.invoiceId, number: invoice.invoiceNumber })}
                title="Mark as Expired"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
              >
                <Clock size={13} />
              </button>
            )}
            <button
              onClick={() => setDeleteTarget({ id: invoice.invoiceId, number: invoice.invoiceNumber })}
              title="Delete invoice"
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
  });

  const totalCount    = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <>
    {deleteTarget && (
      <ConfirmDialog
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteTarget.number}"?`}
        confirmLabel="Delete"
        confirmCls="red"
        icon={AlertTriangle}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    )}
    {expireTarget && (
      <ConfirmDialog
        title="Expire Invoice"
        message={`Mark invoice "${expireTarget.number}" as Expired? Client will no longer be able to pay.`}
        confirmLabel="Mark Expired"
        confirmCls="orange"
        icon={Clock}
        onConfirm={handleExpire}
        onCancel={() => setExpireTarget(null)}
      />
    )}
    <Card className="p-6 rounded-xl shadow-md flex flex-col min-h-[64vh]">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400 animate-pulse">Loading invoices…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search invoice #…"
                value={table.getColumn("invoiceNumber")?.getFilterValue() ?? ""}
                onChange={(e) => table.getColumn("invoiceNumber")?.setFilterValue(e.target.value)}
                className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500"
              />
            </div>

            {/* Company filter */}
            <div className="relative flex items-center gap-1.5">
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
              {selectedCount > 0 ? `${selectedCount} selected · ` : ""}{totalCount} invoices
            </span>

            <AdminInvoicedialog setInvoices={setInvoices} />
          </div>

          {/* Table */}
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-sm text-slate-400">No invoices yet.</p>
              <AdminInvoicedialog setInvoices={setInvoices} />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-100 bg-slate-50/60">
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
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
                          No invoices match your filters
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
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
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

export default ListAllInvoices;
