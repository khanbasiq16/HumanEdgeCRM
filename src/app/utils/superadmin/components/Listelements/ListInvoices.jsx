"use client"
import { Card } from '@/components/ui/card'
import React, { useEffect, useState } from 'react'
import Invoicedialog from '../dialog/Invoicedialog'
import InvoiceTable from '../Tables/InvoiceTable'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { getallinvoice } from '@/features/Slice/InvoiceSlice'

const ListInvoices = () => {
     const [loading, setLoading] = useState(true);
  const router = useRouter()
  const dispatch = useDispatch();
  const { invoices } = useSelector((state) => state.Invoice);

  const {id} = useParams()


  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/get-all-invoice/${id}`);

        dispatch(getallinvoice(res.data?.invoices || []));
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, []);
    

  return (
      <Card className="p-6 rounded-xl shadow-md flex flex-col h-[64vh] overflow-auto">
      {loading ? (
        <p className="text-center text-gray-500">Loading Invoices...</p>
      ) : invoices.length === 0 ? (
        <div className="flex h-full justify-center items-center">
          <Invoicedialog />
        </div>
      ) : (
        <>
        <InvoiceTable
          invoices={invoices}
          slug={id}
          onRefresh={async () => {
            const res = await axios.get(`/api/get-all-invoice/${id}`);
            dispatch(getallinvoice(res.data?.invoices || []));
          }}
        />
        </>
      )}
    </Card>
  )
}

export default ListInvoices