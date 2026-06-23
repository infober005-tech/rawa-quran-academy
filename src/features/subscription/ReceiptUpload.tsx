import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PAYMENT_METHODS, type PaymentMethod } from "@/hooks/use-subscription";
import { compressImageFile } from "@/lib/payment-pdf";
import { sha256Hex, checkRateLimit, notifyWhatsApp, type QrPayload } from "@/lib/qr-payment";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  transaction_number: z.string().trim().min(3).max(60),
  amount: z.coerce.number().positive().max(1000000),
  payment_date: z.string().min(8),
});

export function ReceiptUpload({ qrPayload, onSubmitted }: { qrPayload: QrPayload | null; onSubmitted: () => void }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("edahabia");
  const [zoomed, setZoomed] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/jpeg": [], "image/png": [], "application/pdf": [] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDrop: (accepted) => {
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
      else setPreview(null);
    },
  });

  const submit = useMutation({
    mutationFn: async (form: FormData) => {
      if (!file) throw new Error("يرجى إرفاق صورة الوصل");
      // Rate limit: max one attempt / 60s
      const allowed = await checkRateLimit(user!.id);
      if (!allowed) throw new Error("لقد أرسلت طلبًا قبل قليل. يرجى الانتظار دقيقة قبل المحاولة مجددًا.");
      const data = schema.parse({
        full_name: form.get("full_name"),
        email: form.get("email"),
        phone: form.get("phone"),
        transaction_number: form.get("transaction_number"),
        amount: form.get("amount"),
        payment_date: form.get("payment_date"),
      });
      setProgress(10);
      const compressed = await compressImageFile(file);
      // Duplicate-receipt protection via SHA-256 of compressed bytes
      const receiptHash = await sha256Hex(compressed);
      const { data: dup } = await supabase
        .from("payments")
        .select("id")
        .eq("receipt_sha256", receiptHash)
        .limit(1)
        .maybeSingle();
      if (dup) throw new Error("هذا الوصل تم رفعه مسبقًا. يرجى إرفاق وصل دفع جديد.");
      const ext = compressed.name.split(".").pop() ?? "bin";
      const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      setProgress(30);
      const up = await supabase.storage.from("payment-receipts").upload(path, compressed, { upsert: false });
      if (up.error) throw up.error;
      setProgress(70);
      const { error } = await supabase.from("payments").insert({
        student_id: user!.id,
        ...data,
        payment_method: method,
        receipt_file_url: path,
        receipt_sha256: receiptHash,
        payment_ref: qrPayload?.ref ?? null,
        qr_token: qrPayload?.token ?? null,
        qr_payload: qrPayload ? (qrPayload as unknown as Record<string, unknown>) : null,
        qr_expires_at: qrPayload?.expiresAt ?? null,
      });
      if (error) throw error;
      // Stub: optional WhatsApp notification (no-op until provider wired)
      void notifyWhatsApp({ to: data.phone, template: "payment_submitted", data: { ref: qrPayload?.ref, amount: data.amount } });
      setProgress(100);
    },
    onSuccess: () => {
      toast.success("تم إرسال طلب الاشتراك بنجاح");
      qc.invalidateQueries({ queryKey: ["my-payments", user?.id] });
      qc.invalidateQueries({ queryKey: ["subscription", user?.id] });
      onSubmitted();
    },
    onError: (e: Error) => { toast.error(e.message); setProgress(0); },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit.mutate(new FormData(e.currentTarget)); }} className="p-6 rounded-3xl bg-card border border-border shadow-soft space-y-4">
      <h3 className="font-bold text-primary text-lg">رفع وصل الدفع</h3>
      <div>
        <div className="text-xs font-semibold text-muted-foreground mb-2">طريقة الدفع المستخدمة</div>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button type="button" key={m.id} onClick={() => setMethod(m.id)}
              className={`p-3 rounded-2xl border-2 text-start transition ${method === m.id ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"}`}>
              <div className="flex items-center gap-2 font-bold text-sm text-primary"><span className="text-xl">{m.icon}</span>{m.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{m.hint}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field name="full_name" label="الاسم الكامل" defaultValue={profile?.full_name ?? ""} required />
        <Field name="email" type="email" label="البريد الإلكتروني" defaultValue={profile?.email ?? ""} required />
        <Field name="phone" label="رقم الهاتف" defaultValue={profile?.phone ?? ""} required />
        <Field name="transaction_number" label="رقم العملية" required />
        <Field name="amount" type="number" step="0.01" label="المبلغ المدفوع (دج)" required />
        <Field name="payment_date" type="date" label="تاريخ الدفع" required />
      </div>

      <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${isDragActive ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"}`}>
        <input {...getInputProps()} />
        {file ? (
          <div className="space-y-2">
            {preview ? (
              <img src={preview} alt="" onClick={(e) => { e.stopPropagation(); setZoomed(true); }} className="max-h-40 mx-auto rounded-xl cursor-zoom-in" />
            ) : <div className="text-4xl">📄</div>}
            <div className="text-sm font-semibold text-primary">{file.name}</div>
            <div className="flex justify-center gap-3 text-xs">
              {preview && <button type="button" onClick={(e) => { e.stopPropagation(); setZoomed(true); }} className="text-primary underline">تكبير الصورة</button>}
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} className="text-red-500 underline">إزالة</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <div className="text-3xl mb-2">📤</div>
            اسحب وأفلت ملف الوصل هنا أو انقر للاختيار (JPG / PNG / PDF · حتى 5MB)
          </div>
        )}
      </div>

      {progress > 0 && progress < 100 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-royal" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
        </div>
      )}

      <button disabled={submit.isPending || !file} className="w-full py-3 rounded-full bg-gradient-royal text-primary-foreground font-bold shadow-glow disabled:opacity-50">
        {submit.isPending ? "جاري الإرسال…" : "إرسال طلب الاشتراك"}
      </button>

      {zoomed && preview && (
        <div onClick={() => setZoomed(false)} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out">
          <img src={preview} alt="" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </form>
  );
}

function Field({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input {...rest} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
    </label>
  );
}