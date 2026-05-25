"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createemployees } from "@/features/Slice/EmployeeSlice";

const AttendanceImportDialog = ({ selectedEmployee }) => {
  const [open, setOpen]                 = useState(false);
  const [file, setFile]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [done, setDone]                 = useState(false);

  const dispatch = useDispatch();
  const { employees } = useSelector((s) => s.Employee);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDone(false);
    setUploadProgress(0);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an Excel file");
    setLoading(true);
    setUploadProgress(0);
    setDone(false);

    try {
      const filteredEmployee = employees.find((emp) => emp.employeeName === selectedEmployee);
      const resIp = await fetch("https://api.ipify.org?format=json");
      const { ip: clientIp } = await resIp.json();

      const formData = new FormData();
      formData.append("file",       file);
      formData.append("employeeId", filteredEmployee?.id);
      formData.append("clientIp",   clientIp);

      const response = await axios.post("/api/attendance/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });

      if (response.data.success) {
        setDone(true);
        dispatch(createemployees(response.data.allEmployees));
        toast.success("Attendance imported successfully!");
        setTimeout(() => {
          setOpen(false);
          setFile(null);
          setDone(false);
          setUploadProgress(0);
        }, 1200);
      } else {
        throw new Error(response.data.error || "Import failed");
      }
    } catch (err) {
      toast.error(err.message || "Error importing file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setFile(null); setDone(false); setUploadProgress(0); } }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Upload size={13} />
          Import Attendance
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={18} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Import Attendance
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Upload an Excel file (.xls, .xlsx)</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleImport}>
          <div className="px-6 py-5 space-y-5">

            {/* File upload area */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Excel File</Label>
              <label
                htmlFor="att-file-upload"
                className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors group"
              >
                <FileSpreadsheet size={18} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600 truncate">
                    {file ? file.name : "Click to select Excel file"}
                  </p>
                  <p className="text-xs text-slate-400">.xls, .xlsx supported</p>
                </div>
                <input
                  id="att-file-upload"
                  type="file"
                  accept=".xls,.xlsx"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Done state */}
            {done && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <CheckCircle2 size={16} />
                Import completed successfully!
              </div>
            )}

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
              disabled={loading || !file}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> {uploadProgress}%</>
              ) : (
                <><Upload size={14} /> Upload File</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceImportDialog;
