import { redirect } from "next/navigation";

export const metadata = { title: "Tailoring request" };

export default function LegacyProductPage() { redirect("/request"); }
