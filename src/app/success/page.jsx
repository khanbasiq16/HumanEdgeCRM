"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import {
  CheckCircle2, Receipt, Building2, CalendarDays,
  DollarSign, Hash, Lock,
} from "lucide-react";

const SuccessPage = () => {
  const searchParams = useSearchParams();
  const invoiceId    = searchParams.get("invoiceId");
  const amount       = searchParams.get("amount");

  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) { setLoading(false); return; }
    const load = async () => {
      try {
        const res = await axios.get(`/api/get-invoice/${invoiceId}`);
        const inv = res.data?.invoice;
        setInvoice(inv);
        if (inv?.companySlug) {
          const cr = await axios.get(`/api/get-company/${inv.companySlug}`);
          setCompany(cr.data?.company || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invoiceId]);

  const Sk = ({ className }) => (
    <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm p-8 space-y-4">
          <Sk className="w-12 h-12 rounded-full mx-auto" />
          <Sk className="h-5 w-40 mx-auto" />
          <Sk className="h-3.5 w-56 mx-auto" />
          <div className="pt-2 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Sk className="h-3.5 w-20" />
                <Sk className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const paidDate = invoice?.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">

        {/* Company logo */}
        {company?.companyLogo && (
          <div className="flex justify-center mb-1">
            <img src={company.companyLogo} alt={company.name} className="h-9 object-contain" />
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Top section */}
          <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-3 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" strokeWidth={1.8} />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-lg font-extrabold text-slate-900">Payment Confirmed</h1>
              <p className="text-sm text-slate-400">Your invoice has been paid successfully</p>
            </div>
            <div className="mt-1 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                ${Number(amount || invoice?.totalAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="px-6 py-2 divide-y divide-slate-50">
            {[
              { icon: Hash,         label: "Invoice",  value: invoice?.invoiceNumber },
              { icon: Building2,    label: "Company",  value: invoice?.companyName   },
              { icon: CalendarDays, label: "Date",     value: paidDate               },
              { icon: DollarSign,   label: "Amount",   value: `$${Number(amount || invoice?.totalAmount || 0).toLocaleString()}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Icon size={13} className="text-slate-400" />
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                </div>
                <p className="text-sm font-semibold text-slate-800">{value || "—"}</p>
              </div>
            ))}

            {/* Status row */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Receipt size={13} className="text-slate-400" />
                <p className="text-xs text-slate-400 font-medium">Status</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={10} /> Paid
              </span>
            </div>
          </div>

          {/* Bottom note */}
          <div className="px-6 pb-6 pt-2">
            <p className="text-center text-xs text-slate-400 leading-relaxed">
              A receipt has been sent to your email address.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock size={9} />
          Secured by Stripe · 256-bit SSL encryption
        </div>

      </div>
    </div>
  );
};

export default SuccessPage;
