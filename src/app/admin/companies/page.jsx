"use client"
import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb'
import Listcompanies from '@/app/utils/superadmin/components/Listelements/Listcompanies'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import React from 'react'

const page = () => {
  return (
    <>
    
      <SuperAdminlayout>
        <section className="w-full ">
            <Superbreadcrumb path={"Companies"}/>
            <Listcompanies />
        </section>
     </SuperAdminlayout>
    </>
  )
}

export default page