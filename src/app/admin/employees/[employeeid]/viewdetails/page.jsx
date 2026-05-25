"use client"

import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb'
import EmployeesDetails from '@/app/utils/superadmin/components/Details/EmployeesDetails'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import { createcompany } from '@/features/Slice/CompanySlice'
import axios from 'axios'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

const page = () => {
  const [employee, setemployee] = useState("")
  const [assigncompanies, setAssignCompanies] = useState(null)
  const { employeeid } = useParams()
  const dispatch = useDispatch()


  useEffect(() => {

    const getemployee = async () => {
      try {
        const res = await axios.get(`/api/get-employee/${employeeid}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        setemployee(res.data.employee)
        setAssignCompanies(res.data.companies)


      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    }

    getemployee();
  }, [])




  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("/api/get-all-companies");

        dispatch(createcompany(res.data?.companies || []));
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);


  return (
    <>
      <SuperAdminlayout>
        <section className="w-full ">

          <Superbreadcrumb path={"Employee"} path2={`${employee?.employeeName}`} />
          <EmployeesDetails employee={employee} assigncompanies={assigncompanies} setemployee={setemployee} />
        </section>
      </SuperAdminlayout>
    </>
  )
}

export default page