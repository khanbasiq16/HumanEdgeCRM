"use client";

import React, { useState, useMemo } from "react";
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
import { useSelector } from "react-redux";
import {
  Receipt, Plus, Loader2, Tag, Calendar, CreditCard,
  Banknote, FileText, ImagePlus, X,
} from "lucide-react";

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

const Section = ({ title }) => (
  <div className="pb-2 border-b border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
  </div>
);

const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";
const selectCls = `${inputCls} w-full`;

const ExpenseDialog = ({ expensesCategories = [], bankaccounts = [], setExpenses }) => {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [expenseType, setExpenseType] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("Rs");

  const { user } = useSelector((state) => state?.User);

  const [formData, setFormData] = useState({
    amount:        "",
    categoryId:    "",
    date:          "",
    description:   "",
    paymentMethod: "",
    bankAccountId: "",
    files:         [],
  });

  const filteredCategories = useMemo(() => {
    if (!expenseType) return expensesCategories;
    return expensesCategories.filter(
      (cat) => cat.expenseCategoryType?.toLowerCase() === expenseType.toLowerCase()
    );
  }, [expenseType, expensesCategories]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "paymentMethod" && value !== "Bank" ? { bankAccountId: "" } : {}),
    }));
    if (name === "paymentMethod" && value !== "Bank") setSelectedCurrency("Rs");
  };

  const handleBankChange = (bankId) => {
    const bank = bankaccounts.find((b) => b.id === bankId);
    setFormData((prev) => ({ ...prev, bankAccountId: bankId }));
    setSelectedCurrency(bank?.currency?.symbol || "Rs");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, files }));
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    setFormData((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expenseType) return toast.error("Please select expense type");
    if (!formData.amount || !formData.categoryId || !formData.date)
      return toast.error("Amount, Category & Date are required");
    if (formData.paymentMethod === "Bank" && !formData.bankAccountId)
      return toast.error("Please select a bank account");

    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "files") value.forEach((f) => data.append("files", f));
        else data.append(key, value);
      });
      data.append("userid", user?.accountId);
      data.append("expenseType", expenseType);

      const res = await axios.post("/api/acounts/expenses/create", data);
      if (res.data.success) {
        toast.success(res.data.message);
        setExpenses(res.data.expenses);
        setFormData({ amount: "", categoryId: "", date: "", description: "", paymentMethod: "", bankAccountId: "", files: [] });
        setExpenseType("");
        setSelectedCurrency("Rs");
        setPreviews([]);
        setOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
          <Plus size={15} />
          Add Expense
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[580px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Receipt size={16} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Add Expense
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Record a new expense entry</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <Section title="Expense Details" />

            {/* Expense type pills */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Tag size={12} className="text-slate-400" />
                Expense Type <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 gap-0.5">
                {[
                  { label: "Fixed",    value: "Fixed" },
                  { label: "Variable", value: "Variable" },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setExpenseType(value);
                      setFormData((prev) => ({ ...prev, categoryId: "" }));
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      expenseType === value
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <Field label="Amount" required icon={Banknote}>
                <div className="flex h-9 rounded-lg overflow-hidden border border-slate-200 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="px-3 bg-slate-100 border-r border-slate-200 flex items-center text-sm font-medium text-slate-500 shrink-0">
                    {formData.paymentMethod === "Bank" ? selectedCurrency : "Rs"}
                  </span>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    className="flex-1 text-sm bg-slate-50 px-3 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </Field>

              {/* Date */}
              <Field label="Date" required icon={Calendar}>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>

              {/* Category */}
              <Field label="Category" required icon={Tag}>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => handleSelectChange("categoryId", v)}
                >
                  <SelectTrigger className={selectCls}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {expenseType ? "No categories for this type" : "Select a type first"}
                      </SelectItem>
                    ) : (
                      filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.expenseCategoryName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>

              {/* Payment Method */}
              <Field label="Payment Method" icon={CreditCard}>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => handleSelectChange("paymentMethod", v)}
                >
                  <SelectTrigger className={selectCls}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank Account</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Bank selector — only when Bank is chosen */}
              {formData.paymentMethod === "Bank" && (
                <div className="col-span-2">
                  <Field label="Bank Account" required icon={Banknote}>
                    <Select value={formData.bankAccountId} onValueChange={handleBankChange}>
                      <SelectTrigger className={selectCls}>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankaccounts.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.banktitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}

              {/* Description */}
              <div className="col-span-2">
                <Field label="Description" icon={FileText}>
                  <Textarea
                    name="description"
                    placeholder="Optional notes about this expense…"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="text-sm bg-slate-50 border-slate-200 rounded-lg resize-none focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400"
                  />
                </Field>
              </div>
            </div>

            <Section title="Attachments" />

            {/* File upload */}
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <ImagePlus size={20} className="text-slate-300 group-hover:text-blue-400 transition-colors mb-1" />
                <span className="text-xs text-slate-400 group-hover:text-blue-500 font-medium transition-colors">
                  Click to upload images
                </span>
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square">
                      <img src={src} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Plus size={14} /> Add Expense</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDialog;
