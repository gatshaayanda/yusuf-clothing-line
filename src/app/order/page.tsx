import { redirect } from "next/navigation";

export const metadata = { title: "Start a tailoring request" };

export default function LegacyOrderPage() { redirect("/request"); }
