"use client";

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, Users, Building2, CalendarDays, DollarSign,
  FileText, Settings, ShieldCheck, CheckSquare, Square, Save,
  ClipboardList, Megaphone, Receipt, UserCog,
} from "lucide-react";

const MODULES = [
  { id: "employees",     label: "Employees & Departments", desc: "Employees, departments, HR management",      icon: Users        },
  { id: "companies",     label: "Companies",               desc: "Create and manage company profiles",         icon: Building2    },
  { id: "attendance",    label: "Attendance",              desc: "View and manage attendance records",         icon: CalendarDays },
  { id: "accounts",      label: "Accounts & Finance",      desc: "Accounts, banks, taxes and expenses",        icon: DollarSign   },
  { id: "invoice",       label: "Invoices",                desc: "Access and manage company invoices",         icon: Receipt      },
  { id: "tasks",         label: "Tasks & Projects",        desc: "View and manage tasks and projects",         icon: ClipboardList},
  { id: "announcements", label: "Announcements",           desc: "Create and broadcast announcements",         icon: Megaphone    },
  { id: "members",       label: "Admin Members",           desc: "Invite and manage admin team members",       icon: UserCog      },
  { id: "templates",     label: "Templates",               desc: "Create and assign letter templates",         icon: FileText     },
  { id: "settings",      label: "Settings Page Only",      desc: "IP whitelist, toggles, configuration",      icon: Settings     },
];

const EditInvitationdialog = ({ open, setOpen, invitation, onUpdated, endpoint = "/api/admin/invite/edit", idField = "id" }) => {
  const [selected, setSelected] = useState(invitation?.permissions || []);
  const [loading, setLoading]   = useState(false);

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelected(selected.length === MODULES.length ? [] : MODULES.map((m) => m.id));

  const handleSave = async () => {
    if (!selected.length) { toast.error("Select at least one permission"); return; }
    setLoading(true);
    try {
      await axios.patch(endpoint, { [idField]: invitation[idField], permissions: selected });
      toast.success("Permissions updated");
      onUpdated(invitation[idField], selected);
      setOpen(false);
    } catch {
      toast.error("Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 rounded-2xl overflow-hidden">

        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Edit Permissions
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-72">
                {invitation?.email}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-2 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Permissions</p>
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              {selected.length === MODULES.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          {MODULES.map((mod) => {
            const Icon      = mod.icon;
            const isChecked = selected.includes(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => toggle(mod.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  isChecked ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isChecked ? "bg-blue-600" : "bg-white border border-slate-200"
                }`}>
                  <Icon size={14} className={isChecked ? "text-white" : "text-slate-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isChecked ? "text-blue-800" : "text-slate-700"}`}>{mod.label}</p>
                  <p className={`text-xs mt-0.5 ${isChecked ? "text-blue-500" : "text-slate-400"}`}>{mod.desc}</p>
                </div>
                {isChecked ? <CheckSquare size={16} className="text-blue-600 shrink-0" /> : <Square size={16} className="text-slate-300 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400 font-medium">
            {selected.length} permission{selected.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save</>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvitationdialog;
