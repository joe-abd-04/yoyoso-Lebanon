"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSignOut } from "@/components/shared/AuthProvider";
import { useUIStore } from "@/store/uiStore";

export default function SignOutButton() {
  const router = useRouter();
  const signOut = useSignOut();
  const showToast = useUIStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    await signOut();
    showToast("Signed out. See you soon!", "info");
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex items-center justify-center gap-2 rounded-button border border-border bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface disabled:opacity-70"
    >
      <LogOut size={16} />
      {busy ? "Signing out…" : "Sign Out"}
    </button>
  );
}
