export function getSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  if (configured && !(isVercel && /localhost|127\.0\.0\.1/i.test(configured))) return configured;
  const canonical = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (canonical) return "https://" + canonical.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const deployment = process.env.VERCEL_URL;
  if (deployment) return "https://" + deployment.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return configured || "http://localhost:3000";
}
