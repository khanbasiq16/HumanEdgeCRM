import React from "react";
import Companydailog from "../dialog/Companydailog";
import Employeedailog from "../dialog/Employeedailog";
import TemplateDialog from "../dialog/TemplateDialog";
import AccountDialog from "../dialog/Accountsdialog";
import BankDialog from "../dialog/BankDialog";
import ExpenseDialog from "../dialog/ExpenseDialog";
import { ChevronRight, Home } from "lucide-react";

const Superbreadcrumb = ({ path, path2, expensesCategories, bankaccounts, setExpenses }) => {
  const displayName = path.toLowerCase() === "banks" ? "Bank Accounts" : path;
  const displayName2 = path2 ? (path2.toLowerCase() === "banks" ? "Bank Accounts" : path2) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 px-6 py-4 mb-5 flex items-center justify-between gap-4">
      {/* Left — title + breadcrumb */}
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-base font-bold text-slate-900 leading-none">{displayName}</h1>
        <nav className="flex items-center gap-1 text-xs text-slate-400 flex-wrap">
          <Home size={11} className="shrink-0" />
          <ChevronRight size={10} className="shrink-0" />
          <span>Home</span>
          <ChevronRight size={10} className="shrink-0" />
          <span className={displayName2 ? "text-slate-500" : "text-blue-600 font-medium"}>
            {displayName}
          </span>
          {displayName2 && (
            <>
              <ChevronRight size={10} className="shrink-0" />
              <span className="text-blue-600 font-medium">{displayName2}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right — action button */}
      <div className="shrink-0">
        {path === "Companies"  ? <Companydailog /> :
         path === "Employees"  ? <Employeedailog /> :
         path === "Templates"  ? <TemplateDialog /> :
         path === "Accountants"? <AccountDialog /> :
         path === "Banks"      ? <BankDialog /> :
         path === "Expenses"   ? <ExpenseDialog expensesCategories={expensesCategories} bankaccounts={bankaccounts} setExpenses={setExpenses} /> :
         null}
      </div>
    </div>
  );
};

export default Superbreadcrumb;
