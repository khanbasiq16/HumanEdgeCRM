"use client";
import Accountslayout from "@/app/utils/accounts/layout/Accountslayout";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
    Banknote,
    Landmark,
    Repeat2,
    Calendar,
    Clock,
    Building,
    Wallet,
    Tag,
    PlusCircle,
    Pencil,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditBankDialog from "@/app/utils/accounts/components/dialog/Editbankdialog";
import AddBalanceDialog from "@/app/utils/accounts/components/dialog/Addbalancedialog";
import { useSelector } from "react-redux";
import Transactionlogstable from "@/app/utils/accounts/Tables/Transactionlogstable";

// Styled detail row
const DetailRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center p-2 md:p-3 border-b border-gray-100 last:border-b-0">
        {Icon && <Icon className="text-primary-500 mr-3 w-5 h-5" strokeWidth={2.2} />}
        <span className="text-gray-600 font-medium w-1/3 min-w-[120px]">{label}:</span>
        <span className="text-gray-800 font-semibold truncate">{value}</span>
    </div>
);

// Modern card
const ModernCard = ({ title, children, icon: Icon }) => (
    <div className="bg-white p-6 shadow-md rounded-lg">
        <h2 className="flex items-center text-xl md:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            {Icon && <Icon className="text-primary-500 mr-3 w-7 h-7 md:w-8 md:h-8" strokeWidth={2.2} />}
            {title}
        </h2>
        {children}
    </div>
);

const Page = () => {
    const { bankslug } = useParams();
    const [bank, setBank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [openbalance, setOpenbalance] = useState(false);

    const { user } = useSelector((state) => state.User)

    useEffect(() => {
        const fetchBank = async () => {
            try {
                const res = await axios.get(`/api/acounts/banks/get-bank-details/${bankslug}`);
                if (res.data.success) {
                    setBank(res.data.bank);
                }
            } catch (error) {
                console.error("Error fetching bank:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBank();
    }, []);



    if (loading)
        return (
            <Accountslayout>
                <div className="flex justify-center items-center h-40">
                    <p className="text-xl text-gray-500">Loading bank details...</p>
                </div>
            </Accountslayout>
        );

    if (!bank)
        return (
            <Accountslayout>
                <div className="flex justify-center items-center h-40">
                    <p className="text-xl text-red-500">Bank not found or an error occurred!</p>
                </div>
            </Accountslayout>
        );

    const balanceColor = bank.balance > 0 ? "text-green-600" : "text-red-600";
    const statusColor = bank.status === "active" ? "text-green-700 bg-green-100" : "text-yellow-700 bg-yellow-100";

    return (
        <Accountslayout>
            <section className="w-full p-4 sm:p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">

                <div className="flex justify-between mb-8 items-center">

                    <h1 className="text-3xl font-bold text-gray-900  flex items-center">
                        <Landmark className="text-primary-500 mr-3 w-8 h-8" strokeWidth={2.2} />
                        {bank.banktitle} Details
                    </h1>

                    <div className="flex items-center space-x-4">

                        <AddBalanceDialog open={openbalance} setOpen={setOpenbalance} bank={bank} setBank={setBank} />

                    </div>
                </div>

                {/* Account Overview */}
                <ModernCard title="Account Overview" icon={Banknote}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <DetailRow label="Account Holder" value={bank.accountHolderName} icon={Wallet} />
                        <DetailRow label="Account Type" value={bank.accountType} icon={Tag} />
                        <div className="flex flex-col items-start p-2 border-b border-gray-100 justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600 flex font-medium min-w-[120px]"><DollarSign className="mr-2" /> Current Balance:</span>
                                <span className={`text-2xl font-bold ${balanceColor}`}>
                                    {bank.currency?.symbol} {parseFloat(bank.balance).toLocaleString()}
                                </span>
                            </div>

                        </div>
                        <DetailRow label="IBAN" value={bank.iban} icon={Landmark} />
                        <DetailRow label="Branch Code" value={bank.branchCode} icon={Building} />
                        <div className="flex items-center p-3 border-b border-gray-100">
                            <span className="text-gray-600 font-medium w-1/3 min-w-[120px]">Status:</span>
                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${statusColor}`}>
                                {bank.status.charAt(0).toUpperCase() + bank.status.slice(1).toLowerCase()}
                            </span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="text-gray-600 font-medium mb-1">Notes:</p>
                        <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border">{bank.notes || "No notes available."}</p>
                    </div>

                    {/* Created At & Linked Company */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
                        <p className="flex items-center">
                            <Calendar className="mr-2 w-4 h-4" />
                            Created At: {new Date(bank.createdAt).toLocaleString()}
                        </p>

                    </div>
                </ModernCard>


                {/* Transaction History */}
                <ModernCard title="Transaction History" icon={Repeat2}>
                    {bank.Logs && bank.Logs.length > 0 ? (
                        <Transactionlogstable logs={bank.Logs} />
                    ) : (
                        <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                            No recent transactions found for this account.
                        </p>
                    )}

                </ModernCard>

                {/* Related Accounts */}
                <ModernCard title="Related Accounts" icon={Landmark}>
                    {bank.banks && bank.banks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bank.banks.map((b, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-primary-50 rounded-lg shadow-sm border border-primary-200 hover:bg-primary-100 transition cursor-pointer"
                                >
                                    <p className="font-semibold text-primary-800 flex items-center">
                                        <Landmark className="mr-2 w-5 h-5" />
                                        {b.banktitle}
                                    </p>
                                    <p className="text-sm text-gray-600">Click to view details</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                            No other banks are linked to this account.
                        </p>
                    )}
                </ModernCard>
            </section>
        </Accountslayout>
    );
};

export default Page;
