import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "url param required" }, { status: 400 });

  try {
    const res         = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);

    const buffer      = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
