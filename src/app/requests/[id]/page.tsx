import { redirect } from "next/navigation";

export const metadata = { title: "Request history" };

export default function LegacyRequestPage() { redirect("/account"); }
