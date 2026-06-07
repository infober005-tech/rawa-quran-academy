import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "teacher" | "halaqa_supervisor" | "general_supervisor" | "director";
export type StudentStatus = "pending_review" | "approved" | "rejected" | "suspended";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: "male" | "female" | null;
  status: StudentStatus;
  quran_level: "beginner" | "intermediate" | "advanced" | null;
  avatar_url: string | null;
  language: "ar" | "fr" | "en";
}

type Ctx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

const ROLE_RANK: Record<AppRole, number> = {
  director: 1,
  general_supervisor: 2,
  halaqa_supervisor: 3,
  teacher: 4,
  student: 5,
};

function pickPrimary(roles: AppRole[]): AppRole | null {
  if (!roles.length) return null;
  return [...roles].sort((a, b) => ROLE_RANK[a] - ROLE_RANK[b])[0];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, gender, status, quran_level, avatar_url, language").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((p as Profile) ?? null);
    setRoles((r ?? []).map((x: { role: AppRole }) => x.role));
  };

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer to avoid deadlock
        setTimeout(() => {
          if (mounted) void loadProfile(s.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
      if (event === "INITIAL_SESSION") setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: Ctx = {
    user,
    session,
    profile,
    roles,
    primaryRole: pickPrimary(roles),
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      if (user) await loadProfile(user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}