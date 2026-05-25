"use client"
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb'
import Listtaxes from '@/app/utils/superadmin/components/Listelements/Listtaxes'

const page = () => {
    const [employees, setEmployees] = useState([])

    useEffect(() => {
        axios.get('/api/get-all-employees').then((res) => {
            if (res.data.success) setEmployees(res.data.employees);
        }).catch(console.error);
    }, [])

    return (
        <SuperAdminlayout>
            <Superbreadcrumb path="Tax" />
            <Listtaxes employees={employees} />
        </SuperAdminlayout>
    )
}

export default page
