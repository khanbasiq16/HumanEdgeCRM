"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Listattendance from "@/app/utils/employees/components/Listelements/Listattendance";
import { Loader2 } from "lucide-react";

const Page = () => {
  const { user }      = useSelector((state) => state.User);
  const [attendance,  setAttendance] = useState([]);
  const [employee,    setEmployee]   = useState(null);
  const [loading,     setLoading]    = useState(false);

  useEffect(() => {
    if (!user?.employeeId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/get-employee/${user.employeeId}`);
        const emp = res?.data?.employee || null;
        setEmployee(emp);
        setAttendance(emp?.Attendance || []);
      } catch (e) {
        console.error("❌ Error fetching attendance:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.employeeId]);

  return (
    <Employeelayout>
      <div className="max-w-5xl mx-auto space-y-5">

        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Attendance History</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Your complete check-in and check-out records
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Loading attendance records…</p>
          </div>
        ) : (
          <Listattendance attendance={attendance} employee={employee} />
        )}

      </div>
    </Employeelayout>
  );
};

export default Page;
