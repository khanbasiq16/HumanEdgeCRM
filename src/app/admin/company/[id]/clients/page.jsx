import Companybreadcumbs from '@/app/utils/superadmin/components/breadcrumbs/Companybreadcumbs'
import ListClients from '@/app/utils/superadmin/components/Listelements/ListClients'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import React from 'react'

const page = () => {
  return (
    <>
    <SuperAdminlayout>
         <section className="w-full ">
            <Companybreadcumbs path={"Clients"}/>
            <ListClients />

        </section>
    </SuperAdminlayout>
    
    </>
  )
}

export default page