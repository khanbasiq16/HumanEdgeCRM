"use client";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import TrackingDashboard from "@/app/utils/superadmin/components/Listelements/TrackingDashboard";

const page = () => {
  return (
    <SuperAdminlayout>
      <Superbreadcrumb path={"Tracking"} />
      <TrackingDashboard />
    </SuperAdminlayout>
  );
};

export default page;
