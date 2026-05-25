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
import { Search, ChevronLeft, ChevronRight, Copy, ExternalLink, Check, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

const STATUS_STYLES = {
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  Sent:  "bg-blue-50 text-blue-700 border-blue-200",
  Paid:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const InvoiceTable = ({ invoices, slug }) => {
  const [sorting, setSorting]               = React.useState([]);
  const [columnFilters, setColumnFilters]   = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection]     = React.useState({});
  const [copiedId, setCopiedId]             = React.useState(null);

  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
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
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const invoice = row.original;
        const copied  = copiedId === invoice.invoiceId;
        return (
          <div className="flex items-center gap-1">
            {invoice.status !== "Paid" && invoice.invoiceLink && (
              <button
                onClick={() => handleCopyLink(invoice.invoiceLink, invoice.invoiceId)}
                title="Copy invoice link"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            )}
            <Link
              href={`/admin/company/${slug}/invoices/${invoice?.invoiceId}/invoice-details`}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="View details"
            >
              <ExternalLink size={13} />
            </Link>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: invoices,
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
  const totalCount    = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search invoices…"
            value={table.getColumn("invoiceNumber")?.getFilterValue() ?? ""}
            onChange={(e) => table.getColumn("invoiceNumber")?.setFilterValue(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium ml-auto">
          {selectedCount > 0 ? `${selectedCount} selected · ` : ""}{totalCount} invoices
        </span>
      </div>

      {/* Table */}
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
                  No invoices found
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
    </div>
  );
};

export default InvoiceTable;
