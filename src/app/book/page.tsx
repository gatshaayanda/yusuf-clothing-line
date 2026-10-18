import { redirect } from "next/navigation";

export const metadata = { title: "Request a fitting", description: "Start a tailoring request and ask for fitting assistance." };

export default function BookPage() { redirect("/request"); }
