// SERVER-ONLY data access for the admin Settings screen.
// Uses the service-role server client, so import ONLY from Server Components /
// Server Actions inside /admin (gated by requireAdmin()).

import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export interface AdminListItem {
  id: string;
  email: string;
  fullName: string | null;
}

/** Everyone with is_admin = true, so admins can see who has access. */
export async function listAdmins(): Promise<AdminListItem[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_admin", true)
      .order("email", { ascending: true });

    if (error) {
      console.error("[listAdmins]", error.message);
      return [];
    }
    return (data ?? []).map((p: Profile) => ({
      id: p.id,
      email: p.email ?? "",
      fullName: p.full_name,
    }));
  } catch (err) {
    console.error("[listAdmins] unexpected", err);
    return [];
  }
}
