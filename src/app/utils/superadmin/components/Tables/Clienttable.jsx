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
import { Search, ChevronLeft, ChevronRight, Copy, ExternalLink, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

export function Clienttable({ clients, slug }) {
  const [sorting, setSorting]               = React.useState([]);
  const [columnFilters, setColumnFilters]   = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection]     = React.useState({});
  const [copiedId, setCopiedId]             = React.useState(null);

  const handleCopyEmail = (email, id) => {
    navigator.clipboard.writeText(email);
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
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row, rowIndex }) => {
        const name = row.getValue("clientName") || "";
        const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        const colorCls = AVATAR_COLORS[row.index % AVATAR_COLORS.length];
        return (
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorCls}`}>
              {initials}
            </div>
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "clientEmail",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 truncate max-w-[160px] block">
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
        if (!url) return <span className="text-sm text-slate-400">—</span>;
        const display = url.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "");
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {display}
            <ExternalLink size={10} />
          </a>
        );
      },
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 truncate max-w-[120px] block capitalize">
          {row.getValue("companyName") || "—"}
        </span>
      ),
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
            <Link
              href={`/admin/company/${slug}/clients/${client?.id}/client-details`}
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
    data: clients,
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
            placeholder="Search clients…"
            value={table.getColumn("clientName")?.getFilterValue() ?? ""}
            onChange={(e) => table.getColumn("clientName")?.setFilterValue(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm rounded-lg focus-visible:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium ml-auto">
          {selectedCount > 0 ? `${selectedCount} selected · ` : ""}{totalCount} clients
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
                  No clients found
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
}
