"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Elements,
    useStripe,
    useElements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import toast from "react-hot-toast";

const stripePromise = loadStripe("pk_test_51P7YcnIE9AYOfBDmB8Pt3nR5BMw3nVkAUBXOD234JbvrOcCI7P8ckvEklsEbO9L8cgITMDIph2KGvVS8u2iHHUCc00Q5sYyz3L");

const VIP_CARD_STYLE = {
    style: {
        base: {
            fontSize: '16px',
            color: 'black', 
            '::placeholder': {
                color: '#6B7280', 
            },
            padding: '10px 12px', 
        },
        invalid: {
            color: '#EF4444', 
        },
    },
    hidePostalCode: true,
};


const CheckoutForm = ({ clientSecret, amount , invoiceid }) => {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);

    const router = useRouter();

 
    const displayAmount = amount ;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Form Validation Check
        if (!stripe || !elements || !clientSecret) {
            setErrorMsg("Payment gateway not ready or missing Client Secret.");
            return;
        }

        setLoading(true);
        setErrorMsg("");
        setSuccess(false);



        const cardNumberElement = elements.getElement(CardNumberElement);

        const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumberElement,
            },
        });

        if (error) {
            // Handle error from Stripe side
            toast.error(error.message || "Payment failed");
        } else if (paymentIntent?.status === "succeeded") {
            
            const res = await axios.post("/api/confirm-payment", {
                invoiceId: invoiceid,
                status: "Paid",
            });


            if(!res.data.success){
                toast.error(res.data.message || "Failed to update invoice status");
                setLoading(false);
                return;
            }

            toast.success(res.data.message);

            router.push(`/success?invoiceId=${invoiceid}&amount=${amount}`);
            
            setSuccess(true);
        }
        
        setLoading(false);
    };

    return (
        <form 
            onSubmit={handleSubmit}
            className="max-w-md mx-auto p-8 lg:p-10  rounded-xl border  space-y-6 transform hover:shadow-blue-500/50 transition duration-300"
        >
            <h2 className="text-3xl font-extrabold text-gray-700 text-center  pb-3">
                💳 Secure Payment
            </h2>

            {/* Card Number */}
            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    Card Number
                </label>
                <div 
                    className="border border-gray-700 hover:border-blue-500 focus-within:border-blue-500 rounded-lg p-3 transition duration-200"
                >
                    <CardNumberElement options={VIP_CARD_STYLE} />
                </div>
            </div>

            {/* Expiry & CVC in a single, well-aligned row */}
            <div className="flex space-x-4">
                {/* Expiry */}
                <div className="w-1/2 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Expiry Date
                    </label>
                    <div className="border border-gray-700  rounded-lg p-3 transition duration-200">
                        <CardExpiryElement options={VIP_CARD_STYLE} />
                    </div>
                </div>

                {/* CVC */}
                <div className="w-1/2 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        CVC
                    </label>
                    <div className="border border-gray-700 rounded-lg p-3 transition duration-200">
                        <CardCvcElement options={VIP_CARD_STYLE} />
                    </div>
                </div>
            </div>

            {errorMsg && <p className="text-red-400 text-sm mt-3 text-center">{errorMsg}</p>}
            {success && <p className="text-green-400 text-sm mt-3 font-semibold text-center">✅ Payment Successful! Thank you.</p>}

            {/* Submit Button */}
            <button
                disabled={!stripe || loading || success} // Payment successful ہونے کے بعد بھی disable کر دیا گیا
                className={`w-full py-3 mt-6 rounded-lg font-bold text-lg transition duration-300 transform bg-[#5965AB] text-white hover:bg-[#4f58a0] hover:scale-[1.02] 
                            `
                }
            >
                {loading ? "Processing Securely..." : success ? "Payment Done!" : `Pay $${displayAmount}`}
            </button>

        </form>
    );
}


const page = () => {
    const params = useParams(); 
 
    const invoiceid = params?.invoiceid; 

    const [clientSecret, setClientSecret] = useState(null);
    const [amount, setAmount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [InvoiceNumber, setInvoicenumber] = useState(null);

    useEffect(() => {
        if (!invoiceid) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const res = await axios.get(`/api/get-invoice/${invoiceid}`);
                const invoice = res.data?.invoice;
                setInvoicenumber(invoice?.invoiceNumber || "N/A");
                
                const amt = invoice?.totalAmount;
                if (!amt) {
                    throw new Error("Invalid invoice amount.");
                }
                setAmount(amt);

                const intentRes = await axios.post("/api/create-payment-intent", {
                    invoiceId: invoiceid,
                    amount: amt,
                });

                setClientSecret(intentRes.data.clientSecret);
            } catch (err) {
                console.error("Error fetching invoice or creating payment intent:", err);
                setClientSecret(null); 
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [invoiceid]); 


    if (loading) return <p className="p-10 text-lg font-medium text-gray-700">Loading payment details...</p>;
    
    if (!clientSecret) return (
        <div className="p-10 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed to Initialize ❌</h1>
            <p className="text-gray-600">We could not load the payment details. Please check the Invoice ID or contact support.</p>
        </div>
    );

    const options = {
        clientSecret,
        appearance: { theme: 'night' }, 
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Invoice Payment </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Invoice ID: <span className="font-mono bg-gray-200 dark:bg-gray-700 p-1 rounded text-blue-500">{InvoiceNumber}</span></p>
            </div>

            <Elements stripe={stripePromise} options={options}>
                <CheckoutForm clientSecret={clientSecret} amount={amount}  invoiceid={invoiceid}/>
            </Elements>
        </div>
    );
};

export default page;