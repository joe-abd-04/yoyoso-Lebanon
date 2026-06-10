import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Heart, User as UserIcon, Mail, Phone, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server-auth";
import { getIsAdmin } from "@/lib/auth/admin";
import { buildMetadata } from "@/lib/seo";
import SignOutButton from "@/components/account/SignOutButton";

export const metadata: Metadata = buildMetadata({
  title: "My Account",
  description: "Manage your YOYOSO account.",
  path: "/account",
});

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-text-primary">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const admin = await getIsAdmin(user.id);

  const meta = user.user_metadata ?? {};
  const fullName =
    (meta.full_name as string | undefined) ??
    [meta.first_name, meta.last_name].filter(Boolean).join(" ") ??
    "";
  const phone = (meta.phone as string | undefined) ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            My Account
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {fullName ? `Welcome back, ${fullName.split(" ")[0]}!` : "Welcome back!"}
          </p>
        </div>
        <SignOutButton />
      </div>

      {/* Profile card */}
      <section className="mt-6 rounded-card border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">
          Profile
        </h2>
        <ProfileRow icon={<UserIcon size={17} />} label="Name" value={fullName} />
        <ProfileRow icon={<Mail size={17} />} label="Email" value={user.email ?? ""} />
        <ProfileRow icon={<Phone size={17} />} label="Phone" value={phone} />
      </section>

      {/* Admin entry — only rendered for admins (gate is server-side in /admin) */}
      {admin && (
        <Link
          href="/admin"
          className="mt-6 flex items-center gap-3 rounded-card border border-primary/30 bg-primary/5 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="font-bold text-text-primary">Admin Panel</p>
            <p className="text-sm text-text-secondary">Manage products & store</p>
          </div>
        </Link>
      )}

      {/* Quick links */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="flex items-center gap-3 rounded-card border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package size={20} />
          </span>
          <div>
            <p className="font-bold text-text-primary">My Orders</p>
            <p className="text-sm text-text-secondary">Track your purchases</p>
          </div>
        </Link>

        <Link
          href="/wishlist"
          className="flex items-center gap-3 rounded-card border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF7A6B]/10 text-[#FF7A6B]">
            <Heart size={20} />
          </span>
          <div>
            <p className="font-bold text-text-primary">My Wishlist</p>
            <p className="text-sm text-text-secondary">Items you saved</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
