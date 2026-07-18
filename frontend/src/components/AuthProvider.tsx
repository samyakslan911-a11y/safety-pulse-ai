"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const AuthCtx = createContext<{ user: User | null }>({ user: null });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session && pathname !== "/login") router.push("/login");
      if (session && pathname === "/login") router.push("/");
    });
    return () => subscription.unsubscribe();
  }, [pathname, router]);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") router.push("/login");
  }, [loading, user, pathname, router]);

  if (loading) return null;
  return <AuthCtx.Provider value={{ user }}>{children}</AuthCtx.Provider>;
}
