"use client";

import React, { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Tag } from "lucide-react";
import MonthPicker from "../basecomponent/MonthPicker";

export default function Expensetable({ expenses, expenseCategory }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMonth, setSelectedMonth]           = useState(null);
  const [expenseType, setExpenseType]               = useState("all");
  const [searchValue, setSearchValue]               = useState("");

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(exp.expensecategoryName)) return false;
      if (selectedMonth) {
        const expMonth = new Date(exp.date).toISOString().slice(0, 7);
        if (expMonth !== selectedMonth) return false;
      }
      if (expenseType !== "all" && exp.expensecategoryType?.toLowerCase() !== expenseType) return false;
      if (searchValue && !exp.expensecategoryName?.toLowerCase().includes(searchValue.toLowerCase())) return false;
      return true;
    });
  }, [expenses, selectedCategories, selectedMonth, expenseType, searchValue]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
    [filteredExpenses]
  );

  const columns = useMemo(() => [
    {
      accessorKey: "expensecategoryName",
      header: "Category",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Tag size={12} className="text-blue-500" />
          </div>
          <span className="text-sm font-semibold text-slate-700">{row.getValue("expensecategoryName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "expensecategoryType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("expensecategoryType") || "";
        const isFixed = type.toLowerCase() === "fixed";
        return (
          <span className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize
            ${isFixed
              ? "bg-violet-50 text-violet-700 border-violet-200"
              : "bg-amber-50 text-amber-700 border-amber-200"}
          `}>
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-slate-800 tabular-nums">
          Rs {Number(row.getValue("amount")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "Username",
      header: "Created By",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{row.getValue("Username") || "—"}</span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{row.getValue("paymentMethod") || "—"}</span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const d = new Date(row.getValue("date"));
        return (
          <span className="text-sm text-slate-500">
            {d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: filteredExpenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3.5 border-b border-slate-100">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search category…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 h-8 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month picker */}
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

          {/* Type pills */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 gap-0.5">
            {[
              { label: "All",      value: "all" },
              { label: "Fixed",    value: "fixed" },
              { label: "Variable", value: "variable" },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setExpenseType(value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  expenseType === value
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <SlidersHorizontal size={12} />
                Categories
                {selectedCategories.length > 0 && (
                  <span className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {selectedCategories.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl max-h-60 overflow-auto">
              {expenseCategory.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  className="text-sm"
                  checked={selectedCategories.includes(cat.expenseCategoryName)}
                  onCheckedChange={(checked) =>
                    setSelectedCategories((prev) =>
                      checked
                        ? [...prev, cat.expenseCategoryName]
                        : prev.filter((c) => c !== cat.expenseCategoryName)
                    )
                  }
                >
                  {cat.expenseCategoryName}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Total amount */}
          <div className="ml-auto bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold tabular-nums whitespace-nowrap">
            Total: Rs {totalAmount.toLocaleString()}
          </div>
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
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
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {filteredExpenses.length} result{filteredExpenses.length !== 1 ? "s" : ""}
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
