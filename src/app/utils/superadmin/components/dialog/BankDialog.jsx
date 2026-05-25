"use client";
import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { createallBanks } from "@/features/Slice/BankSlice";
import { Banknote, Plus, Loader2, CreditCard, Building2, Hash, FileText, DollarSign } from "lucide-react";

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

const BankDialog = ({ open, setOpen }) => {
  const { curency } = useSelector((state) => state.Curency);
  const { user }   = useSelector((state) => state.User);
  const dispatch   = useDispatch();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    bankTitle:         "",
    accountHolderName: "",
    accountType:       "Current",
    branchCode:        "",
    iban:              "",
    balance:           "",
    currency: {
      code:        curency[0]?.currencyCode,
      symbol:      curency[0]?.currencySymbol,
      CurencyName: curency[0]?.currencyName,
      rate:        curency[0]?.Curencyrate,
    },
    notes: "",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCurrencySelect = (currencyCode) => {
    const selected = curency.find((c) => c.currencyCode === currencyCode);
    setFormData({
      ...formData,
      currency: {
        code:        selected.currencyCode,
        symbol:      selected.currencySymbol,
        CurencyName: selected.currencyName,
        rate:        selected.Curencyrate,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("/api/acounts/banks/create", { ...formData, userid: user?.accountId });
      if (res.data.success) {
        dispatch(createallBanks(res.data.banks));
        toast.success("Bank account added successfully!");
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
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
          <Plus size={15} />
          Add Bank Account
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Banknote size={18} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Add Bank Account
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Enter the bank account details below</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <Section title="Bank Details" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank Title" required icon={Building2}>
                <Input
                  name="bankTitle"
                  placeholder="e.g. HBL Main Account"
                  value={formData.bankTitle}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>

              <Field label="Account Holder Name" required icon={CreditCard}>
                <Input
                  name="accountHolderName"
                  placeholder="Enter holder name"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>

              <Field label="Account Type" required icon={Building2}>
                <Input
                  name="accountType"
                  placeholder="Current / Savings"
                  value={formData.accountType}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>

              <Field label="Branch Code" required icon={Hash}>
                <Input
                  name="branchCode"
                  placeholder="e.g. 0001"
                  value={formData.branchCode}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </Field>

              <div className="col-span-2">
                <Field label="IBAN / Virtual Account #" required icon={CreditCard}>
                  <Input
                    name="iban"
                    placeholder="PK00XXXX0000000000000000"
                    value={formData.iban}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            <Section title="Financial Details" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Currency" required icon={DollarSign}>
                <Select value={formData.currency.code} onValueChange={handleCurrencySelect}>
                  <SelectTrigger className={`${inputCls} w-full`}>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {curency?.map((item) => (
                      <SelectItem key={item.curencyid} value={item.currencyCode}>
                        {item.currencyCode} — {item.currencyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Initial Balance" required icon={DollarSign}>
                <div className="flex h-9 rounded-lg overflow-hidden border border-slate-200 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="px-3 bg-slate-100 border-r border-slate-200 flex items-center text-sm font-medium text-slate-500 shrink-0">
                    {formData.currency.symbol || "$"}
                  </span>
                  <input
                    name="balance"
                    type="number"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={handleChange}
                    required
                    className="flex-1 text-sm bg-slate-50 px-3 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </Field>

              <div className="col-span-2">
                <Field label="Notes" icon={FileText}>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Optional remarks…"
                    rows={3}
                    className="text-sm bg-slate-50 border-slate-200 rounded-lg resize-none focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400"
                  />
                </Field>
              </div>
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
                <><Plus size={14} /> Add Bank</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BankDialog;
