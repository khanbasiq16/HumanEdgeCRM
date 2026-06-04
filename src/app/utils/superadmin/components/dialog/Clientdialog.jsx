"use client";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { getallclients } from "@/features/Slice/ClientSlice";
import { useDispatch } from "react-redux";
import {
  Users, Loader2, Plus, Globe, Mail, Phone, MapPin, Briefcase, Package,
  Bold, Italic, Underline, List, ListOrdered,
} from "lucide-react";

/* ── Rich Text Editor ── */
const RichEditor = ({ value = "", onChange, placeholder = "" }) => {
  const editorRef  = useRef(null);
  const initialized = useRef(false);
  const [formats, setFormats] = useState({});

  useEffect(() => {
    if (!initialized.current && editorRef.current) {
      editorRef.current.innerHTML = value || "";
      initialized.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
    syncFormats();
  };

  const syncFormats = () => {
    setFormats({
      bold:      document.queryCommandState("bold"),
      italic:    document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul:        document.queryCommandState("insertUnorderedList"),
      ol:        document.queryCommandState("insertOrderedList"),
    });
  };

  const handleInput = () => {
    syncFormats();
    onChange?.(editorRef.current?.innerHTML ?? "");
  };

  const Btn = ({ cmd, icon: Icon, active }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); exec(cmd); }}
      className={`p-1.5 rounded transition-all ${active ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-500"}`}
    >
      <Icon size={13} />
    </button>
  );

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        <Btn cmd="bold"                icon={Bold}        active={formats.bold} />
        <Btn cmd="italic"              icon={Italic}      active={formats.italic} />
        <Btn cmd="underline"           icon={Underline}   active={formats.underline} />
        <div className="w-px h-3.5 bg-slate-200 mx-1" />
        <Btn cmd="insertUnorderedList" icon={List}        active={formats.ul} />
        <Btn cmd="insertOrderedList"   icon={ListOrdered} active={formats.ol} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={syncFormats}
        onMouseUp={syncFormats}
        data-placeholder={placeholder}
        className="min-h-25 max-h-37.5 overflow-y-auto px-3 py-2.5 outline-none text-sm text-slate-700 bg-white [&::-webkit-scrollbar]:hidden"
        style={{ lineHeight: 1.6 }}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before { content:attr(data-placeholder); color:#cbd5e1; pointer-events:none; font-size:13px; }
        [contenteditable] ul { padding-left:1.2em; list-style:disc; }
        [contenteditable] ol { padding-left:1.2em; list-style:decimal; }
        [contenteditable] li { margin:2px 0; }
      `}</style>
    </div>
  );
};

/* ── Field wrapper ── */
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

const Clientdialog = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [projectsDetails, setProjectsDetails] = useState("");
  const [packageDetails,  setPackageDetails]  = useState("");
  const dispatch = useDispatch();
  const { id } = useParams();

  const capitalizedCompanyName = id
    ? id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "";

  const handleClose = () => {
    setOpen(false);
    setProjectsDetails("");
    setPackageDetails("");
  };

  const formHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.target);
      const body = {
        companyName:     id,
        clientName:      fd.get("clientName"),
        clientAddress:   fd.get("clientAddress"),
        clientEmail:     fd.get("clientEmail"),
        clientPhone:     fd.get("clientPhone"),
        clientWebsite:   fd.get("clientWebsite"),
        projectsDetails,
        packageDetails,
      };

      const res = await axios.post("/api/create-client", body, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Client Created Successfully");
        e.target.reset();
        dispatch(getallclients(res.data?.allclients));
        handleClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200">
          <Plus size={13} />
          Create Client
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-150 p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Users size={17} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Create New Client
              </DialogTitle>
              {capitalizedCompanyName && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Company: <span className="font-semibold text-slate-600">{capitalizedCompanyName}</span>
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formHandler}>
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <Section title="Contact Info" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client Name" required icon={Users}>
                <Input name="clientName" placeholder="Full name" required className={inputCls} />
              </Field>
              <Field label="Email" required icon={Mail}>
                <Input name="clientEmail" type="email" placeholder="client@email.com" required className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" required icon={Phone}>
                <Input name="clientPhone" placeholder="+1 234 567 8900" required className={inputCls} />
              </Field>
              <Field label="Website" icon={Globe}>
                <Input name="clientWebsite" placeholder="https://example.com" className={inputCls} />
              </Field>
            </div>

            <Field label="Address" required icon={MapPin}>
              <Input name="clientAddress" placeholder="Street, City, Country" required className={inputCls} />
            </Field>

            <Section title="Project Details" />

            <Field label="Projects Details" icon={Briefcase}>
              <RichEditor
                value={projectsDetails}
                onChange={setProjectsDetails}
                placeholder="Describe project details, scope, timelines…"
              />
            </Field>

            <Field label="Package Details" icon={Package}>
              <RichEditor
                value={packageDetails}
                onChange={setPackageDetails}
                placeholder="Describe package, pricing, deliverables…"
              />
            </Field>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
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
                <><Users size={14} /> Save Client</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Clientdialog;
