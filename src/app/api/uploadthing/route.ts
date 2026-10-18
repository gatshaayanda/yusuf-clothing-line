import { NextResponse } from "next/server";

export const runtime = "nodejs";

// The inherited unauthenticated UploadThing route is not used by Yusuf.
// Customer reference images use owner-scoped Firebase Storage paths.
function retired() {
  return NextResponse.json(
    { error: "This upload endpoint has been retired. Use the secure Yusuf reference-image workflow." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
export async function GET() { return retired(); }
export async function POST() { return retired(); }
