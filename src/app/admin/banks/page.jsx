"use client"
import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb'
import Listbanks from '@/app/utils/superadmin/components/Listelements/Listbanks'
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin'
import { createallBanks } from '@/features/Slice/BankSlice'
import { createcompany } from '@/features/Slice/CompanySlice'
import { createallCurency } from '@/features/Slice/CurencySlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const page = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const getBanks = async () => {
            dispatch(createallBanks([]))
            try {
                const res = await axios.get('/api/acounts/banks/get-all-banks');
                if (res.data.success) dispatch(createallBanks(res.data.banks));
            } catch (error) {
                console.log(error);
            }
        };
        getBanks();
    }, []);

    useEffect(() => {
        axios.get('/api/admin/get-curency').then((res) => {
            if (res.data.success) dispatch(createallCurency(res.data.currencies));
        });
    }, []);

    useEffect(() => {
        axios.get('/api/get-maincompanies').then((res) => {
            if (res.data.success) dispatch(createcompany(res.data.companies));
        }).catch(console.error);
    }, []);

    return (
        <SuperAdminlayout>
            <Superbreadcrumb path={"Banks"} />
            <Listbanks />
        </SuperAdminlayout>
    )
}

export default page
