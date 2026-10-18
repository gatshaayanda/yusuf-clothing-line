import AdminGate from "@/app/admin/admin-gate";
import TailoringAdminDashboard from "@/components/TailoringAdminDashboard";

export const metadata = { title: "Business workspace", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminGate><TailoringAdminDashboard /></AdminGate>;
}
