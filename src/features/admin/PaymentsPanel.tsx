import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReceiptPreviewDialog } from "@/components/ReceiptPreviewDialog";
import { useI18n } from "@/lib/i18n";

type Tab = "pending" | "approved" | "rejected";

type PaymentRowT = {
  id: string; full_name: string; email: string; phone: string | null; amount: number;
  transaction_number: string; payment_date: string; receipt_file_url: string;
  status: string; admin_notes: string | null; created_at: string;
  payment_method?: "edahabia" | "baridimob" | null;
  payment_ref?: string | null;
};

type SubRow = { id: string; student_id: string; status: string; start_date: string; end_date: string; created_at: string };

type SubEnrichedRow = SubRow & {
  full_name: string | null;
  email: string | null;
  payment_ref: string | null;
};

type SortKey = "name" | "start" | "end" | "status";

const METHOD_LABEL: Record<string, string> = { edahabia: "💳 Edahabia", baridimob: "📱 BaridiMob" };
const PAY_LOCALE = (lang: string) => (lang === "ar" ? "ar-DZ" : lang);

export function PaymentsPanel() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "edahabia" | "baridimob">("all");
  const [subSearch, setSubSearch] = useState("");
  const [subSort, setSubSort] = useState<SortKey>("start");
  const [subSortDir, setSubSortDir] = useState<"asc" | "desc">("desc");
  const qc = useQueryClient();

  const { data: payments } = useQuery({
    queryKey: ["admin-payments", tab],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      return (data ?? []) as PaymentRowT[];
    },
  });

  const { data: allPayments } = useQuery({
    queryKey: ["admin-payments-all"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("id,status,amount,created_at,approved_at,payment_method").order("created_at", { ascending: false });
      return (data ?? []) as Array<Pick<PaymentRowT, "id" | "status" | "amount" | "created_at" | "payment_method"> & { approved_at: string | null }>;
    },
  });

  const { data: subs } = useQuery({
    queryKey: ["admin-subscriptions-all"],
    queryFn: async () => {
      const { data: subsData } = await supabase
        .from("subscriptions")
        .select("id,student_id,status,start_date,end_date,created_at,payment_id")
        .order("created_at", { ascending: false });
      const rows = (subsData ?? []) as Array<SubRow & { payment_id: string | null }>;
      const studentIds = Array.from(new Set(rows.map((r) => r.student_id)));
      const paymentIds = Array.from(
        new Set(rows.map((r) => r.payment_id).filter((v): v is string => !!v)),
      );
      const [profilesRes, paymentsRes] = await Promise.all([
        studentIds.length
          ? supabase.from("profiles").select("id,full_name,email").in("id", studentIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
        paymentIds.length
          ? supabase.from("payments").select("id,payment_ref").in("id", paymentIds)
          : Promise.resolve({ data: [] as { id: string; payment_ref: string | null }[] }),
      ]);
      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
      const paymentMap = new Map((paymentsRes.data ?? []).map((p) => [p.id, p]));
      return rows.map<SubEnrichedRow>((r) => {
        const prof = profileMap.get(r.student_id);
        const pay = r.payment_id ? paymentMap.get(r.payment_id) : undefined;
        return {
          ...r,
          full_name: prof?.full_name ?? null,
          email: prof?.email ?? null,
          payment_ref: pay?.payment_ref ?? null,
        };
      });
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "approved" | "rejected"; notes?: string }) => {
      const { error } = await supabase.from("payments").update({ status, admin_notes: notes ?? null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-payments-all"] });
      qc.invalidateQueries({ queryKey: ["admin-subscriptions-all"] });
      toast.success(t("a.payments.status_updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const extendSub = useMutation({
    mutationFn: async (sub: SubEnrichedRow) => {
      const newEnd = new Date(Math.max(new Date(sub.end_date).getTime(), Date.now()) + 30 * 86400000).toISOString();
      const { error } = await supabase
        .from("subscriptions")
        .update({ end_date: newEnd, status: "active" })
        .eq("id", sub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions-all"] });
      toast.success(t("a.payments.sub_extended"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelSub = useMutation({
    mutationFn: async (sub: SubEnrichedRow) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", sub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions-all"] });
      toast.success(t("a.payments.sub_cancelled"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (payments ?? []).filter((p) => {
    if (methodFilter !== "all" && p.payment_method !== methodFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.transaction_number?.includes(search);
  });

  const stats = useMemo(() => computeStats(allPayments ?? [], subs ?? []), [allPayments, subs]);

  const displaySubs = useMemo<SubEnrichedRow[]>(() => {
    const rows = subs ?? [];
    const q = subSearch.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (s) =>
            (s.full_name ?? "").toLowerCase().includes(q) ||
            (s.email ?? "").toLowerCase().includes(q) ||
            (s.payment_ref ?? "").toLowerCase().includes(q),
        )
      : rows;
    const dir = subSortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      switch (subSort) {
        case "name":
          return ((a.full_name ?? a.email ?? "") > (b.full_name ?? b.email ?? "") ? 1 : -1) * dir;
        case "status":
          return (a.status > b.status ? 1 : -1) * dir;
        case "end":
          return (new Date(a.end_date).getTime() - new Date(b.end_date).getTime()) * dir;
        case "start":
        default:
          return (new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) * dir;
      }
    });
    return sorted;
  }, [subs, subSearch, subSort, subSortDir]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary mb-3">{t("a.payments.title")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon="⏳" label={t("a.payments.pending")} value={stats.pending} accent="amber" />
          <Stat icon="✅" label={t("a.payments.approved_today")} value={stats.approvedToday} accent="green" />
          <Stat icon="💰" label={t("a.payments.revenue_month")} value={`${stats.revenueMonth.toLocaleString(PAY_LOCALE(lang))} DZD`} accent="primary" />
          <Stat icon="👥" label={t("a.payments.active_subs")} value={stats.activeSubs} accent="primary" />
          <Stat icon="⚠️" label={t("a.payments.expiring_soon")} value={stats.expiringSoon} accent="red" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title={t("a.payments.chart.revenue")}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.revenue6m}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="m" fontSize={11} />
              <YAxis fontSize={11} width={50} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#5A436F" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("a.payments.chart.subs")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.subs6m}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="m" fontSize={11} />
              <YAxis fontSize={11} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="new" name={t("a.payments.chart.new")} fill="#5A436F" radius={[6, 6, 0, 0]} />
              <Bar dataKey="renew" name={t("a.payments.chart.renew")} fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-1 p-1 bg-muted rounded-full text-sm overflow-x-auto no-scrollbar">
          {(["pending", "approved", "rejected"] as Tab[]).map((s) => (
            <button key={s} onClick={() => setTab(s)} className={`shrink-0 px-4 py-1.5 rounded-full ${tab === s ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>
              {s === "pending" ? t("a.payments.tab.pending") : s === "approved" ? t("a.payments.tab.approved") : t("a.payments.tab.rejected")}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)} className="flex-1 md:flex-none px-3 py-2 min-h-11 rounded-full border border-border bg-background text-sm">
            <option value="all">{t("a.payments.method.all")}</option>
            <option value="edahabia">Edahabia</option>
            <option value="baridimob">BaridiMob</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("a.payments.search_placeholder")} className="w-full md:w-72 max-w-full px-4 py-2 min-h-11 rounded-full border border-border bg-background text-sm" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="text-right p-3">{t("a.payments.table.student")}</th>
              <th className="text-right p-3">{t("a.payments.table.amount")}</th>
              <th className="text-right p-3">{t("a.payments.table.method")}</th>
              <th className="text-right p-3">{t("a.payments.table.qr_ref")}</th>
              <th className="text-right p-3">{t("a.payments.table.transaction_number")}</th>
              <th className="text-right p-3">{t("a.payments.table.date")}</th>
              <th className="text-right p-3">{t("a.payments.table.receipt")}</th>
              <th className="text-right p-3">{t("a.payments.table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => <PaymentRow key={p.id} payment={p} onReview={(status, notes) => review.mutate({ id: p.id, status, notes })} />)}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-muted-foreground py-8">{t("a.payments.no_requests")}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold text-primary text-sm">{t("a.payments.subs.title")}</h3>
          <span className="text-xs text-muted-foreground">{t("a.payments.subs.count", { shown: displaySubs.length, total: (subs ?? []).length })}</span>
        </div>
        <div className="px-4 py-3 border-b border-border flex flex-col md:flex-row md:items-center gap-2">
          <input
            value={subSearch}
            onChange={(e) => setSubSearch(e.target.value)}
            placeholder={t("a.payments.subs.search_placeholder")}
            className="flex-1 px-4 py-2 min-h-11 rounded-full border border-border bg-background text-sm"
            aria-label={t("a.payments.subs.search_aria")}
          />
          <select
            value={subSort}
            onChange={(e) => setSubSort(e.target.value as SortKey)}
            className="px-3 py-2 min-h-11 rounded-full border border-border bg-background text-sm"
            aria-label={t("a.payments.subs.sort_by")}
          >
            <option value="name">{t("a.payments.subs.sort.name")}</option>
            <option value="start">{t("a.payments.subs.sort.start")}</option>
            <option value="end">{t("a.payments.subs.sort.end")}</option>
            <option value="status">{t("a.payments.subs.sort.status")}</option>
          </select>
          <button
            type="button"
            onClick={() => setSubSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="px-3 py-2 min-h-11 rounded-full border border-border bg-background text-sm"
            aria-label={t("a.payments.subs.reverse_dir")}
          >
            {subSortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs">
              <tr>
                <th className="text-right p-3">{t("a.payments.subs.table.student")}</th>
                <th className="text-right p-3">{t("a.payments.subs.table.email")}</th>
                <th className="text-right p-3">{t("a.payments.subs.table.payment_ref")}</th>
                <th className="text-right p-3">{t("a.payments.subs.table.status")}</th>
                <th className="text-right p-3">{t("a.payments.subs.table.starts")}</th>
                <th className="text-right p-3">{t("a.payments.subs.table.ends")}</th>
                <th className="text-right p-3">{t("a.payments.subs.table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displaySubs.slice(0, 100).map((s) => {
                const expired = new Date(s.end_date) < new Date();
                const name = s.full_name || s.email || t("a.payments.subs.unknown_student");
                return (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="p-3 font-semibold text-primary">{name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{s.email ?? "—"}</td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{s.payment_ref ?? "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === "active" && !expired ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                        s.status === "cancelled" ? "bg-muted text-muted-foreground" :
                        "bg-red-500/15 text-red-700 dark:text-red-400"
                      }`}>{expired && s.status === "active" ? "expired" : s.status}</span>
                    </td>
                    <td className="p-3 text-xs">{new Date(s.start_date).toLocaleDateString(PAY_LOCALE(lang))}</td>
                    <td className="p-3 text-xs">{new Date(s.end_date).toLocaleDateString(PAY_LOCALE(lang))}</td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => extendSub.mutate(s)}
                          disabled={extendSub.isPending}
                          className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                        >
                          {t("a.payments.subs.extend_30")}
                        </button>
                        {s.status === "active" && (
                          <button
                            onClick={() => { if (confirm(t("a.payments.subs.cancel_confirm"))) cancelSub.mutate(s); }}
                            disabled={cancelSub.isPending}
                            className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {t("a.payments.subs.cancel")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displaySubs.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-8">{t("a.payments.subs.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-border">
          {displaySubs.slice(0, 100).map((s) => {
            const expired = new Date(s.end_date) < new Date();
            const name = s.full_name || s.email || t("a.payments.subs.unknown_student");
            return (
              <div key={s.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-primary truncate">{name}</div>
                    {s.email && <div className="text-xs text-muted-foreground truncate">{s.email}</div>}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    s.status === "active" && !expired ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                    s.status === "cancelled" ? "bg-muted text-muted-foreground" :
                    "bg-red-500/15 text-red-700 dark:text-red-400"
                  }`}>{expired && s.status === "active" ? "expired" : s.status}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono break-all">{s.payment_ref ?? "—"}</div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t("a.payments.subs.starts_label", { date: new Date(s.start_date).toLocaleDateString(PAY_LOCALE(lang)) })}</span>
                  <span>{t("a.payments.subs.ends_label", { date: new Date(s.end_date).toLocaleDateString(PAY_LOCALE(lang)) })}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => extendSub.mutate(s)}
                    disabled={extendSub.isPending}
                    className="flex-1 min-h-11 px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                  >
                    {t("a.payments.subs.extend_30")}
                  </button>
                  {s.status === "active" && (
                    <button
                      onClick={() => { if (confirm(t("a.payments.subs.cancel_confirm"))) cancelSub.mutate(s); }}
                      disabled={cancelSub.isPending}
                      className="flex-1 min-h-11 px-3 rounded-full bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                    >
                      {t("a.payments.subs.cancel")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {displaySubs.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">{t("a.payments.subs.empty")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: string; label: string; value: number | string; accent: "amber" | "green" | "primary" | "red" }) {
  const colors = {
    amber: "from-amber-500/10 to-amber-500/0 border-amber-500/30 text-amber-700 dark:text-amber-400",
    green: "from-green-500/10 to-green-500/0 border-green-500/30 text-green-700 dark:text-green-400",
    primary: "from-primary/10 to-primary/0 border-primary/30 text-primary",
    red: "from-red-500/10 to-red-500/0 border-red-500/30 text-red-700 dark:text-red-400",
  }[accent];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl border bg-gradient-to-br ${colors} shadow-soft`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-[11px] font-medium text-muted-foreground mt-1">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </motion.div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
      <h3 className="font-bold text-primary text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

function computeStats(payments: Array<{ status: string; amount: number; created_at: string; approved_at?: string | null }>, subs: SubRow[]) {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in7d = new Date(now.getTime() + 7 * 86400000);

  const pending = payments.filter((p) => p.status === "pending").length;
  const approvedToday = payments.filter((p) => p.status === "approved" && p.approved_at && new Date(p.approved_at) >= startOfDay).length;
  const revenueMonth = payments
    .filter((p) => p.status === "approved" && p.approved_at && new Date(p.approved_at) >= startOfMonth)
    .reduce((acc, p) => acc + Number(p.amount ?? 0), 0);

  const activeSubs = subs.filter((s) => s.status === "active" && new Date(s.end_date) >= now).length;
  const expiringSoon = subs.filter((s) => s.status === "active" && new Date(s.end_date) <= in7d && new Date(s.end_date) >= now).length;

  // 6-month buckets
  const months: { key: string; label: string; date: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(lang, { month: "short" }), date: d });
  }
  const revenue6m = months.map((m) => {
    const next = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 1);
    const r = payments.filter((p) => p.status === "approved" && p.approved_at && new Date(p.approved_at) >= m.date && new Date(p.approved_at) < next).reduce((a, p) => a + Number(p.amount ?? 0), 0);
    return { m: m.label, revenue: r };
  });

  // new vs renewals per month: first subscription per student = new, subsequent = renew
  const subsByStudent = new Map<string, SubRow[]>();
  for (const s of subs) {
    const arr = subsByStudent.get(s.student_id) ?? [];
    arr.push(s); subsByStudent.set(s.student_id, arr);
  }
  for (const [, arr] of subsByStudent) arr.sort((a, b) => a.created_at.localeCompare(b.created_at));

  const subs6m = months.map((m) => {
    const next = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 1);
    let n = 0, rn = 0;
    for (const arr of subsByStudent.values()) {
      for (let i = 0; i < arr.length; i++) {
        const c = new Date(arr[i].created_at);
        if (c >= m.date && c < next) { if (i === 0) n++; else rn++; }
      }
    }
    return { m: m.label, new: n, renew: rn };
  });

  return { pending, approvedToday, revenueMonth, activeSubs, expiringSoon, revenue6m, subs6m };
}

function PaymentRow({ payment, onReview }: { payment: PaymentRowT; onReview: (status: "approved" | "rejected", notes?: string) => void }) {
  const { t, lang } = useI18n();
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");

  return (
    <>
      <tr className="hover:bg-muted/30">
        <td className="p-3">
          <div className="font-semibold text-primary">{payment.full_name}</div>
          <div className="text-xs text-muted-foreground">{payment.email}{payment.phone ? ` · ${payment.phone}` : ""}</div>
        </td>
        <td className="p-3 font-mono font-bold text-gold">{payment.amount} DZD</td>
        <td className="p-3 text-xs">{METHOD_LABEL[payment.payment_method ?? "edahabia"] ?? "—"}</td>
        <td className="p-3 font-mono text-[11px] text-muted-foreground" title={payment.payment_ref ?? ""}>{payment.payment_ref ? payment.payment_ref.slice(0, 22) + "…" : "—"}</td>
        <td className="p-3 font-mono">{payment.transaction_number}</td>
        <td className="p-3 text-xs">{new Date(payment.payment_date).toLocaleDateString(PAY_LOCALE(lang))}</td>
        <td className="p-3">
          <button
            type="button"
            onClick={() => setShowReceipt(true)}
            className="text-primary underline text-xs min-h-11 px-2"
            aria-label={t("a.payments.preview_receipt")}
          >
            {t("a.payments.preview_receipt")}
          </button>
        </td>
        <td className="p-3">
          {payment.status === "pending" ? (
            <div className="flex gap-1.5">
              <button onClick={() => onReview("approved")} className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold">{t("a.payments.approve")}</button>
              <button onClick={() => setShowReject(true)} className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">{t("a.payments.reject")}</button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">{payment.admin_notes ?? "—"}</div>
          )}
        </td>
      </tr>
      <ReceiptPreviewDialog
        open={showReceipt}
        onOpenChange={setShowReceipt}
        receiptPath={payment.receipt_file_url}
        title={t("a.payments.receipt_title", { name: payment.full_name })}
      />
      {showReject && (
        <tr><td colSpan={7}>
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setShowReject(false)}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-primary mb-3">{t("a.payments.reject_reason_title")}</h3>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder={t("a.payments.reject_reason_placeholder")} />
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={() => setShowReject(false)} className="px-4 py-2 rounded-full bg-muted text-xs">{t("a.payments.subs.cancel")}</button>
                <button onClick={() => { onReview("rejected", notes); setShowReject(false); }} className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold">{t("a.payments.confirm_reject")}</button>
              </div>
            </div>
          </div>
        </td></tr>
      )}
    </>
  );
}