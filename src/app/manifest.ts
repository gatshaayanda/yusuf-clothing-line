import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Yusuf Clothing Line | Tailoring & Alterations",
    short_name: "Yusuf Clothing",
    description: "Custom tailoring, alterations and made-to-measure garments in Botswana.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F5F0",
    theme_color: "#6B2636",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["shopping", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      { src: "/yusuf-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
    shortcuts: [
      { name: "Request tailoring", short_name: "Request", description: "Request tailoring or alterations", url: "/request", icons: [{ src: "/yusuf-icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "My orders", short_name: "Orders", description: "View your requests and order history", url: "/account", icons: [{ src: "/yusuf-icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "Business admin", short_name: "Admin", description: "Manage tailoring operations", url: "/admin", icons: [{ src: "/yusuf-icon.svg", sizes: "any", type: "image/svg+xml" }] }
    ]
  };
}
