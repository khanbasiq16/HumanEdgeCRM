"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { getallipwhitelist } from "@/features/Slice/IpwhiteSlice";
import {
  Wifi, Plus, Loader2, Trash2, Pencil, Check, X, ShieldCheck, Globe,
} from "lucide-react";

const ANYWHERE_IP = "0.0.0.0/0";

const Ipwhitelistdialog = ({ open, setOpen }) => {
  const { ipwhitelist } = useSelector((state) => state.Ipwhitelist);
  const dispatch = useDispatch();

  const [entries, setEntries]         = useState([]);
  const [networkName, setNetworkName] = useState("");
  const [ip, setIp]                   = useState("");
  const [editIndex, setEditIndex]     = useState(null);
  const [loading, setLoading]         = useState(false);

  const hasAnywhere = entries.some((e) => e.ip === ANYWHERE_IP);

  useEffect(() => {
    if (open && Array.isArray(ipwhitelist)) {
      setEntries(ipwhitelist);
    }
  }, [open, ipwhitelist]);

  const toggleAnywhere = () => {
    if (hasAnywhere) {
      setEntries((prev) => prev.filter((e) => e.ip !== ANYWHERE_IP));
      toast.success("Anywhere Access removed");
    } else {
      setEntries((prev) => [{ networkName: "Anywhere Access", ip: ANYWHERE_IP }, ...prev]);
      toast.success("Anywhere Access enabled");
    }
  };

  const addOrUpdate = () => {
    if (!networkName.trim() || !ip.trim()) {
      toast.error("Network name and IP are required");
      return;
    }
    if (editIndex !== null) {
      const updated = [...entries];
      updated[editIndex] = { networkName, ip };
      setEntries(updated);
      setEditIndex(null);
      toast.success("Entry updated");
    } else {
      setEntries([...entries, { networkName, ip }]);
      toast.success("Entry added");
    }
    setNetworkName("");
    setIp("");
  };

  const startEdit = (index) => {
    setNetworkName(entries[index].networkName);
    setIp(entries[index].ip);
    setEditIndex(index);
  };

  const cancelEdit = () => {
    setNetworkName("");
    setIp("");
    setEditIndex(null);
  };

  const removeEntry = (index) => {
    setEntries(entries.filter((_, i) => i !== index));
    if (editIndex === index) cancelEdit();
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/create-ip-whitelist",
        { whitelist: entries ?? [] },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        toast.success("Whitelist saved successfully");
        dispatch(getallipwhitelist(res.data.whitelist));
        setOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200">
          <Plus size={13} />
          Add IP
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                IP Whitelist
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Manage allowed network IPs</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submitHandler}>
          <div className="px-6 py-5 space-y-5">

            {/* Anywhere Access toggle */}
            <div
              onClick={toggleAnywhere}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                hasAnywhere
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                hasAnywhere ? "bg-emerald-500" : "bg-white border border-slate-200"
              }`}>
                <Globe size={15} className={hasAnywhere ? "text-white" : "text-slate-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${hasAnywhere ? "text-emerald-800" : "text-slate-700"}`}>
                  Anywhere Access
                  <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 font-mono">
                    0.0.0.0/0
                  </span>
                </p>
                <p className={`text-xs mt-0.5 ${hasAnywhere ? "text-emerald-600" : "text-slate-400"}`}>
                  {hasAnywhere
                    ? "Employees can check in from any network or location"
                    : "Enable to allow check-in from any IP / network"}
                </p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors shrink-0 relative ${hasAnywhere ? "bg-emerald-500" : "bg-slate-200"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${hasAnywhere ? "left-5" : "left-0.5"}`} />
              </div>
            </div>

            {/* Input row */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                {editIndex !== null ? "Edit Entry" : "Add Specific IP"}
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Network Name"
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  className={`${inputCls} flex-1`}
                />
                <Input
                  placeholder="IP Address"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className={`${inputCls} flex-1`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addOrUpdate}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {editIndex !== null ? (
                    <><Check size={13} /> Update Entry</>
                  ) : (
                    <><Plus size={13} /> Add Entry</>
                  )}
                </button>
                {editIndex !== null && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Entries list */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                {entries.length} {entries.length === 1 ? "Entry" : "Entries"}
              </p>

              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Wifi size={24} className="text-slate-200" />
                  <p className="text-xs text-slate-400 font-medium">No IPs added yet</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {entries.map((item, index) => {
                    const isAnywhere = item.ip === ANYWHERE_IP;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                          editIndex === index
                            ? "bg-blue-50 border-blue-200"
                            : isAnywhere
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isAnywhere ? "bg-emerald-500" : "bg-white border border-slate-200"
                        }`}>
                          {isAnywhere
                            ? <Globe size={13} className="text-white" />
                            : <Wifi size={13} className="text-blue-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${isAnywhere ? "text-emerald-800" : "text-slate-700"}`}>
                              {item.networkName}
                            </p>
                            {isAnywhere && (
                              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Anywhere
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] font-mono truncate ${isAnywhere ? "text-emerald-600" : "text-slate-400"}`}>
                            {item.ip}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isAnywhere && (
                            <button
                              type="button"
                              onClick={() => startEdit(index)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeEntry(index)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                <><ShieldCheck size={14} /> Save Whitelist</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Ipwhitelistdialog;
