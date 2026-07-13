import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Health check pour monitoring uptime (Vercel, Better Uptime, etc.). */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "workspace",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
