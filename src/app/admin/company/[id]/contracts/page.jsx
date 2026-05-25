"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";

import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import Companybreadcumbs from "@/app/utils/superadmin/components/breadcrumbs/Companybreadcumbs";
import Listcontracts from "@/app/utils/superadmin/components/Listelements/Listcontracts";
import { createtemplate } from "@/features/Slice/TemplateSlice";
import { createcontracts } from "@/features/Slice/ContractsSlice";
import { getallclients } from "@/features/Slice/ClientSlice";


const Page = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const { clients } = useSelector((state) => state.Client);  
  


  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`/api/templates/${id}`);
        if (res.data.success) {
          dispatch(createtemplate(res.data.templates || []));
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } 
    };

    if (id) fetchTemplates();
  }, [id, dispatch]);



 

  useEffect(() => {
    const fetchclients = async () => {
      try {
        const res = await axios.get(`/api/get-all-clients/${id}`);
        if(res.data.success){

          console.log(res)
          dispatch(getallclients(res.data?.clients || []));
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]); 
      } finally {
      }
    };

    fetchclients();
  }, []);


 
  return (
    <SuperAdminlayout>
        <section className="w-full">

      <Companybreadcumbs path="Contracts" />
      <Listcontracts  />
        </section>
    </SuperAdminlayout>
  );
};

export default Page;
