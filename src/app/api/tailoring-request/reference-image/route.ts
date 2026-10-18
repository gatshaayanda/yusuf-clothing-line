import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getYusufAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId !== "yusuf-clothing-line" || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET !== "yusuf-clothing-line.firebasestorage.app") {
    throw new Error("Yusuf server project configuration is missing or mismatched.");
  }
  const existing = getApps().find(app => app.options.projectId === projectId);
  if (existing) return existing;
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("Missing Firebase Admin credentials.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error("Firebase Admin credentials are invalid."); }
  if (serviceAccount.project_id !== projectId) throw new Error("Firebase Admin credentials do not match the Yusuf project.");
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId, storageBucket: "yusuf-clothing-line.firebasestorage.app" }, "yusuf-private-reference-image");
}

export async function GET(request: Request) {
  try {
    const bearer = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    if (!bearer) return NextResponse.json({ error: "Sign in to the business workspace first." }, { status: 401 });
    const requestId = new URL(request.url).searchParams.get("requestId") || "";
    if (!/^[A-Za-z0-9_-]{10,128}$/.test(requestId)) return NextResponse.json({ error: "The request reference is invalid." }, { status: 400 });
    const app = getYusufAdminApp();
    const user = await getAuth(app).verifyIdToken(bearer[1]);
    const db = getFirestore(app);
    const admin = await db.collection("admins").doc(user.uid).get();
    if (!admin.exists || !["owner", "staff", "Owner", "Staff"].includes(String(admin.data()?.role || ""))) {
      return NextResponse.json({ error: "Only authorized staff can view customer reference images." }, { status: 403 });
    }
    const requestDoc = await db.collection("tailoringRequests").doc(requestId).get();
    if (!requestDoc.exists) return NextResponse.json({ error: "The request could not be found." }, { status: 404 });
    const requestData = requestDoc.data()!;
    const image = requestData.referenceImage as { storagePath?: unknown; type?: unknown; size?: unknown } | null;
    const customerId = String(requestData.customerId || "");
    if (!image || typeof image.storagePath !== "string"
      || !image.storagePath.startsWith("tailoringReferences/" + customerId + "/" + requestId + "/")) {
      return NextResponse.json({ error: "This request has no available reference image." }, { status: 404 });
    }
    const file = getStorage(app).bucket("yusuf-clothing-line.firebasestorage.app").file(image.storagePath);
    const [metadata] = await file.getMetadata();
    const contentType = String(metadata.contentType || "");
    const size = Number(metadata.size || 0);
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(contentType)
      || size <= 0 || size > 5 * 1024 * 1024
      || metadata.metadata?.ownerUid !== customerId || metadata.metadata?.requestId !== requestId) {
      return NextResponse.json({ error: "The stored reference image failed its security checks." }, { status: 403 });
    }
    const [bytes] = await file.download();
    const responseBody = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(responseBody).set(bytes);
    return new Response(responseBody, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox"
      }
    });
  } catch (error) {
    console.error("Yusuf private reference retrieval failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "The private reference image could not be retrieved." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
