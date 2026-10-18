import { redirect } from "next/navigation";

export const metadata = { title: "Order history" };

export default function LegacyOrderPage() { redirect("/account"); }
