"use client";
import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar, ChevronLeft, ChevronRight, Check } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const MonthPicker = ({ value, onChange }) => {
  const [open, setOpen]               = React.useState(false);
  const currentYear                   = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(
    value ? +value.split("-")[0] : currentYear
  );
  const [selectedMonth, setSelectedMonth] = React.useState(
    value ? +value.split("-")[1] - 1 : new Date().getMonth()
  );

  const activeYear  = value ? +value.split("-")[0] : null;
  const activeMonth = value ? +value.split("-")[1] - 1 : null;

  const displayLabel = value
    ? `${MONTHS[activeMonth]} ${activeYear}`
    : "Select Month";

  const handleSelect = () => {
    const monthValue = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    onChange(monthValue);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`
          inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm border transition-colors
          ${value
            ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
            : "bg-slate-50 border-slate-200 text-slate-500 font-medium hover:border-slate-300"}
        `}>
          <Calendar size={14} className={value ? "text-blue-500" : "text-slate-400"} />
          <span>{displayLabel}</span>
          {value && (
            <span
              onClick={handleClear}
              className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 hover:bg-blue-300 text-[10px] font-bold cursor-pointer"
            >
              ×
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-0 rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        align="start"
        sideOffset={6}
      >
        {/* Year navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-slate-800">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5 p-4">
          {MONTHS.map((month, index) => {
            const isSelected = selectedMonth === index;
            const isActive   = activeMonth === index && activeYear === selectedYear;
            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(index)}
                className={`
                  relative h-9 rounded-xl text-sm font-semibold transition-all
                  ${isSelected
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-slate-600 hover:bg-slate-100"}
                `}
              >
                {month.slice(0, 3)}
                {isActive && !isSelected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 h-9 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="flex-1 h-9 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200"
          >
            <Check size={13} />
            Select
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MonthPicker;
