import { redirect } from "next/navigation";

export const metadata = { title: "Service catalogue", robots: { index: false, follow: false } };

export default function LegacyStorefrontAdminPage() { redirect("/admin"); }
