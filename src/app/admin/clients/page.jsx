"use client";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import ListAllClients from "@/app/utils/superadmin/components/Listelements/ListAllClients";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import React from "react";

const Page = () => {
  return (
    <SuperAdminlayout>
      <Superbreadcrumb path="Clients" />
      <ListAllClients />
    </SuperAdminlayout>
  );
};

export default Page;
