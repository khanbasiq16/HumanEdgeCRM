"use client";
import Listinvoices from "@/app/utils/employees/components/Listelements/Listinvoices";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React from "react";

const page = () => {
  return (
    <Employeelayout>
      <section className="w-full">
        <Listinvoices />
      </section>
    </Employeelayout>
  );
};

export default page;
