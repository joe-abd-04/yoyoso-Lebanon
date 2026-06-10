// SERVER ONLY — admin authorization (Phase 9.5).
//
// This is the single source of truth for "is the current request an admin?".
// Import it ONLY from Server Components, Route Handlers, and Server Actions —
// never from a 'use client' file.
//
// How the check works (defence in depth):
//   1. getCurrentUser() authenticates the request via the user's session cookie
//      (anon key + RLS), so we have a *verified* user id we can trust.
//   2. We then read profiles.is_admin for that id using the SERVICE-ROLE client.
//      Using service role for the read is deliberate: the lookup can't be blocked
//      or spoofed by client-controlled RLS, and there's no chance of an RLS
//      recursion footgun. We only ever read the single row for the verified id.
//
// EVERY /admin route and EVERY admin write must funnel through requireAdmin()
// (or at least getIsAdmin) so authorization is enforced on the server, not by
// hiding UI.

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/supabase/server-auth";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Is the given (already-verified) user id an admin? Wrapped in React.cache so
 * repeated calls within one render/request share a single DB read.
 */
export const getIsAdmin = cache(async (userId: string): Promise<boolean> => {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getIsAdmin] profile lookup error:", error.message);
      return false;
    }
    return data?.is_admin === true;
  } catch (err) {
    console.error("[getIsAdmin] unexpected error:", err);
    return false;
  }
});

/**
 * The current user IF they are a logged-in admin, otherwise null.
 * Use this for conditional UI (e.g. showing an "Admin Panel" link). It never
 * redirects — call requireAdmin() when you need to *gate* a route.
 */
export const getAdminUser = cache(async (): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return (await getIsAdmin(user.id)) ? user : null;
});

/**
 * Gate an admin route. Redirects and never returns for non-admins:
 *   • not logged in        → /login?next=/admin
 *   • logged in, not admin → / (home)
 * Returns the verified admin User on success.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await getIsAdmin(user.id))) redirect("/");
  return user;
}
