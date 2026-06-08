import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.NEXT_STRIPE_PUBLICABLE_KEY;
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Stripe publishable key not configured" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, publishableKey: key });
}
