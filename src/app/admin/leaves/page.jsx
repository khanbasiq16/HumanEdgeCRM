"use client";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import Listleaves from "@/app/utils/superadmin/components/Listelements/Listleaves";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import React from "react";

const Page = () => {
  return (
    <SuperAdminlayout>
      <Superbreadcrumb path={"Leave Applications"} />
      <Listleaves />
    </SuperAdminlayout>
  );
};

export default Page;
