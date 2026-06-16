import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Subscription = {
  id: string;
  student_id: string;
  status: "pending" | "active" | "expired" | "rejected" | "cancelled";
  start_date: string;
  end_date: string;
  payment_id: string | null;
};

export function useSubscription(userId?: string) {
  const { user } = useAuth();
  const uid = userId ?? user?.id;
  const q = useQuery({
    queryKey: ["subscription", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("student_id", uid!)
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as Subscription | null) ?? null;
    },
  });
  const sub = q.data;
  const now = new Date();
  const isActive = !!sub && sub.status === "active" && new Date(sub.end_date) >= now;
  const daysRemaining = sub ? Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - now.getTime()) / 86400000)) : 0;
  return { subscription: sub, isActive, daysRemaining, loading: q.isLoading, refetch: q.refetch };
}

export function usePaymentSettings() {
  return useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });
}

export function useMyPayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export type PaymentMethod = "edahabia" | "baridimob";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; hint: string }[] = [
  { id: "edahabia", label: "البطاقة الذهبية Edahabia", icon: "💳", hint: "ادفع مباشرة عبر بطاقة Edahabia في أي موزع آلي أو عبر الإنترنت." },
  { id: "baridimob", label: "BaridiMob", icon: "📱", hint: "افتح تطبيق BaridiMob واختر تحويل إلى رقم CCP أعلاه." },
];