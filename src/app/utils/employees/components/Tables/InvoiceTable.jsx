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
  Search, ChevronLeft, ChevronRight, Copy, ExternalLink,
  Check, ArrowUpDown, Send, X, AlertCircle, Loader2, Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_STYLES = {
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  Sent:  "bg-blue-50 text-blue-700 border-blue-200",
  Paid:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/* ── Send Confirm Modal ── */
const SendModal = ({ invoice, onClose, onSuccess }) => {
  const [client,  setClient]  = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!invoice?.clientId) { setLoading(false); return; }
    axios.get(`/api/get-client/${invoice.clientId}`)
      .then((r) => setClient(r.data?.client || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoice?.clientId]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await axios.post("/api/send-invoice-email", {
        to:            client?.clientEmail,
        invoiceLink:   invoice.invoiceLink,
        invoiceid:     invoice.invoiceId,
        slug:          invoice.companySlug,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount:   invoice.totalAmount,
        description:   invoice.Description,
        clientName:    client?.clientName,
      });
      if (res.data?.success) {
        toast.success("Invoice sent successfully!");
        onSuccess();
      } else {
        toast.error(res.data?.message || "Failed to send invoice");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Send size={14} className="text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-900">Send Invoice</p>
          </div>
          <button onClick={onClose} disabled={sending}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-50">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              This will send a professional invoice email to the client using{" "}
              <strong>{invoice?.companyName}</strong>'s email settings.
            </p>
          </div>

          {/* Invoice preview */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Preview</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Invoice No.</span>
                <span className="text-xs font-bold text-slate-800">{invoice?.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Amount</span>
                <span className="text-xs font-bold text-emerald-600">
                  ${Number(invoice?.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recipient */}
          {loading ? (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <Loader2 size={13} className="animate-spin text-slate-400" />
              <p className="text-xs text-slate-400">Loading client info…</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sending to</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {client?.clientEmail || "Client email not found"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={sending}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || loading || !client?.clientEmail}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            {sending
              ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
              : <><Send size={13} /> Confirm & Send</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main table ── */
export const InvoiceTable = ({ invoices, slug, companyslug, onRefresh }) => {
  const [sorting, setSorting]               = React.useState([]);
  const [columnFilters, setColumnFilters]   = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection]     = React.useState({});
  const [copiedId, setCopiedId]             = React.useState(null);
  const [sendInvoice, setSendInvoice]       = React.useState(null);

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
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 truncate max-w-32 block">
          {row.getValue("companyName") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "assignedEmployeeName",
      header: "Employee",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 truncate max-w-32 block">
          {row.getValue("assignedEmployeeName") || "—"}
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
      accessorKey: "invoiceDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-slate-400 whitespace-nowrap">
          {row.getValue("invoiceDate") || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const invoice = row.original;
        const copied  = copiedId === invoice.invoiceId;
        return (
          <div className="flex items-center gap-1">
            {/* Send — Draft only */}
            {invoice.status === "Draft" && (
              <button
                onClick={() => setSendInvoice(invoice)}
                title="Send invoice"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Send size={13} />
              </button>
            )}

            {/* Copy link — non-Paid only */}
            {invoice.status !== "Paid" && invoice.invoiceLink && (
              <button
                onClick={() => handleCopyLink(invoice.invoiceLink, invoice.invoiceId)}
                title="Copy invoice link"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            )}

            {/* View details */}
            <Link
              href={`/employee/${companyslug}/company/${slug}/invoices/${invoice?.invoiceId}/invoice-details`}
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
    <>
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

      {/* Send confirm modal */}
      {sendInvoice && (
        <SendModal
          invoice={sendInvoice}
          onClose={() => setSendInvoice(null)}
          onSuccess={() => {
            setSendInvoice(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};

export default InvoiceTable;
