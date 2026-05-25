"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import axios from "axios";
import { Send, Loader2, User, Mail, Phone } from "lucide-react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getallclients } from "@/features/Slice/ClientSlice";

const selectCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-emerald-500 focus-visible:ring-1";

const SendContractDialog = ({ contractid }) => {
  const [open, setOpen]                 = useState(false);
  const [loading, setLoading]           = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [clientInfo, setClientInfo]     = useState(null);

  const { id } = useParams();
  const dispatch = useDispatch();
  const { clients } = useSelector((s) => s.Client);

  useEffect(() => {
    const fetchclients = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/get-all-clients/${id}`);
        if (res.data.success) dispatch(getallclients(res.data.clients));
      } catch {
        dispatch(getallclients([]));
      } finally {
        setLoading(false);
      }
    };
    fetchclients();
  }, [id, dispatch]);

  const handleClientSelect = (value) => {
    setSelectedClient(value);
    setClientInfo(clients.find((c) => c.id === value) || null);
  };

  const handleSendContract = async () => {
    if (!selectedClient) return toast.error("Please select a client");
    setLoading(true);
    try {
      const res = await axios.post("/api/contracts/send", {
        clientId: selectedClient,
        contractid,
        companyslug: id,
      });
      if (res.data.success) {
        toast.success("Contract sent successfully");
        setOpen(false);
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error("Failed to send contract");
      }
    } catch {
      toast.error("Error sending contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold transition-colors">
          <Send size={14} />
          Send Contract
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Send size={16} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Send Contract
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Select a client to receive this contract</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <User size={12} className="text-slate-400" />
              Select Client
            </Label>
            <Select value={selectedClient} onValueChange={handleClientSelect}>
              <SelectTrigger className={selectCls}>
                <SelectValue placeholder="Choose client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.length > 0 ? (
                  clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.clientName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">No clients found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {clientInfo && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Client Info</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <User size={13} className="text-emerald-500 shrink-0" />
                  <span className="font-semibold">{clientInfo.clientName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={13} className="text-emerald-500 shrink-0" />
                  {clientInfo.clientEmail}
                </div>
                {clientInfo.clientPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={13} className="text-emerald-500 shrink-0" />
                    {clientInfo.clientPhone}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendContract}
            disabled={loading || !selectedClient}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Sending…</>
            ) : (
              <><Send size={14} /> Send Contract</>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendContractDialog;
