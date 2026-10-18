import { createHash, timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getAdminApp() {
  const expectedProject = process.env.FIREBASE_PROJECT_ID;
  if (expectedProject !== "yusuf-clothing-line") {
    throw new Error("FIREBASE_PROJECT_ID must target yusuf-clothing-line.");
  }
  const existing = getApps().find(app => app.options.projectId === expectedProject);
  if (existing) return existing;
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("Missing FIREBASE_ADMIN_KEY environment variable.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error("FIREBASE_ADMIN_KEY must contain valid service-account JSON."); }
  if (serviceAccount.project_id !== expectedProject) {
    throw new Error("Firebase Admin credentials do not match the configured Yusuf project.");
  }
  return initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    projectId: expectedProject
  }, "yusuf-operations");
}

function matchesWord(input: string, expected: string) {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b) && input.length > 0;
}

export async function POST(request: Request) {
  try {
    const expected = process.env.YUSUF_OPERATIONS_WORD;
    if (!expected) {
      return NextResponse.json({ error: "Operations access is not configured yet. Set YUSUF_OPERATIONS_WORD and the Yusuf Firebase Admin credentials in the server environment." }, { status: 503 });
    }
    const body = await request.json().catch(() => null) as { word?: unknown } | null;
    const word = typeof body?.word === "string" ? body.word : "";
    if (!matchesWord(word, expected)) {
      return NextResponse.json({ error: "Access denied. Check the access word and try again." }, { status: 401 });
    }
    const app = getAdminApp();
    const uid = "yusuf-clothing-line-operations";
    await getFirestore(app).collection("admins").doc(uid).set({
      role: "owner",
      bootstrapAccount: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    const token = await getAuth(app).createCustomToken(uid);
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Yusuf operations login failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Operations sign-in is temporarily unavailable. Check the Yusuf server configuration." }, { status: 500 });
  }
}
