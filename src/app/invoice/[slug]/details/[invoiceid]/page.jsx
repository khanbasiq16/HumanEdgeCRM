"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Receipt, Building2, User, Mail, Phone, MapPin, Globe,
  CalendarDays, DollarSign, ShieldCheck, Lock, CheckCircle2,
  ExternalLink, Hash, Loader2, FileText, Package,
} from "lucide-react";


const CARD_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1e293b",
      fontFamily: "inherit",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#ef4444" },
  },
};

/* ── Info row ── */
const InfoRow = ({ icon: Icon, label, value, link = false }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={13} className="text-slate-400" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      {link && value ? (
        <a href={value} target="_blank" rel="noreferrer"
          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
          {value.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "")}
          <ExternalLink size={9} />
        </a>
      ) : (
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">{value || "—"}</p>
      )}
    </div>
  </div>
);

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const s = {
    Paid:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    Sent:  "bg-blue-50    text-blue-700    border-blue-200",
    Draft: "bg-amber-50   text-amber-700   border-amber-200",
  };
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${s[status] || s.Draft}`}>
      {status}
    </span>
  );
};

/* ── Payment form ── */
const CheckoutForm = ({ clientSecret, amount, invoiceid }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setErrorMsg("");

    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardNumberElement) },
    });

    if (error) {
      setErrorMsg(error.message || "Payment failed");
      toast.error(error.message || "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await axios.post("/api/confirm-payment", {
        invoiceId: invoiceid,
        status: "Paid",
      });
      if (res.data.success) {
        setSuccess(true);
        toast.success("Payment successful!");
        setTimeout(() => router.push(`/success?invoiceId=${invoiceid}&amount=${amount}`), 1200);
      } else {
        toast.error(res.data.message || "Failed to update invoice");
      }
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <p className="text-lg font-extrabold text-slate-900">Payment Successful!</p>
        <p className="text-sm text-slate-400">Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card Number */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          Card Number
        </label>
        <div className="h-11 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <CardNumberElement options={CARD_STYLE} className="flex-1" />
        </div>
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Expiry Date</label>
          <div className="h-11 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <CardExpiryElement options={CARD_STYLE} className="flex-1" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">CVC</label>
          <div className="h-11 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <CardCvcElement options={CARD_STYLE} className="flex-1" />
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-sm shadow-blue-200 text-sm"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Processing…</>
        ) : (
          <><ShieldCheck size={15} /> Pay ${Number(amount).toLocaleString()}</>
        )}
      </button>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Lock size={10} />
        Secured by Stripe · 256-bit SSL encryption
      </div>
    </form>
  );
};

/* ── Main page ── */
const Page = () => {
  const { invoiceid, slug } = useParams();

  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret,  setClientSecret]  = useState(null);
  const [invoice,       setInvoice]       = useState(null);
  const [client,        setClient]        = useState(null);
  const [company,       setCompany]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    if (!invoiceid) { setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const [invoiceRes, compRes, stripeRes] = await Promise.all([
          axios.get(`/api/get-invoice/${invoiceid}`),
          axios.get(`/api/get-company/${slug}`),
          axios.get("/api/stripe-config"),
        ]);

        if (!invoiceRes.data?.success) throw new Error("Invoice not found");
        if (!stripeRes.data?.success)  throw new Error("Stripe not configured");

        // Initialize Stripe with key from server
        setStripePromise(loadStripe(stripeRes.data.publishableKey));

        const inv = invoiceRes.data.invoice;
        setInvoice(inv);
        setCompany(compRes.data?.company || null);

        const clientRes = await axios.get(`/api/get-client/${inv.clientId}`);
        if (clientRes.data?.success) setClient(clientRes.data.client);

        const intentRes = await axios.post("/api/create-payment-intent", {
          invoiceId: invoiceid,
          amount:    inv.totalAmount,
        });
        setClientSecret(intentRes.data.clientSecret);
      } catch (err) {
        console.error(err);
        setError("Could not load payment details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [invoiceid]);

  /* ── Skeleton loader ── */
  if (loading) {
    const Sk = ({ className }) => (
      <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
    );
    return (
      <div className="min-h-screen bg-slate-50">
        {/* top bar skeleton */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <Sk className="h-9 w-32" />
          <Sk className="h-6 w-16 rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* left col */}
          <div className="space-y-4">
            {/* invoice header card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 space-y-4">
              <div className="flex items-start gap-4">
                <Sk className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Sk className="h-6 w-40" />
                  <div className="flex gap-2">
                    <Sk className="h-5 w-24 rounded-full" />
                    <Sk className="h-5 w-28 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Sk className="h-4 w-20" />
                <Sk className="h-8 w-24" />
              </div>
            </div>

            {/* bill to card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sk className="w-6 h-6 rounded-lg" />
                <Sk className="h-4 w-16" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-1">
                  <Sk className="w-7 h-7 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="h-2.5 w-14" />
                    <Sk className={`h-4 ${i === 0 ? "w-32" : i === 1 ? "w-44" : "w-36"}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* invoice details card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sk className="w-6 h-6 rounded-lg" />
                <Sk className="h-4 w-24" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-1">
                  <Sk className="w-7 h-7 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="h-2.5 w-16" />
                    <Sk className={`h-4 ${i === 1 ? "w-20" : "w-28"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right col — payment form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-7 space-y-6">
            {/* header */}
            <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
              <Sk className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Sk className="h-4 w-32" />
                <Sk className="h-3 w-44" />
              </div>
            </div>
            {/* card number */}
            <div className="space-y-2">
              <Sk className="h-3 w-20" />
              <Sk className="h-11 w-full rounded-xl" />
            </div>
            {/* expiry + cvc */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Sk className="h-3 w-20" />
                <Sk className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Sk className="h-3 w-10" />
                <Sk className="h-11 rounded-xl" />
              </div>
            </div>
            {/* pay button */}
            <Sk className="h-12 w-full rounded-xl" />
            {/* security note */}
            <Sk className="h-3 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !clientSecret || !stripePromise) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Receipt size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-slate-800">Failed to Load Invoice</p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {error || "Payment initialization failed. Please check the invoice link or contact support."}
          </p>
        </div>
      </div>
    );
  }

  /* ── Draft = not accessible ── */
  if (invoice?.status === "Draft") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-md">
          {company?.companyLogo && (
            <img src={company.companyLogo} alt={company?.name} className="h-14 object-contain mx-auto mb-6" />
          )}
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Receipt size={22} className="text-amber-500" />
          </div>
          <p className="text-base font-extrabold text-slate-900">Invoice Not Ready</p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            This invoice is still in <span className="font-bold text-amber-600">Draft</span> status and is not yet available for payment. Please contact the company for more details.
          </p>
        </div>
      </div>
    );
  }

  const options = { clientSecret, appearance: { theme: "stripe" } };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        {company?.companyLogo ? (
          <img src={company.companyLogo} alt={company.name} className="h-12 w-auto object-contain max-w-40" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">{company?.name || invoice?.companyName}</span>
          </div>
        )}

        {/* Invoice meta — right side */}
        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium">Invoice</p>
          <p className="text-sm font-extrabold text-slate-800">#{invoice?.invoiceNumber}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{invoice?.invoiceDate}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Top 2-col: left = invoice info, right = payment (sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── Left ── */}
          <div className="space-y-4">

            {/* Invoice header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                  <Receipt size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Invoice #{invoice?.invoiceNumber}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                      <CalendarDays size={10} /> {invoice?.invoiceDate}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
                      <Building2 size={10} /> {invoice?.companyName}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Due</p>
                <p className="text-3xl font-extrabold text-blue-600">
                  ${Number(invoice?.totalAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Bill To */}
            {client && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                    <User size={12} className="text-violet-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Bill To</p>
                </div>
                <InfoRow icon={User}   label="Name"    value={client.clientName} />
                <InfoRow icon={Mail}   label="Email"   value={client.clientEmail} />
                <InfoRow icon={Phone}  label="Phone"   value={client.clientPhone} />
                <InfoRow icon={MapPin} label="Address" value={client.clientAddress} />
                {client.clientWebsite && (
                  <InfoRow icon={Globe} label="Website" value={client.clientWebsite} link />
                )}
              </div>
            )}
          </div>

          {/* ── Right — sticky payment form ── */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-7">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 leading-none">Secure Payment</p>
                  <p className="text-xs text-slate-400 mt-0.5">Your payment is encrypted and secure</p>
                </div>
              </div>
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  amount={invoice?.totalAmount}
                  invoiceid={invoiceid}
                />
              </Elements>
            </div>
          </div>
        </div>

        {/* ── Full-width below: Description + Package Details ── */}
        {(client?.projectsDetails || client?.packageDetails) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            {client?.projectsDetails && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <FileText size={12} className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Project Details</p>
                </div>
                <div className="px-7 py-5">
                  <div
                    className="rich-content text-sm text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: client.projectsDetails }}
                  />
                </div>
              </div>
            )}

            {client?.packageDetails && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Package size={12} className="text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Package Details</p>
                </div>
                <div className="px-7 py-5">
                  <div
                    className="rich-content text-sm text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: client.packageDetails }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Trusted partners ticker ── */}
      <div className="border-t border-slate-200 bg-white py-6 overflow-hidden">
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
          Trusted by world-class companies
        </p>
        <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          {[0, 1].map((set) => (
            <div
              key={set}
              className="flex items-center gap-12 animate-marquee shrink-0 pr-12"
              aria-hidden={set === 1}
            >
              {[
                { name: "Shopify",    domain: "shopify.com"    },
                { name: "Oracle",     domain: "oracle.com"     },
                { name: "Salesforce", domain: "salesforce.com" },
                { name: "HubSpot",    domain: "hubspot.com"    },
                { name: "Stripe",     domain: "stripe.com"     },
                { name: "Slack",      domain: "slack.com"      },
                { name: "Notion",     domain: "notion.so"      },
                { name: "Figma",      domain: "figma.com"      },
                { name: "Zoom",       domain: "zoom.us"        },
                { name: "Twilio",     domain: "twilio.com"     },
                { name: "Intercom",   domain: "intercom.com"   },
                { name: "Zendesk",    domain: "zendesk.com"    },
              ].map((brand) => (
                <div key={brand.name} className="flex items-center gap-2.5 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                    alt={brand.name}
                    className="h-6 w-6 object-contain rounded"
                  />
                  <span className="text-sm font-bold text-slate-500 whitespace-nowrap tracking-tight">
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <Lock size={10} />
        Powered by Stripe · Payments are secure and encrypted
      </div>
    </div>
  );
};

export default Page;
