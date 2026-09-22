import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "civ",
    version: "0.1.0-alpha",
    mode: process.env.NEXT_PUBLIC_CIV_MINT ? "configured" : "demo",
  });
}
