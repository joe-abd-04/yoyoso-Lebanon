import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { getPendingOrdersCount } from "@/lib/data/admin-orders";
import AdminShell from "@/components/admin/AdminShell";

// Keep the admin panel out of search engines.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Gate EVERY /admin/* route here. This server layout wraps all admin pages, so
// requireAdmin() runs before any admin UI or data is rendered. Non-admins are
// redirected (guests → /login, logged-in customers → home) and never see admin
// content. Reading the session cookie makes admin routes dynamically rendered,
// which is exactly what we want.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  // Re-fetched on every admin navigation (this layout is dynamic), so the
  // sidebar pending-orders badge stays reasonably fresh without realtime.
  const pendingOrders = await getPendingOrdersCount();

  return (
    <AdminShell adminEmail={user.email ?? ""} pendingOrders={pendingOrders}>
      {children}
    </AdminShell>
  );
}
