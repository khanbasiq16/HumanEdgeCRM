"use client";

import React, { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink,
} from "@react-pdf/renderer";
import {
  Calculator, User, TrendingUp, FileDown, Loader2,
  Banknote, Receipt, CircleDollarSign, ChevronRight,
} from "lucide-react";

/* ── Tax calculation ────────────────────────────────────── */
const calculateTax = (basicSalary) => {
  const annualSalary = basicSalary * 12;
  let annualTax = 0;

  if      (annualSalary <= 600000)  annualTax = 0;
  else if (annualSalary <= 1200000) annualTax = (annualSalary - 600000) * 0.01;
  else if (annualSalary <= 2200000) annualTax = 6000  + (annualSalary - 1200000) * 0.11;
  else if (annualSalary <= 3200000) annualTax = 116000 + (annualSalary - 2200000) * 0.23;
  else if (annualSalary <= 4100000) annualTax = 346000 + (annualSalary - 3200000) * 0.30;
  else                              annualTax = 616000 + (annualSalary - 4100000) * 0.35;

  return { monthlyTax: annualTax / 12, annualTax };
};

const formatPKR = (v) => `PKR ${Number(v).toLocaleString("en-PK")}`;

/* ── PDF styles ─────────────────────────────────────────── */
const pdfStyles = StyleSheet.create({
  page:      { fontFamily: "Helvetica", padding: 30, fontSize: 12, backgroundColor: "#f7f7f7" },
  header:    { textAlign: "center", marginBottom: 20 },
  logo:      { width: 80, height: 80, marginBottom: 10 },
  title:     { fontSize: 18, fontWeight: "bold" },
  subtitle:  { fontSize: 12, marginBottom: 10 },
  section:   { marginVertical: 10, padding: 10, backgroundColor: "#fff", borderRadius: 8 },
  row:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label:     { fontWeight: "bold" },
  net:       { color: "green", fontWeight: "bold" },
  footer:    { textAlign: "center", marginTop: 20, fontSize: 10, color: "#555" },
});

/* ── PDF Document ───────────────────────────────────────── */
const SalarySlipDocument = ({ employee, salary, monthlyTax }) => {
  const netSalary  = salary - monthlyTax;
  const { annualTax } = calculateTax(salary);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Image style={pdfStyles.logo} src="https://brintor.com/assets/img/logo-icon.png" />
          <Text style={pdfStyles.title}>Brintor Pvt Ltd</Text>
          <Text style={pdfStyles.subtitle}>Employee Payslip</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={{ marginBottom: 5, fontWeight: "bold" }}>Employee Info</Text>
          <View style={pdfStyles.row}><Text>Name:</Text><Text>{employee.employeeName}</Text></View>
          <View style={pdfStyles.row}><Text>Designation:</Text><Text>{employee.designation || "Employee"}</Text></View>
          <View style={pdfStyles.row}>
            <Text>Pay Month:</Text>
            <Text>{new Date().toLocaleString("en-PK", { month: "long", year: "numeric" })}</Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={{ marginBottom: 5, fontWeight: "bold" }}>Salary Details</Text>
          <View style={pdfStyles.row}><Text>Gross Salary:</Text><Text>{formatPKR(salary)}</Text></View>
          <View style={pdfStyles.row}><Text>Tax:</Text><Text>{formatPKR(monthlyTax.toFixed(2))}</Text></View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.net}>Net Salary:</Text>
            <Text style={pdfStyles.net}>{formatPKR(netSalary)}</Text>
          </View>
        </View>

        <Text style={pdfStyles.footer}>This is a system generated payslip. No signature required.</Text>
      </Page>
    </Document>
  );
};

/* ── Summary card ───────────────────────────────────────── */
const SummaryCard = ({ icon: Icon, label, value, accent, highlight }) => (
  <div className={`rounded-xl border p-4 flex items-center gap-3 ${accent}`}>
    <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold opacity-70 uppercase tracking-wider">{label}</p>
      <p className={`text-base font-extrabold tabular-nums mt-0.5 ${highlight || ""}`}>{value}</p>
    </div>
  </div>
);

/* ── Main component ─────────────────────────────────────── */
const Listtaxes = ({ employees = [] }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const salary               = selectedEmployee?.employeeSalary || 0;
  const { monthlyTax, annualTax } = calculateTax(salary);

  return (
    <div className="space-y-5">
      {/* Employee selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Select Employee</p>
            <p className="text-xs text-slate-400">Choose an employee to calculate their tax</p>
          </div>
        </div>
        <Select
          onValueChange={(id) => setSelectedEmployee(employees.find((e) => e.id === id))}
        >
          <SelectTrigger className="h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500">
            <SelectValue placeholder="Select an employee…" />
          </SelectTrigger>
          <SelectContent>
            {employees.length === 0 ? (
              <SelectItem value="none" disabled>No employees found</SelectItem>
            ) : (
              employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.employeeName} — PKR {emp.employeeSalary?.toLocaleString()}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {selectedEmployee ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Monthly */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Banknote size={16} className="text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Monthly Summary</p>
            </div>
            <div className="p-5 space-y-3">
              <SummaryCard
                icon={CircleDollarSign}
                label="Gross Salary"
                value={formatPKR(salary)}
                accent="bg-slate-50 border-slate-200 text-slate-700"
              />
              <SummaryCard
                icon={Receipt}
                label="Tax Deduction"
                value={formatPKR(monthlyTax.toFixed(2))}
                accent="bg-red-50 border-red-200 text-red-700"
              />
              <SummaryCard
                icon={TrendingUp}
                label="Net Salary"
                value={formatPKR(salary - monthlyTax)}
                accent="bg-emerald-50 border-emerald-200 text-emerald-700"
                highlight="text-emerald-700"
              />

              <PDFDownloadLink
                document={
                  <SalarySlipDocument
                    employee={selectedEmployee}
                    salary={salary}
                    monthlyTax={monthlyTax}
                  />
                }
                fileName={`${selectedEmployee.employeeName}-payslip.pdf`}
              >
                {({ loading }) => (
                  <button
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
                    disabled={loading}
                  >
                    {loading
                      ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                      : <><FileDown size={14} /> Download Payslip PDF</>
                    }
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>

          {/* Annual */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Calculator size={16} className="text-violet-600" />
              <p className="text-sm font-bold text-slate-800">Annual Summary</p>
            </div>
            <div className="p-5 space-y-3">
              <SummaryCard
                icon={CircleDollarSign}
                label="Gross Income"
                value={formatPKR(salary * 12)}
                accent="bg-slate-50 border-slate-200 text-slate-700"
              />
              <SummaryCard
                icon={Receipt}
                label="Annual Tax"
                value={formatPKR(annualTax.toFixed(2))}
                accent="bg-red-50 border-red-200 text-red-700"
              />
              <SummaryCard
                icon={TrendingUp}
                label="Net Income"
                value={formatPKR(salary * 12 - annualTax)}
                accent="bg-emerald-50 border-emerald-200 text-emerald-700"
                highlight="text-emerald-700"
              />

              {/* Tax bracket info */}
              <div className="mt-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1">Effective Rate</p>
                <p className="text-lg font-extrabold text-violet-700 tabular-nums">
                  {salary > 0 ? ((annualTax / (salary * 12)) * 100).toFixed(2) : "0.00"}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Calculator size={28} className="text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">No employee selected</p>
            <p className="text-xs text-slate-400 mt-1">Select an employee above to view their tax calculation</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Listtaxes;
