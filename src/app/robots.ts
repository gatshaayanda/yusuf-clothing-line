import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const baseUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/orders", "/requests", "/invite"] }, sitemap: baseUrl + "/sitemap.xml", host: baseUrl };
}
