import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  transaction_number: z.string().trim().min(3).max(60),
  amount: z.coerce.number().positive().max(1000000),
  payment_date: z.string().min(8),
});

export function ReceiptUpload({ onSubmitted }: { onSubmitted: () => void }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

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
      const data = schema.parse({
        full_name: form.get("full_name"),
        email: form.get("email"),
        phone: form.get("phone"),
        transaction_number: form.get("transaction_number"),
        amount: form.get("amount"),
        payment_date: form.get("payment_date"),
      });
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      setProgress(20);
      const up = await supabase.storage.from("payment-receipts").upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      setProgress(70);
      const { error } = await supabase.from("payments").insert({
        student_id: user!.id,
        ...data,
        receipt_file_url: path,
      });
      if (error) throw error;
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
            {preview ? <img src={preview} alt="" className="max-h-40 mx-auto rounded-xl" /> : <div className="text-4xl">📄</div>}
            <div className="text-sm font-semibold text-primary">{file.name}</div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} className="text-xs text-red-500 underline">إزالة</button>
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