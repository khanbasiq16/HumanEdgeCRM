"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { getallinvoice } from "@/features/Slice/InvoiceSlice";
import { FileText, Loader2 } from "lucide-react";
import InvoiceTable from "../Tables/InvoiceTable";
import Invoicedialog from "../dialog/Invoicedialog";

const Listinvoices = () => {
  const [loading, setLoading] = useState(true);
  const dispatch  = useDispatch();
  const { invoices } = useSelector((s) => s.Invoice);
  const { user }     = useSelector((s) => s.User);
  const { id, slug } = useParams();

  useEffect(() => {
    if (!id || !user?.employeeId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/get-invoices/${id}/${user.employeeId}`);
        dispatch(getallinvoice(res.data?.invoices || []));
      } catch {
        dispatch(getallinvoice([]));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user?.employeeId]);

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Invoices</h1>
          {!loading && (
            <p className="text-sm text-slate-400 mt-0.5">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} for this company
            </p>
          )}
        </div>
        <Invoicedialog />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={24} className="animate-spin text-blue-400" />
            <p className="text-xs text-slate-400">Loading invoices…</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FileText size={22} className="text-blue-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No invoices yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Click <span className="font-medium text-slate-500">"Generate New Invoice"</span> to create one
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <InvoiceTable invoices={invoices} slug={id} companyslug={slug} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Listinvoices;
