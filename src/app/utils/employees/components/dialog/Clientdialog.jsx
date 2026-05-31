"use client";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { getallclients } from "@/features/Slice/ClientSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  X, Loader2, Plus, User, Mail, Phone, MapPin,
  Globe, Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";

/* ── Inline Rich Text Editor ── */
const RichEditor = ({ label, name, placeholder }) => {
  const editorRef = useRef(null);
  const hiddenRef = useRef(null);
  const [formats, setFormats] = useState({});

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
      left:      document.queryCommandState("justifyLeft"),
      center:    document.queryCommandState("justifyCenter"),
      right:     document.queryCommandState("justifyRight"),
    });
  };

  /* sync innerText to a hidden input so FormData picks it up */
  const handleInput = () => {
    syncFormats();
    if (hiddenRef.current) {
      hiddenRef.current.value = editorRef.current?.innerText ?? "";
    }
  };

  const Btn = ({ cmd, icon: Icon, active }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); exec(cmd); }}
      className={`p-1 rounded-md transition-all ${
        active ? "bg-blue-600 text-white" : "hover:bg-slate-200 text-slate-500"
      }`}
    >
      <Icon size={12}/>
    </button>
  );

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-t-xl border-b-0">
        <Btn cmd="bold"                icon={Bold}         active={formats.bold}/>
        <Btn cmd="italic"              icon={Italic}       active={formats.italic}/>
        <Btn cmd="underline"           icon={Underline}    active={formats.underline}/>
        <div className="w-px h-3.5 bg-slate-300 mx-1"/>
        <Btn cmd="insertUnorderedList" icon={List}         active={formats.ul}/>
        <Btn cmd="insertOrderedList"   icon={ListOrdered}  active={formats.ol}/>
        <div className="w-px h-3.5 bg-slate-300 mx-1"/>
        <Btn cmd="justifyLeft"         icon={AlignLeft}    active={formats.left}/>
        <Btn cmd="justifyCenter"       icon={AlignCenter}  active={formats.center}/>
        <Btn cmd="justifyRight"        icon={AlignRight}   active={formats.right}/>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={syncFormats}
        onMouseUp={syncFormats}
        data-placeholder={placeholder}
        className="min-h-[90px] max-h-[140px] overflow-y-auto w-full border border-slate-200 rounded-b-xl px-3 py-2.5 outline-none focus:border-blue-400 text-sm text-slate-700 bg-white [&::-webkit-scrollbar]:hidden"
        style={{ lineHeight: 1.6 }}
      />

      {/* Hidden input for FormData */}
      <input ref={hiddenRef} type="hidden" name={name} defaultValue=""/>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1;
          pointer-events: none;
          font-size: 13px;
        }
        [contenteditable] ul { padding-left: 1.2em; list-style: disc; }
        [contenteditable] ol { padding-left: 1.2em; list-style: decimal; }
        [contenteditable] li { margin: 2px 0; }
      `}</style>
    </div>
  );
};

/* ── Main Dialog ── */
const Clientdialog = () => {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { user }   = useSelector((state) => state.User);
  const dispatch   = useDispatch();
  const { id }     = useParams();

  const companyLabel = id
    ? id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    : "";

  /* close on Escape */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.target);
      const body = {
        companyName:     id,
        clientName:      fd.get("clientName")      || "",
        clientEmail:     fd.get("clientEmail")     || "",
        clientPhone:     fd.get("clientPhone")     || "",
        clientAddress:   fd.get("clientAddress")   || "",
        clientWebsite:   fd.get("clientWebsite")   || "",
        projectsDetails: fd.get("projectsDetails") || "",
        packageDetails:  fd.get("packageDetails")  || "",
        employeeid:      user?.employeeId || user?.id,
      };

      if (!body.clientName || !body.clientEmail || !body.clientPhone) {
        toast.error("Name, email, and phone are required");
        return;
      }

      const res = await axios.post("/api/employee/create-client", body);
      if (res.data.success) {
        toast.success("Client created successfully");
        dispatch(getallclients(res.data?.allclients || []));
        e.target.reset();
        setOpen(false);
      } else {
        toast.error(res.data.error || "Failed to create client");
      }
    } catch {
      toast.error("Error creating client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200"
      >
        <Plus size={15}/> Create Client
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
               style={{ maxHeight: "90vh" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User size={16} className="text-blue-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Create New Client</h2>
                  {companyLabel && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Company: <span className="font-semibold text-slate-600">{companyLabel}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={16}/>
              </button>
            </div>

            {/* ── Scrollable body (no scrollbar) ── */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div className="p-6 space-y-5">

                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Client Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Client Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input
                        name="clientName" type="text" placeholder="Enter client name" required
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input
                        name="clientEmail" type="email" placeholder="Enter email address" required
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-300 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Phone + Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input
                        name="clientPhone" type="text" placeholder="Enter phone number" required
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Address</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input
                        name="clientAddress" type="text" placeholder="Enter address"
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-300 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Website */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Website</label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input
                      name="clientWebsite" type="text" placeholder="https://example.com"
                      className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder:text-slate-300 transition-all"
                    />
                  </div>
                </div>

                {/* Rich editors */}
                <RichEditor
                  label="Project Details"
                  name="projectsDetails"
                  placeholder="Describe project details, scope, timelines…"
                />
                <RichEditor
                  label="Package Details"
                  name="packageDetails"
                  placeholder="Describe package, pricing, deliverables…"
                />
              </div>

              {/* ── Footer ── */}
              <div className="px-6 pb-6 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button" onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin"/> Saving…</>
                    : <><Plus size={14}/> Save Client</>}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
};

export default Clientdialog;
