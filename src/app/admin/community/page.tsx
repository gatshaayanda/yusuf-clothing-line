import { redirect } from "next/navigation";

export const metadata = { title: "Business workspace", robots: { index: false, follow: false } };

export default function LegacyCommunityAdminPage() { redirect("/admin"); }
