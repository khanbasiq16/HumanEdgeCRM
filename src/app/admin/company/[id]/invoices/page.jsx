"use client"
import Companybreadcumbs from '@/app/utils/superadmin/components/breadcrumbs/Companybreadcumbs'
import ListInvoices from '@/app/utils/superadmin/components/Listelements/ListInvoices'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import { getallinvoice } from '@/features/Slice/InvoiceSlice'
import axios from 'axios'
import React, { use, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const page = () => {
    const dispatach = useDispatch();

    //   const { invoice } = useSelector((state) => state.User);
    
    

  return (
    <>
    <SuperAdminlayout>
         <section className="w-full ">
            <Companybreadcumbs path={"Invoices"}/>
            <ListInvoices/>
            </section>
    </SuperAdminlayout>
    </>
  )
}

export default page