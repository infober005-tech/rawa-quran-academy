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
import { useI18n } from "@/lib/i18n";

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
  title,
}: Props) {
  const { t } = useI18n();
  const dialogTitle = title ?? t("s.preview_receipt");
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
      setError(t("s.no_receipt_path"));
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
      const msg = err?.message ?? t("s.unknown_error");
      if (import.meta.env.DEV) console.error("[ReceiptPreview] createSignedUrl failed", { bucket, path, err });
      setError(t("s.load_failed", { msg }));
      return;
    }
    urlCache.set(key, { url: data.signedUrl, expiresAt: Date.now() + 60 * 9 * 1000 });
    setUrl(data.signedUrl);
    setDownloadHref(data.signedUrl);
    if (import.meta.env.DEV) console.info("[ReceiptPreview] signed URL", data.signedUrl);
  }, [bucket, receiptPath, t]);

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
        .then((r) => setError(t("s.image_load_failed_http", { status: r.status })))
        .catch((fetchErr) => setError(t("s.image_load_failed", { err: fetchErr?.message ?? t("s.network") })));
    } else {
      setError(t("s.image_load_failed_generic"));
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
        <ResponsiveDialogTitle>{dialogTitle}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">
          {t("s.preview_desc")}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="px-4 sm:px-6">
        <div
          ref={containerRef}
          onTouchEnd={onTouchEnd}
          className="relative flex min-h-[50vh] max-h-[70vh] items-center justify-center overflow-auto rounded-2xl bg-muted/40"
          style={{ touchAction: "pinch-zoom" }}
          role="region"
          aria-label={dialogTitle}
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
                {t("s.retry")}
              </button>
            </div>
          )}
          {!loading && !error && url && showAsPdf && (
            <iframe
              src={url}
              title={dialogTitle}
              className="w-full h-[65vh] rounded-xl bg-background"
            />
          )}
          {!loading && !error && url && !showAsPdf && (
            <img
              src={url}
              alt={dialogTitle}
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
              aria-label={t("s.zoom_out")}
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
              aria-label={t("s.zoom_in")}
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
              className="grid place-items-center h-11 w-11 rounded-full bg-muted hover:bg-muted/70"
            >
              <ZoomIn className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("s.rotate")}
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
              aria-label={t("s.open_new_window")}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t("s.open")}</span>
            </a>
            <a
              href={(downloadHref || url) as string}
              download
              className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold shadow-glow"
              aria-label={t("s.download")}
            >
              <Download className="h-4 w-4" aria-hidden />
              <span>{t("s.download")}</span>
            </a>
          </>
        )}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-muted hover:bg-muted/70 text-xs font-semibold"
          aria-label={t("s.close")}
        >
          <X className="h-4 w-4" aria-hidden />
          <span>{t("s.close")}</span>
        </button>
      </div>
    </ResponsiveDialog>
  );
}
