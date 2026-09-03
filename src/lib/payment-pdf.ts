import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import logoAsset from "@/assets/rawa-logo.png.asset.json";

type SettingsLike = {
  subscription_name_ar: string | null;
  price_dzd: number | null;
  currency: string | null;
  ccp_number: string | null;
  ccp_key: string | null;
  account_holder: string | null;
  rip_number: string | null;
  subscription_duration_days: number | null;
};

type Lang = "ar" | "fr" | "en";
type T = (key: string, vars?: Record<string, string | number>) => string;
const PLATFORM_URL = "https://rawa-quran-academy.lovable.app";

// Transparent 1x1 PNG fallback so html2canvas never aborts on a broken <img>.
const BLANK_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=";

async function imageToDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`logo fetch ${res.status}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("[pdf] logo load failed, using blank fallback", err);
    return BLANK_PNG;
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          // hard timeout so a single broken image never blocks the PDF
          setTimeout(() => resolve(), 4000);
        }),
    ),
  );
}

// Wrap numeric / reference / URL content so bidi never mixes it with Arabic.
function ltr(value: string): string {
  return `<span dir="ltr" style="direction:ltr; unicode-bidi:isolate; display:inline-block; white-space:nowrap; font-variant-numeric:tabular-nums;">${value}</span>`;
}

function buildPaymentRow(label: string, value: string, accent = false, isLtr = false): string {
  const rendered = isLtr ? ltr(value) : value;
  return `<div style="display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-bottom:1px dashed #ece5f7;">
    <span style="color:#7a6a91; font-weight:600; unicode-bidi:plaintext;">${label}</span>
    <span style="font-weight:${accent ? 800 : 700}; color:${accent ? "#D4AF37" : "#3a2a55"}; ${accent ? "font-size:17px;" : ""}">${rendered}</span>
  </div>`;
}

function buildInvoiceHTML(settings: SettingsLike, logoSrc: string, t: T, lang: Lang, qrDataUrl?: string, paymentRef?: string): string {
  const price = `${settings.price_dzd ?? "—"} ${settings.currency ?? "DZD"}`;
  const logoUrl = logoSrc;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = dir === "rtl" ? "right" : "left";
  const borderSide = dir === "rtl" ? "border-right" : "border-left";
  const paddingSide = dir === "rtl" ? "padding-right" : "padding-left";
  return `
  <div id="rawa-pdf-root" dir="${dir}" lang="${lang}" style="
    width: 794px; min-height: 1123px; background:#ffffff; color:#1a1a1a; position:relative; overflow:hidden;
    visibility: visible;
    direction: ${dir}; unicode-bidi: plaintext; text-align: ${align}; letter-spacing: normal;
    font-family: 'Cairo','Tajawal','Noto Sans Arabic','Segoe UI',Tahoma,sans-serif;
    font-kerning: normal; font-feature-settings: "liga" 1, "calt" 1;
    padding: 0; margin: 0; box-sizing: border-box;">
    <!-- Watermark -->

    <img src="${logoUrl}" alt="" style="
      position:absolute; top:50%; left:50%; width:560px; height:560px;
      transform: translate(-50%, -50%); opacity:0.06; pointer-events:none; z-index:0;
      object-fit:contain;" />

    <!-- Header -->
    <div dir="${dir}" style="position:relative; z-index:1; background: linear-gradient(135deg,#5A436F 0%, #7A5A95 60%, #D4AF37 100%); padding: 28px 48px 24px; text-align:center; color:#fff; direction:${dir}; unicode-bidi:plaintext;">
      <img src="${logoUrl}" alt="Rawa" style="width:88px; height:88px; border-radius:50%; border:3px solid #D4AF37; box-shadow:0 6px 18px rgba(0,0,0,.25); background:#fff; object-fit:cover; margin-bottom:10px;" />
      <div style="font-size: 12px; letter-spacing: 6px; font-weight:700; opacity:.9; direction:ltr; unicode-bidi:isolate;">RAWA</div>
      <h1 dir="${dir}" style="margin:6px 0 2px; font-size: 26px; font-weight: 900; direction:${dir}; unicode-bidi:plaintext;">${t("s.pdf.platform_title")}</h1>
      <div dir="${dir}" style="font-size: 15px; opacity:.92; direction:${dir}; unicode-bidi:plaintext;">${t("s.pdf.header_title")}</div>
      <div style="height:3px; width:120px; margin:14px auto 0; background:#D4AF37; border-radius:2px;"></div>
    </div>

    <div style="position:relative; z-index:1; padding: 28px 48px 16px; display:flex; gap:24px; align-items:flex-start;">
      <div dir="${dir}" style="flex:1; min-width:0; direction:${dir}; text-align:${align}; unicode-bidi:plaintext;">
        <h2 style="color:#5A436F; font-size:18px; margin:0 0 10px; ${borderSide}:4px solid #D4AF37; ${paddingSide}:10px;">${t("s.pdf.payment_data")}</h2>
        <div style="background:#faf7ff; border:1px solid #ece5f7; border-radius:14px; padding:14px 18px; font-size:14px; line-height:1.9;">
          <div style="padding:6px 0; border-bottom:1px dashed #ece5f7; color:#7a6a91; font-weight:600;">${t("s.pdf.payment_method_label")} <span style="color:#3a2a55; font-weight:700;">${t("s.pdf.payment_method_value")}</span></div>
          ${buildPaymentRow(t("s.pdf.ccp_number"), settings.ccp_number ?? "—", false, true)}
          ${settings.ccp_key ? buildPaymentRow(t("s.pdf.key"), settings.ccp_key, false, true) : ""}
          ${buildPaymentRow(t("s.pdf.beneficiary"), settings.account_holder ?? "—")}
          ${buildPaymentRow(t("s.pdf.amount"), price, true, true)}
          ${paymentRef ? buildPaymentRow(t("s.pdf.reference"), paymentRef, false, true) : ""}
          ${buildPaymentRow(t("s.pdf.duration"), t("s.pdf.duration_days", { days: settings.subscription_duration_days ?? 30 }))}
        </div>
      </div>
      ${qrDataUrl ? `<div style="width:210px; text-align:center;">
        <div style="display:inline-block; padding:10px; background:#fff; border:2px solid #D4AF37; border-radius:14px;">
          <img src="${qrDataUrl}" alt="QR" style="width:188px; height:188px; display:block;" />
        </div>
        <div dir="${dir}" style="font-size:11px; color:#7a6a91; margin-top:8px; direction:${dir}; unicode-bidi:plaintext;">${t("s.pdf.qr_scan_hint")}</div>
      </div>` : ""}
    </div>

    <div dir="${dir}" style="position:relative; z-index:1; padding: 0 48px 16px; direction:${dir}; text-align:${align}; unicode-bidi:plaintext;">
      <h2 style="color:#5A436F; font-size:18px; margin:0 0 10px; ${borderSide}:4px solid #D4AF37; ${paddingSide}:10px;">${t("s.pdf.steps_title")}</h2>
      <ol style="font-size:14px; line-height:1.9; color:#1a1a1a; ${paddingSide}:24px; margin:0;">
        <li style="unicode-bidi:plaintext;">${t("s.pdf.step1")}</li>
        <li style="unicode-bidi:plaintext;">${t("s.pdf.step2")}</li>
        <li style="unicode-bidi:plaintext;">${t("s.pdf.step3")}</li>
        <li style="unicode-bidi:plaintext;">${t("s.pdf.step4")}</li>
        <li style="unicode-bidi:plaintext;">${t("s.pdf.step5")}</li>
      </ol>
    </div>

    <div dir="${dir}" style="position:relative; z-index:1; padding: 0 48px 16px; direction:${dir}; text-align:${align}; unicode-bidi:plaintext;">
      <div style="background:#fff8e1; border:1px solid #f1d98a; ${borderSide}:4px solid #D4AF37; border-radius:12px; padding:12px 16px;">
        <div style="font-weight:800; color:#5A436F; margin-bottom:4px;">${t("s.pdf.notes_title")}</div>
        <ul style="font-size:13px; color:#3a2a55; line-height:1.9; margin:0; ${paddingSide}:18px;">
          <li style="unicode-bidi:plaintext;">${t("s.pdf.note1")}</li>
          <li style="unicode-bidi:plaintext;">${t("s.pdf.note2")}</li>
          <li style="unicode-bidi:plaintext;">${t("s.pdf.note3")}</li>
        </ul>
      </div>
    </div>


    <!-- Signature + Stamp -->
    <div dir="${dir}" style="position:relative; z-index:1; padding: 8px 48px 16px; display:flex; gap:24px; align-items:center; justify-content:space-between; direction:${dir}; text-align:${align}; unicode-bidi:plaintext;">
      <div style="flex:1;">
        <div style="color:#7a6a91; font-size:12px; margin-bottom:6px; unicode-bidi:plaintext;">${t("s.pdf.esignature")}</div>
        <div style="font-family:'Cairo','Tajawal',sans-serif; font-weight:700; color:#5A436F; font-size:18px; border-bottom:2px solid #D4AF37; display:inline-block; padding:2px 8px 6px; unicode-bidi:plaintext;">${t("s.pdf.admin_signature")}</div>
      </div>
      <div style="width:130px; height:130px; position:relative; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; inset:0; border-radius:50%; border:4px double #D4AF37; transform:rotate(-12deg);"></div>
        <div style="position:absolute; inset:10px; border-radius:50%; border:2px solid #D4AF37; transform:rotate(-12deg);"></div>
        <div style="text-align:center; transform:rotate(-12deg); color:#8a6a1f; font-weight:900;">
          <div style="font-size:10px; letter-spacing:2px; direction:ltr; unicode-bidi:isolate;">RAWA</div>
          <div style="font-size:14px; margin-top:2px; unicode-bidi:plaintext;">${t("s.pdf.stamp_certified")}</div>
          <div style="font-size:9px; margin-top:2px; direction:ltr; unicode-bidi:isolate;">${t("s.pdf.stamp_official")}</div>
        </div>
      </div>
    </div>

    <div dir="${dir}" style="position:relative; z-index:1; margin-top:auto; padding: 14px 48px; border-top:2px solid #D4AF37; text-align:center; color:#7a6a91; font-size:11px; direction:${dir}; unicode-bidi:plaintext;">
      <div style="font-weight:700; color:#5A436F; unicode-bidi:plaintext;">${t("s.pdf.footer_copyright")}</div>
      <div style="margin-top:2px;">${ltr(`<span style="color:#5A436F;">${PLATFORM_URL}</span>`)}</div>
      <div style="unicode-bidi:plaintext;">${t("s.pdf.all_rights")}</div>
    </div>

  </div>`;
}

async function ensureArabicFont(): Promise<void> {
  if (typeof document === "undefined") return;
  const id = "rawa-arabic-font";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700;800&display=swap";
    document.head.appendChild(link);
  }
  const fonts = (document as Document & {
    fonts?: { load: (s: string) => Promise<unknown>; ready: Promise<unknown> };
  }).fonts;
  if (fonts?.load) {
    // Load the exact weights the template uses, with Arabic sample text so the
    // Arabic subset (and its shaping tables) is actually fetched.
    const sample = "تعليمات الدفع مرحباً بك في منصة رواء";
    await Promise.all(
      ["400 14px Cairo", "700 16px Cairo", "900 26px Cairo", "700 16px Tajawal"].map((f) =>
        fonts.load(f, sample).catch(() => undefined),
      ),
    );
    await fonts.ready;
  } else {
    await new Promise((r) => setTimeout(r, 600));
  }
}

/**
 * Arabic-safe PDF generation.
 *
 * Arabic is NEVER drawn with jsPDF.text(): the core jsPDF fonts have no Arabic
 * glyphs and no shaping/bidi engine, which produced the reversed/disconnected
 * output. Instead the browser lays out and shapes the RTL HTML, html2canvas
 * rasterises it, and jsPDF only embeds the resulting bitmap.
 */
export async function downloadPaymentInstructionsPDF(
  settings: SettingsLike,
  t: T,
  lang: Lang,
  qrDataUrl?: string,
  paymentRef?: string,
) {
  let step = "init";
  let frame: HTMLIFrameElement | null = null;
  try {
    step = "fonts";
    console.info("[pdf] step: fonts");
    await ensureArabicFont();

    step = "logo";
    console.info("[pdf] step: logo");
    const logoSrc = await imageToDataUrl(logoAsset.url);

    step = "template";
    console.info("[pdf] step: template");
    // The template is rendered inside an isolated iframe: the app's Tailwind
    // theme uses modern oklch()/lab() colors that html2canvas cannot parse, and
    // any inherited value would abort the capture.
    frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    // Off-screen but measurable — html2canvas needs real layout, never display:none.
    frame.style.cssText =
      "position:fixed; left:-10000px; top:0; width:794px; height:1200px; border:0; z-index:-1; visibility:hidden; pointer-events:none; background:#ffffff;";
    document.body.appendChild(frame);
    const fdoc = frame.contentDocument;
    if (!fdoc) throw new Error("iframe document unavailable");
    fdoc.open();
    fdoc.write(`<!doctype html><html dir="${lang === "ar" ? "rtl" : "ltr"}" lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700;800&display=swap">
      <style>
        html,body{margin:0;padding:0;background:#ffffff;color:#1a1a1a;}
        body{font-family:'Cairo','Tajawal','Noto Sans Arabic','Segoe UI',Tahoma,sans-serif; letter-spacing:normal;
             direction:${lang === "ar" ? "rtl" : "ltr"}; unicode-bidi:plaintext; text-align:${lang === "ar" ? "right" : "left"};}
        *{box-sizing:border-box;}
      </style></head><body>${buildInvoiceHTML(settings, logoSrc, t, lang, qrDataUrl, paymentRef)}</body></html>`);
    fdoc.close();

    const node = fdoc.getElementById("rawa-pdf-root") as HTMLElement | null;
    if (!node) throw new Error("template root missing");
    if (node.offsetWidth === 0 || node.offsetHeight === 0) {
      throw new Error(`template has no measurable layout (${node.offsetWidth}x${node.offsetHeight})`);
    }
    frame.style.height = `${node.offsetHeight}px`;

    step = "images";
    console.info("[pdf] step: images");
    await waitForImages(node);

    step = "fonts-ready";
    console.info("[pdf] step: fonts-ready");
    const outerFonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (outerFonts?.ready) await outerFonts.ready;
    const innerFonts = (fdoc as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (innerFonts?.ready) await innerFonts.ready;
    // One frame so shaped Arabic glyphs are committed to layout before capture.
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    step = "canvas";
    console.info("[pdf] step: canvas");
    const canvas = await html2canvas(node, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000,
      backgroundColor: "#ffffff",
      logging: false,
      width: node.offsetWidth,
      height: node.offsetHeight,
      windowWidth: node.offsetWidth,
      windowHeight: node.offsetHeight,
      onclone: (clonedDoc) => {
        const root = clonedDoc.getElementById("rawa-pdf-root");
        if (root) (root as HTMLElement).style.visibility = "visible";
      },
    });

    if (!canvas.width || !canvas.height) throw new Error("html2canvas produced an empty canvas");

    step = "pdf";
    console.info("[pdf] step: pdf");
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait", compress: true });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH + 1) {
      doc.addImage(imgData, "JPEG", 0, 0, imgW, Math.min(imgH, pageH));
    } else {
      let remaining = imgH;
      let position = 0;
      while (remaining > 0) {
        doc.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        remaining -= pageH;
        if (remaining > 0) {
          doc.addPage();
          position -= pageH;
        }
      }
    }

    step = "save";
    console.info("[pdf] step: save");
    doc.save(`${t("s.pdf.filename")}.pdf`);
  } catch (error) {
    // No jsPDF text fallback: it cannot shape Arabic. Surface the failure so the
    // caller shows the existing Arabic error toast.
    console.error(`[pdf] PDF generation failed at step "${step}":`, error);
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    if (frame?.parentNode) frame.parentNode.removeChild(frame);
  }
}


export async function compressImageFile(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 400 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}