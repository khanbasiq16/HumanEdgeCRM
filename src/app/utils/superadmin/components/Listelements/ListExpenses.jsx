"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import ExpensesCatdailog from "../dialog/ExpensesCatdailog";
import ExpenseDialog from "../dialog/ExpenseDialog";
import Expensetable from "../Tables/ExpenseTable";
import { Receipt } from "lucide-react";

/* ── Stat chip ─────────────────────────────────────────── */
const StatChip = ({ label, value, colorClass }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${colorClass}`}>
    <span className="text-xl font-extrabold tabular-nums">{value}</span>
    <span className="font-medium opacity-80">{label}</span>
  </div>
);

const Listexpense = ({ bankaccounts, expenses, setExpenses }) => {
  const { user } = useSelector((state) => state.User);

  const [expenseCategory, setExpenseCategory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.accountId) return;
    setLoading(true);
    axios
      .get("/api/acounts/expenses/get-expense-category")
      .then((res) => {
        if (res.data?.success) setExpenseCategory(res.data.expensesCategories || []);
      })
      .catch((err) => console.error("Expense fetch error:", err))
      .finally(() => setLoading(false));
  }, [user?.accountId]);

  const total    = expenses.length;
  const fixed    = expenses.filter((e) => e.expensecategoryType?.toLowerCase() === "fixed").length;
  const variable = total - fixed;
  const totalAmt = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">

      {/* Stats — only when there are expenses */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatChip
            label="Total"
            value={total}
            colorClass="bg-slate-50 border-slate-200 text-slate-700"
          />
          <StatChip
            label="Fixed"
            value={fixed}
            colorClass="bg-violet-50 border-violet-200 text-violet-700"
          />
          <StatChip
            label="Variable"
            value={variable}
            colorClass="bg-amber-50 border-amber-200 text-amber-700"
          />
          <StatChip
            label={`Total: Rs ${totalAmt.toLocaleString()}`}
            value=""
            colorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
          />
        </div>
      )}

      {/* Toolbar — always visible */}
      <div className="flex items-center justify-end gap-2">
        <ExpensesCatdailog categories={expenseCategory} />
        <ExpenseDialog
          expensesCategories={expenseCategory}
          bankaccounts={bankaccounts}
          setExpenses={setExpenses}
        />
      </div>

      {loading ? (
        /* Skeleton */
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
              <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded w-36" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-20 hidden sm:block" />
              <div className="h-3 bg-slate-100 rounded w-16 hidden md:block" />
            </div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Receipt size={28} className="text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">No expenses yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first expense to get started</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <Expensetable expenses={expenses} expenseCategory={expenseCategory} />
        </div>
      )}
    </div>
  );
};

export default Listexpense;
