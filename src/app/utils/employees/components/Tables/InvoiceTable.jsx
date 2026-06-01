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
  ArrowUpDown, ChevronLeft, ChevronRight,
  Copy, Eye, MoreHorizontal, Search, FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  Sent:  "bg-blue-50  text-blue-700  border-blue-200",
  Paid:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const InvoiceTable = ({ invoices, slug, companyslug }) => {
  const [sorting,          setSorting]          = React.useState([]);
  const [globalFilter,     setGlobalFilter]     = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection,     setRowSelection]     = React.useState({});

  const columns = [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
        >
          Invoice # <ArrowUpDown size={10} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <FileText size={13} className="text-blue-500" />
          </div>
          <span className="font-mono text-xs font-bold text-slate-700">
            {row.getValue("invoiceNumber")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "clientName",
      header: () => (
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Client
        </span>
      ),
      cell: ({ row }) => {
        const name = row.getValue("clientName") || row.original?.client?.name || "—";
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-violet-700">
                {name[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-sm font-medium text-slate-700 truncate max-w-[130px]">
              {name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
        >
          Amount <ArrowUpDown size={10} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-bold text-slate-800">
          ${Number(row.getValue("totalAmount") || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Status
        </span>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") || "Draft";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              STATUS_STYLES[status] ?? "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
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
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg">
              {invoice.status !== "Paid" && (
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(invoice.invoiceLink || "");
                    toast.success("Link copied!");
                  }}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-lg"
                >
                  <Copy size={13} className="text-slate-400" /> Copy Invoice Link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="p-0 rounded-lg">
                <Link
                  href={`/employee/${companyslug}/company/${slug}/invoices/${invoice?.invoiceId}/invoice-details`}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm"
                >
                  <Eye size={13} className="text-slate-400" /> View Details
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: invoices,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnVisibility, rowSelection, globalFilter },
  });

  return (
    <div className="space-y-4">

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search by invoice number, client, or amount…"
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/60 placeholder:text-slate-400 transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-14 text-sm text-slate-400"
                >
                  No invoices match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400">
          {table.getFilteredRowModel().rows.length} invoice
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-slate-500 px-2 min-w-[50px] text-center">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;
