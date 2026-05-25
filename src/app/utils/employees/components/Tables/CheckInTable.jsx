"use client";
import React from "react";
import axios from "axios";
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, MoreHorizontal, Search, Calendar, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useParams } from "next/navigation";

/* ── Working hours helpers ──────────────────────────────── */
const parseTime12 = (str) => {
  if (!str || str === "N/A" || str === "—") return null;
  const parts = str.trim().split(" ");
  if (parts.length < 2) return null;
  let [h, m] = parts[0].split(":").map(Number);
  const mer = parts[1].toUpperCase();
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

const calcDuration = (checkinStr, checkoutStr) => {
  const ci = parseTime12(checkinStr);
  const co = parseTime12(checkoutStr);
  if (ci === null || co === null) return "—";
  let diff = co - ci;
  if (diff < 0) diff += 1440;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

/* ── Status badge ───────────────────────────────────────── */
const STATUS_STYLES = {
  "On Time":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Late":     "bg-amber-50  text-amber-700  border-amber-200",
  "Half Day": "bg-blue-50   text-blue-700   border-blue-200",
  "Short Day":"bg-violet-50 text-violet-700 border-violet-200",
  "Absent":   "bg-red-50    text-red-700    border-red-200",
};
const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_STYLES[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
    {status || "N/A"}
  </span>
);

/* ── Main component ─────────────────────────────────────── */
const CheckInTable = ({ data = [], setemployee }) => {
  const [sorting, setSorting]                   = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection]         = React.useState({});
  const [searchDate, setSearchDate]             = React.useState("");
  const [searchMonth, setSearchMonth]           = React.useState("");
  const [searchYear, setSearchYear]             = React.useState("");
  const [loading, setLoading]                   = React.useState(false);

  const { user }       = useSelector((s) => s.User);
  const { employeeid } = useParams();

  const processedData = React.useMemo(() =>
    data.map((item, idx) => {
      let dateObj;
      if (item.date?.includes("/")) {
        const [d, m, y] = item.date.split("/");
        dateObj = new Date(`${y}-${m}-${d}`);
      } else {
        dateObj = new Date(item.date || item.createdAt || Date.now());
      }
      const checkoutTime = item.checkoutTime || null;
      return {
        id: item.id || item._id || idx,
        ip:            item.ip    || "N/A",
        time:          item.time  || "N/A",
        note:          item.note  || "—",
        status:        item.status || "N/A",
        checkoutTime,
        hoursWorked:   calcDuration(item.time, checkoutTime),
        dateObj,
        formattedDate: dateObj.toLocaleDateString("en-GB"),
        month:         dateObj.toLocaleString("default", { month: "long" }),
        year:          dateObj.getFullYear().toString(),
      };
    }),
  [data]);

  const filteredData = React.useMemo(() =>
    processedData.filter((item) => {
      const matchDate  = searchDate  ? item.dateObj.toISOString().split("T")[0] === searchDate : true;
      const matchMonth = searchMonth ? item.month.toLowerCase().includes(searchMonth.toLowerCase()) : true;
      const matchYear  = searchYear  ? item.year.includes(searchYear) : true;
      return matchDate && matchMonth && matchYear;
    }),
  [processedData, searchDate, searchMonth, searchYear]);

  const columns = React.useMemo(() => [
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
      enableSorting: false, enableHiding: false,
    },
    { accessorKey: "formattedDate", header: "Date" },
    { accessorKey: "time",          header: "Check In" },
    {
      accessorKey: "hoursWorked",
      header: "Hours Worked",
      cell: ({ row }) => {
        const v = row.getValue("hoursWorked");
        return (
          <span className={`text-sm font-semibold ${v === "—" ? "text-slate-300" : "text-slate-700"}`}>
            {v}
          </span>
        );
      },
    },
    {
      accessorKey: "status", header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    { accessorKey: "ip",   header: "IP Address" },
    {
      accessorKey: "note", header: "Note",
      cell: ({ row }) => <span className="text-slate-500 text-xs italic">{row.getValue("note")}</span>,
    },
    { accessorKey: "month", header: "Month" },
    { accessorKey: "year",  header: "Year"  },
    {
      id: "actions", header: "",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onClick={() => navigator.clipboard.writeText(r.ip)}>Copy IP</DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={() => toast(`Note: ${r.note || "No note"}`)}>View Note</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: filteredData, columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleStatusUpdate = async (newStatus) => {
    const rows = table.getSelectedRowModel().rows;
    if (!rows.length) { toast.error("Select at least one row"); return; }
    try {
      setLoading(true);
      const ids = rows.map((r) => r.original.id);
      const res = await axios.post("/api/attendance/updatestatuscheckin", { ids, status: newStatus, employeeid });
      if (res.data.success) {
        toast.success(`Updated ${ids.length} record(s) to "${newStatus}"`);
        setemployee(res.data.employee);
      }
    } catch { toast.error("Failed to update status"); }
    finally { setLoading(false); table.resetRowSelection(); }
  };

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-3">

      {/* ── Filter toolbar ── */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Date */}
        <div className="relative">
          <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer w-36"
          />
        </div>

        {/* Month */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Month…"
            value={searchMonth}
            onChange={(e) => setSearchMonth(e.target.value)}
            className="h-8 pl-8 w-28 text-xs bg-white border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1"
          />
        </div>

        {/* Year */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Year…"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            className="h-8 pl-8 w-24 text-xs bg-white border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1"
          />
        </div>

        {/* Status update (superAdmin / admin only) */}
        {(user?.role === "superAdmin" || user?.role === "admin") && (
          <Select onValueChange={handleStatusUpdate} disabled={loading}>
            <SelectTrigger className="h-8 w-40 text-xs bg-white border-slate-200 rounded-lg">
              <SlidersHorizontal size={12} className="text-slate-400 mr-1.5" />
              <SelectValue placeholder={loading ? "Updating…" : "Change Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="On Time Check In" className="text-xs">On Time</SelectItem>
              <SelectItem value="Late Check In"    className="text-xs">Late</SelectItem>
              <SelectItem value="Half Day"         className="text-xs">Half Day</SelectItem>
              <SelectItem value="Short Day"        className="text-xs">Short Day</SelectItem>
              <SelectItem value="Absent"           className="text-xs">Absent</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-auto h-8 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <ChevronDown size={13} /> Columns
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(v) => col.toggleVisibility(!!v)}
                className="capitalize text-xs"
              >
                {col.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 text-sm"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Calendar size={28} className="text-slate-200" />
                    <p className="text-sm font-medium">No attendance records</p>
                    <p className="text-xs">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400 font-medium">
          {selectedCount > 0 ? `${selectedCount} selected · ` : ""}
          {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInTable;
