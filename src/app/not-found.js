"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF4FF] via-white to-blue-100 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #bfdbfe 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-300 rounded-full opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-300 rounded-full opacity-20 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 text-center flex flex-col items-center"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center">
            <Image src="/logo.webp" alt="HumanEdge" width={36} height={36} className="w-full h-full object-contain" />
          </div>
          <div className="text-left leading-none">
            <p className="font-extrabold text-slate-900 text-[15px] tracking-tight">HumanEdge</p>
            <p className="text-slate-500 text-xs font-medium">HR Management Platform</p>
          </div>
        </div>

        {/* Icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-6"
        >
          <FileQuestion size={36} className="text-blue-600" />
        </motion.div>

        {/* 404 */}
        <h1 className="text-8xl font-black text-slate-900 leading-none mb-2">
          4<span className="text-blue-600">0</span>4
        </h1>
        <h2 className="text-xl font-bold text-slate-700 mb-3">Page Not Found</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
          The page you are looking for does not exist or you do not have access to it.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-blue-200 bg-white text-slate-700 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm shadow-blue-200"
          >
            <Home size={15} />
            Home
          </button>
        </div>
      </motion.div>

      <p className="absolute bottom-6 text-xs text-slate-400 z-10">
        © {new Date().getFullYear()} HumanEdge. All rights reserved.
      </p>
    </div>
  );
}
