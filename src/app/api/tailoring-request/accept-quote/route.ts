import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getYusufAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId !== "yusuf-clothing-line") throw new Error("FIREBASE_PROJECT_ID must target yusuf-clothing-line.");
  const existing = getApps().find(app => app.options.projectId === projectId);
  if (existing) return existing;
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("Missing Firebase Admin credentials.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error("Firebase Admin credentials are invalid."); }
  if (serviceAccount.project_id !== projectId) throw new Error("Firebase Admin credentials do not match the Yusuf project.");
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId }, "yusuf-quote-acceptance");
}

export async function POST(request: Request) {
  try {
    const match = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    if (!match) return NextResponse.json({ error: "Your session expired. Open your account and try again." }, { status: 401 });
    const app = getYusufAdminApp();
    const user = await getAuth(app).verifyIdToken(match[1]);
    const body = await request.json().catch(() => null) as { requestId?: unknown } | null;
    if (typeof body?.requestId !== "string" || !/^[A-Za-z0-9_-]{10,128}$/.test(body.requestId)) {
      return NextResponse.json({ error: "The request reference is invalid." }, { status: 400 });
    }
    const db = getFirestore(app);
    const reference = db.collection("tailoringRequests").doc(body.requestId);
    const result = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("REQUEST_NOT_FOUND");
      const data = snapshot.data()!;
      if (data.customerId !== user.uid) throw new Error("REQUEST_NOT_OWNED");
      if (data.quoteStatus !== "ready" || typeof data.quoteAmount !== "number" || data.quoteAmount < 0 || data.status !== "quote_ready") {
        throw new Error("QUOTE_NOT_READY");
      }
      const now = new Date().toISOString();
      transaction.update(reference, {
        quoteStatus: "accepted",
        quoteAcceptedAt: now,
        quoteAcceptedAmount: data.quoteAmount,
        status: "quote_accepted",
        updatedAt: now
      });
      return { amount: data.quoteAmount };
    });
    return NextResponse.json({ accepted: true, amount: result.amount }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "REQUEST_NOT_FOUND") return NextResponse.json({ error: "This request could not be found." }, { status: 404 });
    if (message === "REQUEST_NOT_OWNED") return NextResponse.json({ error: "You can only accept a quote for your own request." }, { status: 403 });
    if (message === "QUOTE_NOT_READY") return NextResponse.json({ error: "There is no current quote ready to accept. Refresh your request and check again." }, { status: 409 });
    console.error("Yusuf quote acceptance failed:", message || "unknown error");
    return NextResponse.json({ error: "The quote could not be accepted right now. No order was confirmed; please retry." }, { status: 500 });
  }
}
