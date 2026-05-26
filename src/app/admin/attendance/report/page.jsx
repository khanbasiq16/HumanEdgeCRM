"use client";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import MonthlyAttendanceReport from "@/app/utils/superadmin/components/attendance/MonthlyAttendanceReport";
import { createemployees } from "@/features/Slice/EmployeeSlice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function AttendanceReportPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    axios.get("/api/get-all-employees")
      .then((res) => dispatch(createemployees(res.data?.employees || [])))
      .catch(() => {});
  }, []);

  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Attendance / Monthly Report" />
      <MonthlyAttendanceReport />
    </SuperAdminlayout>
  );
}
