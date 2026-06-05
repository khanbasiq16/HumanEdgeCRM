"use client";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import ListAllInvoices from "@/app/utils/superadmin/components/Listelements/ListAllInvoices";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import React from "react";

const Page = () => {
  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Invoices" />
      <ListAllInvoices />
    </SuperAdminlayout>
  );
};

export default Page;
