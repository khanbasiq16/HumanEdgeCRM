"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import axios from "axios";
import { Tag, Plus, Loader2, FileText } from "lucide-react";

/* ── Field wrapper ──────────────────────────────────────── */
const Field = ({ label, required, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-slate-400" />}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-violet-500 focus-visible:ring-1 placeholder:text-slate-400";

const ExpensesCatdailog = () => {
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    expenseName:  "",
    expenseType:  "Variable",
    description:  "",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.expenseName || !formData.expenseType) {
      return toast.error("Expense name & type are required");
    }
    try {
      setLoading(true);
      const res = await axios.post("/api/acounts/expenses/create-category", {
        expenseCategoryName:        formData.expenseName,
        expenseCategoryType:        formData.expenseType,
        expenseCategoryDescription: formData.description,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setFormData({ expenseName: "", expenseType: "Variable", description: "" });
        setOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors">
          <Tag size={14} className="text-slate-400" />
          Add Category
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
              <Tag size={16} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Add Expense Category
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Define a new expense category</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <Field label="Category Name" required icon={Tag}>
              <Input
                name="expenseName"
                placeholder="e.g. Office Rent, Travel"
                value={formData.expenseName}
                onChange={handleChange}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Expense Type" required icon={Tag}>
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 gap-0.5">
                {[
                  { label: "Fixed",    value: "Fixed" },
                  { label: "Variable", value: "Variable" },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, expenseType: value })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      formData.expenseType === value
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Description" icon={FileText}>
              <Textarea
                name="description"
                placeholder="Optional description…"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="text-sm bg-slate-50 border-slate-200 rounded-lg resize-none focus-visible:ring-violet-500 focus-visible:ring-1 placeholder:text-slate-400"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-violet-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Plus size={14} /> Add Category</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesCatdailog;
