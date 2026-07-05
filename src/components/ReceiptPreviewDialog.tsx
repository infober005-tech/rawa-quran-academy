import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveDialog,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ExternalLink, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Storage path within the payment-receipts bucket. */
  receiptPath: string | null;
  bucket?: string;
  title?: string;
};

// Cache signed URLs per session so re-opens don't refetch.
const urlCache = new Map<string, { url: string; expiresAt: number }>();

function normalizePath(input: string, bucket: string): { path: string | null; directUrl: string | null } {
  const raw = input.trim();
  if (!raw) return { path: null, directUrl: null };
  if (/^https?:\/\//i.test(raw)) return { path: null, directUrl: raw };
  // Strip accidental bucket/prefix or leading slashes.
  let p = raw.replace(/^\/+/, "");
  const prefixes = [
    `${bucket}/`,
    `storage/v1/object/public/${bucket}/`,
    `storage/v1/object/sign/${bucket}/`,
  ];
  for (const pre of prefixes) if (p.startsWith(pre)) p = p.slice(pre.length);
  return { path: p, directUrl: null };
}

export function ReceiptPreviewDialog({
  open,
  onOpenChange,
  receiptPath,
  bucket = "payment-receipts",
  title = "معاينة الوصل",
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadHref, setDownloadHref] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const load = useCallback(async () => {
    if (!receiptPath) return;
    const { path, directUrl } = normalizePath(receiptPath, bucket);
    if (directUrl) {
      setUrl(directUrl);
      setDownloadHref(directUrl);
      setError(null);
      return;
    }
    if (!path) {
      setError("لا يوجد مسار للوصل.");
      return;
    }
    const key = `${bucket}:${path}`;
    const cached = urlCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      setUrl(cached.url);
      setDownloadHref(cached.url);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 10);
    setLoading(false);
    if (err || !data?.signedUrl) {
      const msg = err?.message ?? "خطأ غير معروف";
      if (import.meta.env.DEV) console.error("[ReceiptPreview] createSignedUrl failed", { bucket, path, err });
      setError(`تعذر تحميل الوصل: ${msg}`);
      return;
    }
    urlCache.set(key, { url: data.signedUrl, expiresAt: Date.now() + 60 * 9 * 1000 });
    setUrl(data.signedUrl);
    setDownloadHref(data.signedUrl);
    if (import.meta.env.DEV) console.info("[ReceiptPreview] signed URL", data.signedUrl);
  }, [bucket, receiptPath]);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setRotation(0);
    setUrl(null);
    setError(null);
    void load();
  }, [open, load]);

  const extSource = (receiptPath ?? url ?? "").split("?")[0].toLowerCase();
  const showAsPdf = /\.pdf$/i.test(extSource);

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (import.meta.env.DEV) console.error("[ReceiptPreview] image load failed", url, e);
    if (url) {
      fetch(url, { method: "HEAD" })
        .then((r) => setError(`تعذر عرض الصورة (HTTP ${r.status}).`))
        .catch((fetchErr) => setError(`تعذر عرض الصورة: ${fetchErr?.message ?? "شبكة"}`));
    } else {
      setError("تعذر عرض الصورة.");
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const onDoubleTap = () => {
    setZoom((z) => (z >= 2 ? 1 : 2));
  };
  const onTouchEnd = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) onDoubleTap();
    lastTap.current = now;
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[900px] p-0"
    >
      <ResponsiveDialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">
          معاينة وصل الدفع
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="px-4 sm:px-6">
        <div
          ref={containerRef}
          onTouchEnd={onTouchEnd}
          className="relative flex min-h-[50vh] max-h-[70vh] items-center justify-center overflow-auto rounded-2xl bg-muted/40"
          style={{ touchAction: "pinch-zoom" }}
          role="region"
          aria-label={title}
        >
          {loading && (
            <div className="w-full space-y-3 p-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-[40vh] w-full" />
            </div>
          )}
          {!loading && error && (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-destructive font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold min-h-11"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
          {!loading && !error && url && showAsPdf && (
            <iframe
              src={url}
              title={title}
              className="w-full h-[65vh] rounded-xl bg-background"
            />
          )}
          {!loading && !error && url && !showAsPdf && (
            <img
              src={url}
              alt={title}
              draggable={false}
              onError={onImgError}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center",
                transition: "transform 0.2s ease",
              }}
              className="max-w-full h-auto select-none"
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 px-4 sm:px-6 py-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        {!showAsPdf && !error && (
          <div className="me-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="تصغير"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              className="grid place-items-center h-11 w-11 rounded-full bg-muted hover:bg-muted/70"
            >
              <ZoomOut className="h-4 w-4" aria-hidden />
            </button>
            <span className="text-xs font-mono px-2 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="تكبير"
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
              className="grid place-items-center h-11 w-11 rounded-full bg-muted hover:bg-muted/70"
            >
              <ZoomIn className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="تدوير"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="grid place-items-center h-11 w-11 rounded-full bg-muted hover:bg-muted/70"
            >
              <RotateCw className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
        {(url || downloadHref) && (
          <>
            <a
              href={(url || downloadHref) as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-muted hover:bg-muted/70 text-xs font-semibold"
              aria-label="فتح في نافذة جديدة"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">فتح</span>
            </a>
            <a
              href={(downloadHref || url) as string}
              download
              className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold shadow-glow"
              aria-label="تنزيل"
            >
              <Download className="h-4 w-4" aria-hidden />
              <span>تنزيل</span>
            </a>
          </>
        )}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-muted hover:bg-muted/70 text-xs font-semibold"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" aria-hidden />
          <span>إغلاق</span>
        </button>
      </div>
    </ResponsiveDialog>
  );
}