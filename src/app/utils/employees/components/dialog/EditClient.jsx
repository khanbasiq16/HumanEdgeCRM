"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import {
  Pencil, Bold, Italic, Underline, List, ListOrdered,
} from "lucide-react";

/* ── Rich Text Editor ── */
const RichEditor = ({ value = "", onChange, placeholder = "" }) => {
  const editorRef   = useRef(null);
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

/* ── Edit Client Dialog ── */
const EditClient = ({ client, setClient }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  const capitalizedCompanyName = id
    ? id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "";

  const [formData, setFormData] = useState({
    clientName:      client?.clientName      || "",
    clientAddress:   client?.clientAddress   || "",
    clientEmail:     client?.clientEmail     || "",
    clientPhone:     client?.clientPhone     || "",
    projectsDetails: client?.projectsDetails || "",
    packageDetails:  client?.packageDetails  || "",
    clientWebsite:   client?.clientWebsite   || "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const formHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`/api/update-client/${client?.id}`, {
        companyName: id,
        ...formData,
      });
      const data = res.data;
      if (data.success) {
        toast.success("Client updated successfully");
        setClient(data.client);
        setOpen(false);
      } else {
        toast.error(data.error || "Failed to update client");
      }
    } catch {
      toast.error("Error updating client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 rounded-lg px-4 h-9 text-sm transition-colors">
          <Pencil size={13} /> Edit Client
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-145 p-0 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Edit Client
          </DialogTitle>
          {capitalizedCompanyName && (
            <p className="text-sm text-slate-400 mt-0.5">{capitalizedCompanyName}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={formHandler}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">

            <div className="grid grid-cols-2 gap-3">
              <Field label="Client Name" required>
                <Input
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </Field>
              <Field label="Email" required>
                <Input
                  name="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <Input
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                />
              </Field>
              <Field label="Website">
                <Input
                  name="clientWebsite"
                  value={formData.clientWebsite}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </Field>
            </div>

            <Field label="Address">
              <Input
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleChange}
                placeholder="Street, City, Country"
              />
            </Field>

            <div className="border-t border-slate-100 pt-1" />

            <Field label="Projects">
              <RichEditor
                value={formData.projectsDetails}
                onChange={(html) => setFormData(p => ({ ...p, projectsDetails: html }))}
                placeholder="Project details, scope, timelines…"
              />
            </Field>

            <Field label="Package">
              <RichEditor
                value={formData.packageDetails}
                onChange={(html) => setFormData(p => ({ ...p, packageDetails: html }))}
                placeholder="Package, pricing, deliverables…"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 transition-colors"
            >
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export default EditClient;
