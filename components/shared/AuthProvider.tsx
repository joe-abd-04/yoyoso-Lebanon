"use client";

// Real Supabase auth session for the client tree, replacing the old demo
// localStorage flag (components/shared/useAuth.ts).
//
// The session is resolved on the client via supabase.auth.onAuthStateChange,
// which keeps the root layout (and the whole catalog) statically renderable —
// reading auth cookies in the server layout would force every page to become
// dynamic. Server components that truly need the user (e.g. /account) call
// getCurrentUser() themselves. The header already resolved login state on the
// client before this change, so the UX is unchanged.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  /** Whether the current user is a store admin (read from their own profile). */
  isAdmin: boolean;
  /** False once the initial session has been resolved on the client. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange fires INITIAL_SESSION asynchronously on subscribe, then
    // again on sign-in/out/token-refresh. setState here is inside an async event
    // callback (not the synchronous effect body), so it's allowed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);

      // Resolve admin status via the public.is_admin() SECURITY DEFINER RPC.
      // This bypasses RLS entirely and returns the caller's is_admin flag from
      // profiles. Only decides whether to SHOW admin links — every /admin route
      // and write is still gated server-side.
      if (nextUser) {
        supabase
          .rpc("is_admin")
          .then(({ data, error }) => {
            if (error) console.error("[AuthProvider] is_admin RPC:", error.message);
            setIsAdmin(data === true);
          });
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // onAuthStateChange will clear `user`.
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** The current authenticated user, or null. */
export function useAuthUser(): User | null {
  return useContext(AuthContext).user;
}

/** Whether the current user is a store admin (for conditional UI only). */
export function useIsAdmin(): boolean {
  return useContext(AuthContext).isAdmin;
}

/** True once a session is confirmed present. */
export function useIsLoggedIn(): boolean {
  return useContext(AuthContext).user !== null;
}

/** Whether the initial client-side session check is still in flight. */
export function useAuthLoading(): boolean {
  return useContext(AuthContext).loading;
}

/** Sign the current user out (clears the Supabase session cookies). */
export function useSignOut(): () => Promise<void> {
  return useContext(AuthContext).signOut;
}
