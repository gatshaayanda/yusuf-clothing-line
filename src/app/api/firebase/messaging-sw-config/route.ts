export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const isYusufProject =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "yusuf-clothing-line" &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN === "yusuf-clothing-line.firebaseapp.com" &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET === "yusuf-clothing-line.firebasestorage.app" &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID === "531992782883" &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID === "1:531992782883:web:7d38e73ae99a371666e996" &&
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID === "G-C8V6DN1C4J";
  const config = isYusufProject ? {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  } : {};
  // Always return valid JavaScript so an unconfigured optional messaging integration
  // cannot prevent the service worker's install/offline cache from loading.
  return new Response("self.__YUSUF_FIREBASE_CONFIG__ = " + JSON.stringify(config) + ";", {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
