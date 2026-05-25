"use client";
import Companybreadcumbs from "@/app/utils/superadmin/components/breadcrumbs/Companybreadcumbs";
import Superbreadcrumb from "@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb";
import ListTemplates from "@/app/utils/superadmin/components/Listelements/ListTemplates";
import SuperAdminlayout from "@/app/utils/superadmin/layout/SuperAdmin";
import { createtemplate } from "@/features/Slice/TemplateSlice";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const page = () => {
    const dispatch = useDispatch()
    const {id} = useParams()
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const fetchTemplates = async () => {
          try {
            const res = await axios.get(`/api/templates/${id}`);
            if (res.data.success) {
              console.log(res?.data?.templates);
              dispatch(createtemplate(res?.data?.templates || []));
            }
          } catch (error) {
            console.error("Error fetching templates:", error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchTemplates();
      }, []);
  return (
    <>
      <SuperAdminlayout>

          <section className="w-full ">

        <Companybreadcumbs path={"Templates"} />
        <ListTemplates loading={loading} />
          </section>

      </SuperAdminlayout>
    </>
  );
};

export default page;
