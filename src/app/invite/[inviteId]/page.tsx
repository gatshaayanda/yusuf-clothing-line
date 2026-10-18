import { redirect } from "next/navigation";

export const metadata = { title: "My requests" };

export default function LegacyInvitePage() { redirect("/account"); }
