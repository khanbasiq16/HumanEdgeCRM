"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import toast from "react-hot-toast";
import { Pencil, Loader2, Users, Mail, Phone, MapPin, CreditCard, DollarSign, Clock, Calendar, Briefcase, Target } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createemployees } from "@/features/Slice/EmployeeSlice";

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

/* ── Section header ─────────────────────────────────────── */
const Section = ({ title, subtitle }) => (
  <div className="col-span-2 pt-2 pb-1 border-b border-slate-100">
    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</p>
    {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
  </div>
);

/* ── Main component ─────────────────────────────────────── */
const EditEmployeeDialog = ({ employee, setemployee }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "", employeeAddress: "", employeeemail: "",
    employeePhone: "", employeeCNIC: "", employeeSalary: "",
    department: "", totalWorkingHours: "", dateOfJoining: "", salesTarget: "",
  });

  const dispatch = useDispatch();
  const { department } = useSelector((s) => s.Department);

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeName:      employee.employeeName      || "",
        employeeAddress:   employee.employeeAddress   || "",
        employeeemail:     employee.employeeemail     || "",
        employeePhone:     employee.employeePhone     || "",
        employeeCNIC:      employee.employeeCNIC      || "",
        employeeSalary:    employee.employeeSalary    || "",
        department:        employee.department        || "",
        totalWorkingHours: employee.totalWorkingHours || "",
        dateOfJoining:     employee.dateOfJoining ? employee.dateOfJoining.split("T")[0] : "",
        salesTarget:       employee.salesTarget       || "",
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleDepartmentChange = (value) => setFormData((p) => ({ ...p, department: value }));

  const formHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`/api/update-employee/${employee?.employeeId}`, formData);
      if (res.data.success) {
        toast.success("Employee updated successfully");
        setemployee(res.data.employee);
        setOpen(false);
      } else {
        toast.error(res.data.error || "Failed to update employee");
      }
    } catch {
      toast.error("Error updating employee");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-9 text-sm bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-blue-500 focus-visible:ring-1 placeholder:text-slate-400";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          <Pencil size={14} />
          Edit
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Pencil size={16} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-none">
                Edit Employee
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">Update details for {employee?.employeeName || "employee"}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={formHandler}>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Personal Information ───────────────────── */}
              <Section title="Personal Information" subtitle="Employee identity and contact details" />

              <Field label="Full Name" required icon={Users}>
                <Input className={inputCls} name="employeeName" value={formData.employeeName} onChange={handleChange} required />
              </Field>

              <Field label="Email Address" required icon={Mail}>
                <Input className={inputCls} name="employeeemail" type="email" value={formData.employeeemail} onChange={handleChange} required />
              </Field>

              <Field label="Phone Number" icon={Phone}>
                <Input className={inputCls} name="employeePhone" value={formData.employeePhone} onChange={handleChange} />
              </Field>

              <Field label="CNIC Number" required icon={CreditCard}>
                <Input className={inputCls} name="employeeCNIC" value={formData.employeeCNIC} onChange={handleChange} required />
              </Field>

              <div className="md:col-span-2">
                <Field label="Address" icon={MapPin}>
                  <Input className={inputCls} name="employeeAddress" value={formData.employeeAddress} onChange={handleChange} />
                </Field>
              </div>

              {/* ── Work Details ───────────────────────────── */}
              <Section title="Work Details" subtitle="Employment and role information" />

              <Field label="Department" required icon={Briefcase}>
                <Select onValueChange={handleDepartmentChange} value={formData.department}>
                  <SelectTrigger className={`${inputCls} w-full`}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {department?.length > 0 ? (
                      department.map((dep) => (
                        <SelectItem key={dep._id || dep.id} value={dep.departmentName}>
                          {dep.departmentName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No departments available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>

              {formData.department === "Sales" && (
                <Field label="Sales Target" icon={Target}>
                  <Input className={inputCls} name="salesTarget" type="number" value={formData.salesTarget} onChange={handleChange} />
                </Field>
              )}

              <Field label="Salary (PKR)" required icon={DollarSign}>
                <Input className={inputCls} name="employeeSalary" value={formData.employeeSalary} onChange={handleChange} required />
              </Field>

              <Field label="Working Hours / Day" icon={Clock}>
                <Input className={inputCls} name="totalWorkingHours" value={formData.totalWorkingHours} onChange={handleChange} />
              </Field>

              <Field label="Date of Joining" icon={Calendar}>
                <Input className={inputCls} name="dateOfJoining" type="date" value={formData.dateOfJoining} onChange={handleChange} />
              </Field>

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
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Updating…</>
              ) : (
                <><Pencil size={14} /> Update Employee</>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;
