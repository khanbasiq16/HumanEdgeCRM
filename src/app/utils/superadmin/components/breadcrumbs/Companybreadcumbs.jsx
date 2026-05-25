"use client";
import React from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Clientdialog from "../dialog/Clientdialog";
import Invoicedialog from "../dialog/Invoicedialog";
import ContractDialog from "../dialog/ContractsDialog";

const Companybreadcumbs = ({ path }) => {
  const { id } = useParams();
  const companyName = id
    ? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-3.5 mb-5 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-slate-800">{path}</h2>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Home size={11} />
          <ChevronRight size={11} />
          <span>{companyName}</span>
          <ChevronRight size={11} />
          <span className="text-slate-600 font-medium">{path}</span>
        </div>
      </div>

      {path === "Clients" ? (
        <Clientdialog />
      ) : path === "Invoices" ? (
        <Invoicedialog />
      ) : path === "Contracts" ? (
        <ContractDialog />
      ) : null}
    </div>
  );
};

export default Companybreadcumbs;
