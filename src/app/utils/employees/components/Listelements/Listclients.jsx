"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { getallclients } from "@/features/Slice/ClientSlice";
import { Users, Loader2 } from "lucide-react";
import { Clienttable } from "../Tables/Clienttable";
import Clientdialog from "../dialog/Clientdialog";

const Listclients = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { clients } = useSelector((s) => s.Client);
  const { user }    = useSelector((s) => s.User);
  const { id, slug } = useParams();

  useEffect(() => {
    if (!id || !user?.employeeId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/get-clients/${id}/${user.employeeId}`);
        dispatch(getallclients(res.data?.clients || []));
      } catch {
        dispatch(getallclients([]));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user?.employeeId]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Clients</h1>
          {!loading && (
            <p className="text-sm text-slate-400 mt-0.5">
              {clients.length} client{clients.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Clientdialog />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users size={22} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">No clients yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Create Client" to add your first client</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Clienttable clients={clients} slug={slug} companyslug={id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Listclients;
