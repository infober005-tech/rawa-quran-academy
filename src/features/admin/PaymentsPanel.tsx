import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "pending" | "approved" | "rejected";

export function PaymentsPanel() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: payments } = useQuery({
    queryKey: ["admin-payments", tab],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "approved" | "rejected"; notes?: string }) => {
      const { error } = await supabase.from("payments").update({ status, admin_notes: notes ?? null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success("تم تحديث الحالة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (payments ?? []).filter((p) =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()) || p.transaction_number?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-muted rounded-full text-sm">
          {(["pending", "approved", "rejected"] as Tab[]).map((s) => (
            <button key={s} onClick={() => setTab(s)} className={`px-4 py-1.5 rounded-full ${tab === s ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>
              {s === "pending" ? "قيد المراجعة" : s === "approved" ? "موافق عليها" : "مرفوضة"}
            </button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث (اسم، بريد، رقم العملية)…" className="px-4 py-2 rounded-full border border-border bg-background text-sm w-72" />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="text-right p-3">الطالب</th>
              <th className="text-right p-3">المبلغ</th>
              <th className="text-right p-3">رقم العملية</th>
              <th className="text-right p-3">التاريخ</th>
              <th className="text-right p-3">الوصل</th>
              <th className="text-right p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => <PaymentRow key={p.id} payment={p} onReview={(status, notes) => review.mutate({ id: p.id, status, notes })} />)}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-8">لا توجد طلبات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentRow({ payment, onReview }: { payment: { id: string; full_name: string; email: string; phone: string | null; amount: number; transaction_number: string; payment_date: string; receipt_file_url: string; status: string; admin_notes: string | null; created_at: string }; onReview: (status: "approved" | "rejected", notes?: string) => void }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");

  const openReceipt = async () => {
    const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(payment.receipt_file_url, 60 * 10);
    if (data?.signedUrl) { setReceiptUrl(data.signedUrl); setShowReceipt(true); }
  };

  return (
    <>
      <tr className="hover:bg-muted/30">
        <td className="p-3">
          <div className="font-semibold text-primary">{payment.full_name}</div>
          <div className="text-xs text-muted-foreground">{payment.email}{payment.phone ? ` · ${payment.phone}` : ""}</div>
        </td>
        <td className="p-3 font-mono font-bold text-gold">{payment.amount} DZD</td>
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
        <tr><td colSpan={6}>
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setShowReceipt(false)}>
            <div className="bg-card rounded-2xl p-4 max-w-3xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              {receiptUrl.toLowerCase().includes(".pdf") ? (
                <iframe src={receiptUrl} className="w-[80vw] h-[80vh] rounded-xl" />
              ) : (
                <img src={receiptUrl} alt="" className="max-w-full max-h-[80vh] rounded-xl" />
              )}
              <div className="mt-3 flex gap-2 justify-end">
                <a href={receiptUrl} download className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold">تنزيل</a>
                <button onClick={() => setShowReceipt(false)} className="px-4 py-2 rounded-full bg-muted text-xs">إغلاق</button>
              </div>
            </div>
          </div>
        </td></tr>
      )}
      {showReject && (
        <tr><td colSpan={6}>
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