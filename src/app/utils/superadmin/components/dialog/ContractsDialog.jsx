"use client";

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { createcontracts } from "@/features/Slice/ContractsSlice";
import {
  FileText, Plus, Loader2, ChevronLeft, ChevronRight,
  Building2, FileSignature, FileCheck, Check,
} from "lucide-react";

const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

const ContractDialog = () => {
  const dispatch = useDispatch();
  const [open, setOpen]                   = useState(false);
  const [step, setStep]                   = useState(1);
  const [contractName, setContractName]   = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading]             = useState(false);

  const { id } = useParams();
  const { user }      = useSelector((s) => s.User);
  const { clients }   = useSelector((s) => s.Client);
  const { templates } = useSelector((s) => s.Templates);

  const resetState = () => {
    setStep(1);
    setContractName("");
    setSelectedClient(null);
    setSelectedTemplate(null);
  };

  const handleNext = () => {
    if (!contractName.trim()) {
      toast.error("Please enter a contract name");
      return;
    }
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }
    setStep(2);
  };

  const formHandler = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/create-contract", {
        userid: user?.uid,
        contractName,
        templateId: selectedTemplate,
        clientId: selectedClient,
        companyid: id,
        status: "active",
      });
      if (res.data.success) {
        toast.success("Contract created successfully!");
        dispatch(createcontracts(res.data?.contracts));
        resetState();
        setOpen(false);
      } else {
        toast.error(res.data.message || "Failed to create contract");
      }
    } catch {
      toast.error("Something went wrong while creating contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200">
          <Plus size={13} />
          Create Contract
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <FileText size={17} className="text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                  {step === 1 ? "New Contract" : "Select Template"}
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  {step === 1 ? "Enter contract details and select a client" : "Choose a template for this contract"}
                </p>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {step > 1 ? <Check size={12} /> : "1"}
              </div>
              <div className="w-5 h-px bg-slate-300" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                2
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1 */}
        {step === 1 && (
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <FileText size={12} className="text-slate-400" />
                Contract Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Service Agreement 2025"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Building2 size={12} className="text-slate-400" />
                Client <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedClient || ""} onValueChange={setSelectedClient}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.length > 0 ? (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.clientName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No clients available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={formHandler}>
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                Available Templates
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {templates?.length > 0 ? (
                  templates.map((t) => {
                    const isSelected = selectedTemplate === t.id;
                    const isContract = t.role === "Admin" || t.role === "Contract";
                    const logo = t.company?.companylogo || t.company?.companyLogo;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto overflow-hidden">
                          {logo ? (
                            <img src={logo} alt={t.company?.name} className="w-full h-full object-contain" />
                          ) : (
                            <FileText size={16} className="text-slate-400" />
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 text-center line-clamp-2 leading-tight">
                          {t.templateName || "Untitled"}
                        </p>
                        <span className={`mx-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isContract
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {isContract ? <FileSignature size={9} /> : <FileCheck size={9} />}
                          {isContract ? "Contract" : "Letter"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-10 text-center">
                    <FileText size={24} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">No templates available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Creating…</>
                ) : (
                  <><FileText size={14} /> Create Contract</>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContractDialog;
