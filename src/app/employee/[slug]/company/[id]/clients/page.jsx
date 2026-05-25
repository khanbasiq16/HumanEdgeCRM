"use client";
import Listclients from "@/app/utils/employees/components/Listelements/Listclients";
import Employeelayout from "@/app/utils/employees/layout/Employeelayout";
import React from "react";

const page = () => {
  return (
    <Employeelayout>
      <section className="w-full">
        <Listclients />
      </section>
    </Employeelayout>
  );
};

export default page;
