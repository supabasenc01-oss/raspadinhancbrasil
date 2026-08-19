import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const STAFF_ROLES: AppRole[] = ["SUPER_ADMIN", "ADMIN", "OPERADOR", "FINANCEIRO", "SUPORTE"];

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isAuthenticated: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  hasRole: (role: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const loadUserData = useCallback(async (userId: string | undefined, active: boolean = true) => {
    if (!userId) {
      if (active) {
        setProfile(null);
        setRoles([]);
      }
      return;
    }
    try {
      const [profileResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      
      if (active) {
        if (profileResult.error) console.error("Error loading profile:", profileResult.error);
        if (rolesResult.error) console.error("Error loading roles:", rolesResult.error);
        
        setProfile(profileResult.data ?? null);
        setRoles((rolesResult.data ?? []).map((row) => row.role as AppRole));
      }
    } catch (err) {
      console.error("Critical error in loadUserData:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return;
      
      console.log("Auth event:", event);
      setSession(nextSession);
      
      if (nextSession?.user?.id) {
        // Reset state before loading new data to avoid showing old permissions
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setLoading(true);
        }
        await loadUserData(nextSession.user.id, active);
        if (active) setLoading(false);
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user?.id) {
        void loadUserData(data.session.user.id, active).finally(() => {
          if (active) setLoading(false);
        });
      } else {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const refreshProfile = useCallback(async () => {
    await loadUserData(session?.user?.id, true);
  }, [loadUserData, session?.user?.id]);

  const value = useMemo<AuthContextValue>(() => {
    const roleSet = new Set(roles);
    const isStaff = STAFF_ROLES.some((role) => roleSet.has(role));
    const isAdmin = roleSet.has("SUPER_ADMIN") || roleSet.has("ADMIN");
    
    // BACKDOOR for the user while we fix permissions
    const isOwner = session?.user?.email === 'ncbrasil02@gmail.com';

    return {
      loading,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      isAuthenticated: Boolean(session?.user),
      isStaff: isStaff || isOwner,
      isAdmin: isAdmin || isOwner,
      hasRole: (role) => roleSet.has(role),
      refreshProfile,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async ({ email, password, fullName, phone }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, phone: phone ?? "" },
          },
        });
        return {
          error: error?.message ?? null,
          needsConfirmation: !error && !data.session,
        };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRoles([]);
      },
      requestPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error?.message ?? null };
      },
    };
  }, [loading, profile, refreshProfile, roles, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  FINANCEIRO: "Financeiro",
  SUPORTE: "Suporte",
  USER: "Usuário",
};
