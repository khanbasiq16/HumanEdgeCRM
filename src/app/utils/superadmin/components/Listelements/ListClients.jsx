"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Clienttable } from "../Tables/Clienttable";
import Clientdialog from "../dialog/Clientdialog";
import { useDispatch, useSelector } from "react-redux";
import { getallclients } from "@/features/Slice/ClientSlice";
import { Users } from "lucide-react";

const SkeletonRow = () => (
  <tr className="border-b border-slate-100 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-slate-100 rounded w-full" />
      </td>
    ))}
  </tr>
);

const ListClients = () => {
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const dispatch = useDispatch();
  const { clients } = useSelector((s) => s.Client);

  useEffect(() => {
    const fetchclients = async () => {
      try {
        const res = await axios.get(`/api/get-all-clients/${id}`);
        dispatch(getallclients(res.data?.clients || []));
      } catch {
        dispatch(getallclients([]));
      } finally {
        setLoading(false);
      }
    };
    fetchclients();
  }, [id]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">
            {loading ? "Loading…" : `${clients.length} client${clients.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Clientdialog />
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["", "Client", "Email", "Phone", "Website", "Company", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users size={28} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No clients yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first client to get started</p>
            </div>
            <Clientdialog />
          </div>
        ) : (
          <Clienttable clients={clients} slug={id} />
        )}
      </div>
    </div>
  );
};

export default ListClients;
