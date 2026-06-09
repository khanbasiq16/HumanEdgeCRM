import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req) {
  const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY);
  try {
    const body = await req.json();
    const { amount , invoiceId} = body;

    if (!amount) {
      return NextResponse.json(
        { success: false, message: "Amount is required" },
        { status: 400 }
      );
    }


    const dollars = parseFloat(amount); 
const cents = Math.round(dollars * 100);


    const paymentIntent = await stripe.paymentIntents.create({
      amount: cents, 
      currency: "usd",
      metadata: {
        invoiceId: invoiceId || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Stripe error", error },
      { status: 500 }
    );
  }
}
