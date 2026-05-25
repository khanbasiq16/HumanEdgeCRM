import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb'
import ListAccountUser from '@/app/utils/superadmin/components/Listelements/ListAccountUser'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import React from 'react'

const page = () => {
    return (
        <SuperAdminlayout>
            <Superbreadcrumb path={"Accountants"} />
            <ListAccountUser />
        </SuperAdminlayout>
    )
}

export default page