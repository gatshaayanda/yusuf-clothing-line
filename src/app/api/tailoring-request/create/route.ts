import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getYusufAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (projectId !== "yusuf-clothing-line" || bucketName !== "yusuf-clothing-line.firebasestorage.app") {
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
  return initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    projectId,
    storageBucket: bucketName
  }, "yusuf-request-create");
}

function isString(value: unknown, max: number, required = false): value is string {
  return typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);
}
function clean(value: string) { return value.trim(); }

function botswanaToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Gaborone", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(item => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidFittingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
    && value >= botswanaToday();
}

export async function POST(request: Request) {
  try {
    const bearer = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    if (!bearer) return NextResponse.json({ error: "Your private session is missing. Refresh and try again." }, { status: 401 });
    const app = getYusufAdminApp();
    const user = await getAuth(app).verifyIdToken(bearer[1]);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "The request details could not be read." }, { status: 400 });

    const requestId = body.requestId;
    if (!isString(requestId, 128, true) || !/^[A-Za-z0-9_-]{10,128}$/.test(requestId)) {
      return NextResponse.json({ error: "The request reference is invalid." }, { status: 400 });
    }
    const requiredStrings: Array<[string, number]> = [
      ["customerName", 120], ["phone", 60], ["serviceId", 120],
      ["serviceName", 120], ["garmentType", 120]
    ];
    for (const [key, max] of requiredStrings) {
      if (!isString(body[key], max, true)) return NextResponse.json({ error: "Please check the required request details." }, { status: 400 });
    }
    const optionalStrings: Array<[string, number]> = [
      ["email", 200], ["stylePreferences", 1500], ["fabricPreferences", 500],
      ["measurements", 3000], ["preferredFittingDate", 20], ["notes", 3000]
    ];
    for (const [key, max] of optionalStrings) {
      if (!isString(body[key], max)) return NextResponse.json({ error: "One or more fields are too long or invalid." }, { status: 400 });
    }
    if (body.requestType !== "quote_request" || typeof body.needsFittingHelp !== "boolean") {
      return NextResponse.json({ error: "The request type or fitting preference is invalid." }, { status: 400 });
    }
    const date = body.preferredFittingDate as string;
    if (date && !isValidFittingDate(date)) {
      return NextResponse.json({ error: "Choose a real fitting date today or later." }, { status: 400 });
    }

    const db = getFirestore(app);
    const serviceName = clean(body.serviceName as string);
    let resolvedServiceId = clean(body.serviceId as string);
    // If Yusuf has published a live catalogue, validate against it server-side as well.
    // This prevents stale browser tabs from submitting services that were deactivated.
    const catalogue = await db.collection("tailoringServices").get();
    if (!catalogue.empty && serviceName !== "Other / not sure") {
      const match = catalogue.docs.find(item => item.data().name === serviceName);
      if (!match || match.data().active !== true) {
        return NextResponse.json({
          error: "That service is no longer available in the catalogue. Refresh the page and choose an active service, or select Other / not sure."
        }, { status: 409 });
      }
      resolvedServiceId = match.id;
    }

    let referenceImage: { storagePath: string; name: string; type: string; size: number } | null = null;
    if (body.referenceImage !== null && body.referenceImage !== undefined) {
      const candidate = body.referenceImage as Record<string, unknown>;
      if (!candidate || !isString(candidate.storagePath, 300, true)
        || !candidate.storagePath.startsWith(`tailoringReferences/${user.uid}/${requestId}/`)
        || !isString(candidate.name, 180)
        || !isString(candidate.type, 40)
        || typeof candidate.size !== "number" || candidate.size <= 0 || candidate.size > 5 * 1024 * 1024
        || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(candidate.type)) {
        return NextResponse.json({ error: "The reference image details are invalid." }, { status: 400 });
      }
      const fileName = candidate.storagePath.split("/").at(-1) || "";
      if (!/^[A-Za-z0-9._-]{1,100}$/.test(fileName)) {
        return NextResponse.json({ error: "The reference image path is invalid." }, { status: 400 });
      }
      const [metadata] = await getStorage(app).bucket("yusuf-clothing-line.firebasestorage.app").file(candidate.storagePath).getMetadata();
      const actualSize = Number(metadata.size || 0);
      if (metadata.contentType !== candidate.type || actualSize <= 0 || actualSize > 5 * 1024 * 1024
        || metadata.metadata?.ownerUid !== user.uid || metadata.metadata?.requestId !== requestId) {
        return NextResponse.json({ error: "The reference image could not be verified securely." }, { status: 400 });
      }
      referenceImage = { storagePath: candidate.storagePath, name: clean(candidate.name), type: candidate.type, size: actualSize };
    }

    const document = db.collection("tailoringRequests").doc(requestId);
    const now = new Date().toISOString();
    await db.runTransaction(async transaction => {
      const existing = await transaction.get(document);
      if (existing.exists) throw new Error("REQUEST_ID_ALREADY_EXISTS");
      transaction.create(document, {
        customerId: user.uid,
        customerName: clean(body.customerName as string),
        phone: clean(body.phone as string),
        email: clean(body.email as string),
        requestType: "quote_request",
        serviceId: resolvedServiceId,
        serviceName,
        garmentType: clean(body.garmentType as string),
        stylePreferences: clean(body.stylePreferences as string),
        fabricPreferences: clean(body.fabricPreferences as string),
        measurements: clean(body.measurements as string),
        needsFittingHelp: body.needsFittingHelp,
        preferredFittingDate: date,
        referenceImage,
        notes: clean(body.notes as string),
        status: "new",
        quoteStatus: "not_quoted",
        paymentStatus: "unpaid",
        productionStage: "not_started",
        createdAt: now,
        updatedAt: now
      });
    });
    return NextResponse.json({
      acknowledged: true,
      requestId,
      message: "Request received for review. This is not a confirmed quotation or order."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "REQUEST_ID_ALREADY_EXISTS") return NextResponse.json({ error: "This request reference already exists. Refresh and submit again." }, { status: 409 });
    if (message.includes("Firebase Admin") || message.includes("Yusuf server project")) {
      console.error("Yusuf request configuration error:", message);
      return NextResponse.json({ error: "The request service is not configured yet. Your details were not submitted." }, { status: 503 });
    }
    console.error("Yusuf request submission failed:", message || "unknown error");
    return NextResponse.json({ error: "The request could not be saved. No request was confirmed; please try again." }, { status: 500 });
  }
}
