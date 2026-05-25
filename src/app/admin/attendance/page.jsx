"use client"
import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb'
import Listallattendance from '@/app/utils/superadmin/components/Listelements/Listallattendance'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import { createemployees } from '@/features/Slice/EmployeeSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const page = () => {


  const dispatch = useDispatch();

  useEffect(() => {
    const getAllDepartments = async () => {
      try {
        const res = await axios.get("/api/get-all-employees");


        dispatch(createemployees(res.data?.employees || []));

      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    getAllDepartments();
  }, []);



  return (
    <SuperAdminlayout>
      <Superbreadcrumb path={"Attendance"} />
      <Listallattendance />
    </SuperAdminlayout>
  )
}

export default page