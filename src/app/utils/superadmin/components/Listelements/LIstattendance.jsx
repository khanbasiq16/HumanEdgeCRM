"use client";
import AttendanceGraphs from "@/app/utils/basecomponents/AttendanceGraphs";
import CheckInTable from "@/app/utils/employees/components/Tables/CheckInTable";
import CheckOutTable from "@/app/utils/employees/components/Tables/CheckOutTable";
import React, { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";

const Listattendance = ({ attendance, setemployee }) => {
  const [checkins, setCheckIns]   = useState([]);
  const [checkouts, setCheckOuts] = useState([]);
  const [activeTab, setActiveTab] = useState("checkin");

  useEffect(() => {
    if (attendance && attendance.length > 0) {
      setCheckIns(
        attendance.map((item) => ({ id: item.id, date: item.date, ...item.checkin })).reverse()
      );
      setCheckOuts(
        attendance.map((item) => ({ id: item.id, date: item.date, ...item.checkout })).reverse()
      );
    }
  }, [attendance]);

  const tabs = [
    { key: "checkin",  label: "Check In",  icon: LogIn  },
    { key: "checkout", label: "Check Out", icon: LogOut },
  ];

  return (
    <div className="space-y-4">
      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150
              ${activeTab === key
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"}
            `}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {activeTab === "checkin"
        ? <CheckInTable data={checkins} setemployee={setemployee} />
        : <CheckOutTable data={checkouts} setemployee={setemployee} />
      }

      {/* ── Graph ── */}
      <AttendanceGraphs data={attendance} activeTab={activeTab} />
    </div>
  );
};

export default Listattendance;
