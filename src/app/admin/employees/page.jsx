"use client"

import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb'
import ListEmployees from '@/app/utils/superadmin/components/Listelements/ListEmployees'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import { createcompany } from '@/features/Slice/CompanySlice'
import { createdepartment } from '@/features/Slice/DepartmentSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const page = () => {

  const dispatch = useDispatch();

  useEffect(() => {
    const getAllDepartments = async () => {
      try {
        const res = await axios.get("/api/get-all-department");

        dispatch(createdepartment(res.data?.departments || []));
        
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        // setLoading(false);
      }
    };
  
    getAllDepartments();
  }, []);


   useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("/api/get-all-companies");
        
        dispatch(createcompany(res.data?.companies || []));
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      } 
    };

    fetchCompanies();
  }, []);
    
  return (
    <SuperAdminlayout>
      <Superbreadcrumb path={"Employees"} />
      <ListEmployees />
    </SuperAdminlayout>
  )
}

export default page