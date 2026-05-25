"use client"
import Superbreadcrumb from '@/app/utils/superadmin/components/breadcrumbs/Superbreadcrumb';
import ListExpenses from '@/app/utils/superadmin/components/Listelements/ListExpenses';
import SuperAdminlayout from '@/app/utils/superadmin/layout/SuperAdmin';
import axios from 'axios';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

const page = () => {
    const { slug } = useParams();
    const { user } = useSelector((state) => state.User);

    const [expensesCategories, setExpensesCategories] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [bankaccounts, setBankaccounts] = useState([]);
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [
                    expenseCategoryRes,
                    expenseRes,
                    bankRes
                ] = await Promise.all([
                    axios.get('/api/acounts/expenses/get-expense-category'),
                    axios.get(`/api/acounts/expenses/get-all-expenses`),
                    axios.get(`/api/acounts/banks/get-all-banks`)
                ]);

                if (expenseCategoryRes.data.success) {
                    console.log(expenseCategoryRes?.data?.expensesCategories)
                    setExpensesCategories(expenseCategoryRes?.data?.expensesCategories);
                }

                if (expenseRes.data.success) {
                    console.log(expenseRes?.data?.expenses)
                    setExpenses(expenseRes?.data?.expenses);
                }

                if (bankRes.data.success) {
                    console.log(bankRes?.data?.banks)
                    setBankaccounts(bankRes?.data?.banks);
                }
            } catch (error) {
                console.error("API Error:", error);
            }
        };

        fetchData();
    }, []);



    return (
        <SuperAdminlayout>
            <Superbreadcrumb
                path="Expenses"
                expensesCategories={expensesCategories}
                bankaccounts={bankaccounts}
                setExpenses={setExpenses}
            />
            <ListExpenses bankaccounts={bankaccounts} expenses={expenses} setExpenses={setExpenses} />
        </SuperAdminlayout>
    )
}

export default page