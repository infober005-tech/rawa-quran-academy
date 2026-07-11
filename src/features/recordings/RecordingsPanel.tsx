import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { useI18n } from "@/lib/i18n";

type Recording = {
  id: string;
  halaqa_id: string;
  session_id: string | null;
  file_path: string;
  title: string | null;
  uploaded_by: string;
  size_bytes: number | null;
  duration_seconds: number | null;
  created_at: string;
};

export function RecordingsPanel({
  halaqaId, allowUpload = false, allowModerate = false,
}: { halaqaId?: string; allowUpload?: boolean; allowModerate?: boolean }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [playing, setPlaying] = useState<string | null>(null);
  useRealtimeInvalidate(["session_recordings"], ["recordings"]);

  const { data: recordings } = useQuery({
    queryKey: ["recordings", halaqaId ?? "all"],
    queryFn: async () => {
      const q = supabase.from("session_recordings").select("*").order("created_at", { ascending: false }).limit(50);
      const { data } = halaqaId ? await q.eq("halaqa_id", halaqaId) : await q;
      return (data ?? []) as Recording[];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!halaqaId) throw new Error("halaqaId required");
      const path = `${halaqaId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const up = await supabase.storage.from("recordings").upload(path, file, { upsert: false, contentType: file.type });
      if (up.error) throw up.error;
      const { data: openSession } = await supabase
        .from("halaqa_sessions").select("id").eq("halaqa_id", halaqaId)
        .order("started_at", { ascending: false }).limit(1).maybeSingle();
      const { error } = await supabase.from("session_recordings").insert({
        halaqa_id: halaqaId,
        session_id: openSession?.id ?? null,
        file_path: path,
        uploaded_by: user!.id,
        size_bytes: file.size,
        title: file.name,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("f.recordings.upload_success")); qc.invalidateQueries({ queryKey: ["recordings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (r: Recording) => {
      await supabase.storage.from("recordings").remove([r.file_path]);
      const { error } = await supabase.from("session_recordings").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("f.recordings.delete_success")); qc.invalidateQueries({ queryKey: ["recordings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sign = async (path: string) => {
    const { data, error } = await supabase.storage.from("recordings").createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) { toast.error(t("f.recordings.open_error")); return null; }
    return data.signedUrl;
  };

  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-primary">{t("f.recordings.title")}</h2>
        {allowUpload && halaqaId && (
          <label className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold cursor-pointer">
            {upload.isPending ? t("f.recordings.upload_uploading") : t("f.recordings.upload_btn")}
            <input
              type="file" accept="video/*,audio/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.currentTarget.value = ""; }}
            />
          </label>
        )}
      </div>
      <div className="divide-y divide-border">
        {recordings?.map((r) => (
          <div key={r.id} className="py-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate">{r.title || t("f.recordings.untitled")}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} {r.size_bytes ? `· ${(r.size_bytes / (1024 * 1024)).toFixed(1)} MB` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => { const url = await sign(r.file_path); if (url) setPlaying(url); }}
                  className="px-3 py-1.5 rounded-full bg-gold/20 text-gold text-xs font-bold"
                >{t("f.recordings.play")}</button>
                {allowModerate && (
                  <button
                    onClick={() => { if (confirm(t("f.recordings.delete_confirm"))) remove.mutate(r); }}
                    className="px-3 py-1.5 rounded-full bg-red-500/15 text-red-600 text-xs font-bold"
                  >{t("f.recordings.delete")}</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!recordings || recordings.length === 0) && (
          <div className="py-8 text-center text-muted-foreground text-sm">{t("f.recordings.empty")}</div>
        )}
      </div>

      {playing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
          <div className="bg-card rounded-2xl overflow-hidden max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <video src={playing} controls autoPlay className="w-full max-h-[80vh] bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
