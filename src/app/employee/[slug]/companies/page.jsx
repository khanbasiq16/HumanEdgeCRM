"use client";
import Listcompanies from "@/app/utils/employees/components/Listelements/Listcompanies";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React from "react";

const page = () => {



  return (
    <Employeelayout>
      <section className="w-full max-w-5xl">
        <Listcompanies />
      </section>
    </Employeelayout>
  );
};

export default page;
