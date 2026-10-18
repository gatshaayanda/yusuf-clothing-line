import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Retired The Plug endpoint. Yusuf uses the dedicated tailoring request model.
export async function POST() {
  return NextResponse.json(
    { error: "This inherited endpoint has been retired. Use the Yusuf Clothing Line tailoring workflow." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
