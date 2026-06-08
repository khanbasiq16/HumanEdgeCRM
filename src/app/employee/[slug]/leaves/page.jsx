"use client";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import Listleaves from "@/app/utils/employees/components/Listelements/Listleaves";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";

const Page = () => {
  const { user } = useSelector((state) => state.User);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.employeeId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/get-employee/${user.employeeId}`);
        setEmployee(res?.data?.employee || null);
      } catch (error) {
        console.error("Error fetching employee:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.employeeId]);

  return (
    <Employeelayout>
      <div className="max-w-5xl mx-auto space-y-5">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Loading leave applications...</p>
          </div>
        ) : (
          <Listleaves employee={employee || user} />
        )}
      </div>
    </Employeelayout>
  );
};

export default Page;
