import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReceiptPreviewDialog } from "@/components/ReceiptPreviewDialog";

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

export function PaymentsPanel() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "edahabia" | "baridimob">("all");
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
      const { data } = await supabase.from("subscriptions").select("id,student_id,status,start_date,end_date,created_at").order("created_at", { ascending: false });
      return (data ?? []) as SubRow[];
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
      toast.success("تم تحديث الحالة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const extendSub = useMutation({
    mutationFn: async (sub: SubRow) => {
      const newEnd = new Date(Math.max(new Date(sub.end_date).getTime(), Date.now()) + 30 * 86400000).toISOString();
      const { error } = await supabase
        .from("subscriptions")
        .update({ end_date: newEnd, status: "active" })
        .eq("id", sub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions-all"] });
      toast.success("تم تمديد الاشتراك");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelSub = useMutation({
    mutationFn: async (sub: SubRow) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", sub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions-all"] });
      toast.success("تم إلغاء الاشتراك");
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary mb-3">مركز المدفوعات</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon="⏳" label="قيد المراجعة" value={stats.pending} accent="amber" />
          <Stat icon="✅" label="مقبولة اليوم" value={stats.approvedToday} accent="green" />
          <Stat icon="💰" label="إيرادات الشهر" value={`${stats.revenueMonth.toLocaleString("ar-DZ")} دج`} accent="primary" />
          <Stat icon="👥" label="مشتركون نشطون" value={stats.activeSubs} accent="primary" />
          <Stat icon="⚠️" label="تنتهي قريبًا (7 أيام)" value={stats.expiringSoon} accent="red" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="📈 الإيرادات الشهرية (آخر 6 أشهر)">
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
        <ChartCard title="👥 مشتركون جدد ومُجددون (آخر 6 أشهر)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.subs6m}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="m" fontSize={11} />
              <YAxis fontSize={11} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="new" name="جدد" fill="#5A436F" radius={[6, 6, 0, 0]} />
              <Bar dataKey="renew" name="تجديدات" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-1 p-1 bg-muted rounded-full text-sm overflow-x-auto no-scrollbar">
          {(["pending", "approved", "rejected"] as Tab[]).map((s) => (
            <button key={s} onClick={() => setTab(s)} className={`shrink-0 px-4 py-1.5 rounded-full ${tab === s ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>
              {s === "pending" ? "قيد المراجعة" : s === "approved" ? "موافق عليها" : "مرفوضة"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)} className="flex-1 md:flex-none px-3 py-2 min-h-11 rounded-full border border-border bg-background text-sm">
            <option value="all">كل الطرق</option>
            <option value="edahabia">Edahabia</option>
            <option value="baridimob">BaridiMob</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث (اسم، بريد، رقم العملية)…" className="w-full md:w-72 max-w-full px-4 py-2 min-h-11 rounded-full border border-border bg-background text-sm" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="text-right p-3">الطالب</th>
              <th className="text-right p-3">المبلغ</th>
              <th className="text-right p-3">الطريقة</th>
              <th className="text-right p-3">مرجع QR</th>
              <th className="text-right p-3">رقم العملية</th>
              <th className="text-right p-3">التاريخ</th>
              <th className="text-right p-3">الوصل</th>
              <th className="text-right p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => <PaymentRow key={p.id} payment={p} onReview={(status, notes) => review.mutate({ id: p.id, status, notes })} />)}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-muted-foreground py-8">لا توجد طلبات</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
          <h3 className="font-bold text-primary text-sm">إدارة الاشتراكات</h3>
          <span className="text-xs text-muted-foreground">{(subs ?? []).length} سجل</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs">
              <tr>
                <th className="text-right p-3">الطالب</th>
                <th className="text-right p-3">الحالة</th>
                <th className="text-right p-3">يبدأ</th>
                <th className="text-right p-3">ينتهي</th>
                <th className="text-right p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(subs ?? []).slice(0, 30).map((s) => {
                const expired = new Date(s.end_date) < new Date();
                return (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.student_id.slice(0, 8)}…</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === "active" && !expired ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                        s.status === "cancelled" ? "bg-muted text-muted-foreground" :
                        "bg-red-500/15 text-red-700 dark:text-red-400"
                      }`}>{expired && s.status === "active" ? "expired" : s.status}</span>
                    </td>
                    <td className="p-3 text-xs">{new Date(s.start_date).toLocaleDateString("ar")}</td>
                    <td className="p-3 text-xs">{new Date(s.end_date).toLocaleDateString("ar")}</td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => extendSub.mutate(s)}
                          disabled={extendSub.isPending}
                          className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                        >
                          تمديد 30 يوم
                        </button>
                        {s.status === "active" && (
                          <button
                            onClick={() => { if (confirm("إلغاء الاشتراك؟")) cancelSub.mutate(s); }}
                            disabled={cancelSub.isPending}
                            className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!subs || subs.length === 0) && (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-8">لا توجد اشتراكات</td></tr>
              )}
            </tbody>
          </table>
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
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("ar", { month: "short" }), date: d });
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
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");
  const [zoom, setZoom] = useState(1);

  const openReceipt = async () => {
    const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(payment.receipt_file_url, 60 * 10);
    if (data?.signedUrl) { setReceiptUrl(data.signedUrl); setShowReceipt(true); setZoom(1); }
  };

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
        <td className="p-3 text-xs">{new Date(payment.payment_date).toLocaleDateString("ar")}</td>
        <td className="p-3"><button onClick={openReceipt} className="text-primary underline text-xs">عرض</button></td>
        <td className="p-3">
          {payment.status === "pending" ? (
            <div className="flex gap-1.5">
              <button onClick={() => onReview("approved")} className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold">قبول</button>
              <button onClick={() => setShowReject(true)} className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">رفض</button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">{payment.admin_notes ?? "—"}</div>
          )}
        </td>
      </tr>
      {showReceipt && receiptUrl && (
        <tr><td colSpan={7}>
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setShowReceipt(false)}>
            <div className="bg-card rounded-2xl p-4 max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              {receiptUrl.toLowerCase().includes(".pdf") ? (
                <iframe src={receiptUrl} className="w-[80vw] h-[80vh] rounded-xl" />
              ) : (
                <div className="overflow-auto max-h-[80vh]">
                  <img src={receiptUrl} alt="" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }} className="max-w-full rounded-xl transition-transform" />
                </div>
              )}
              <div className="mt-3 flex gap-2 justify-end flex-wrap">
                {!receiptUrl.toLowerCase().includes(".pdf") && (
                  <div className="flex items-center gap-1 mr-auto">
                    <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="px-3 py-2 rounded-full bg-muted text-xs font-bold">−</button>
                    <span className="text-xs font-mono px-2">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="px-3 py-2 rounded-full bg-muted text-xs font-bold">+</button>
                  </div>
                )}
                <a href={receiptUrl} download className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold">تنزيل</a>
                <button onClick={() => setShowReceipt(false)} className="px-4 py-2 rounded-full bg-muted text-xs">إغلاق</button>
              </div>
            </div>
          </div>
        </td></tr>
      )}
      {showReject && (
        <tr><td colSpan={7}>
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setShowReject(false)}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-primary mb-3">سبب الرفض</h3>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="اشرح للطالب سبب رفض الطلب…" />
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={() => setShowReject(false)} className="px-4 py-2 rounded-full bg-muted text-xs">إلغاء</button>
                <button onClick={() => { onReview("rejected", notes); setShowReject(false); }} className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold">تأكيد الرفض</button>
              </div>
            </div>
          </div>
        </td></tr>
      )}
    </>
  );
}