"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, Trash2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { addAdmin, removeAdmin } from "@/app/admin/settings/actions";
import type { AdminListItem } from "@/lib/data/admin-settings";
import SettingsCard, {
  fieldClass,
  FieldError,
  FieldLabel,
} from "@/components/admin/settings/SettingsCard";

export default function AdminsManager({
  admins,
  currentUserId,
}: {
  admins: AdminListItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addAdmin({ email });
      if (res.ok) {
        showToast("Admin access granted.", "success");
        setEmail("");
        router.refresh();
      } else {
        setError(res.error);
        showToast(res.error, "error");
      }
    });
  };

  const onRemove = (id: string) => {
    setRemovingId(id);
    startTransition(async () => {
      const res = await removeAdmin({ userId: id });
      if (res.ok) {
        showToast("Admin access removed.", "success");
        router.refresh();
      } else {
        showToast(res.error, "error");
      }
      setRemovingId(null);
    });
  };

  return (
    <SettingsCard
      title="Admins"
      description="People who can access this admin panel. Promote a registered user by email."
      icon={<ShieldCheck size={20} />}
    >
      {/* Current admins */}
      <ul className="divide-y divide-border rounded-card border border-border">
        {admins.length === 0 && (
          <li className="px-4 py-3 text-sm text-text-secondary">
            No admins found.
          </li>
        )}
        {admins.map((a) => {
          const isSelf = a.id === currentUserId;
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {a.email || "(no email)"}
                  {isSelf && (
                    <span className="ml-2 rounded-badge bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                      You
                    </span>
                  )}
                </p>
                {a.fullName && (
                  <p className="truncate text-xs text-text-secondary">
                    {a.fullName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                disabled={isSelf || pending}
                title={
                  isSelf
                    ? "You can't remove your own access"
                    : "Remove admin access"
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                {removingId === a.id ? "Removing…" : "Remove"}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Add admin */}
      <form onSubmit={onAdd} className="mt-5">
        <FieldLabel>Add admin by email</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            maxLength={254}
            className={fieldClass(!!error)}
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            <UserPlus size={16} />
            {pending ? "Adding…" : "Add admin"}
          </button>
        </div>
        <FieldError msg={error} />
        <p className="mt-1.5 text-xs text-text-secondary">
          The person must already have registered an account on the site.
        </p>
      </form>
    </SettingsCard>
  );
}
