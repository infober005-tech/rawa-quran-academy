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
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap";
  document.head.appendChild(link);
  // Best-effort wait for the font to load
  try {
    const fonts = (document as Document & { fonts?: { load: (s: string) => Promise<unknown>; ready: Promise<unknown> } }).fonts;
    if (fonts?.load) {
      await fonts.load("700 16px Cairo");
      await fonts.ready;
    } else {
      await new Promise((r) => setTimeout(r, 400));
    }
  } catch { /* ignore */ }
}

function buildFallbackPdf(settings: SettingsLike, t: T, qrDataUrl?: string, paymentRef?: string, logoDataUrl?: string): jsPDF {
  console.info("[pdf] Building fallback PDF (text-only via jsPDF)...");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait", compress: true });
  const price = `${settings.price_dzd ?? "—"} ${settings.currency ?? "DZD"}`;

  if (logoDataUrl && logoDataUrl !== BLANK_PNG) {
    try { doc.addImage(logoDataUrl, "PNG", 257, 30, 80, 80); } catch (e) { console.warn("[pdf] fallback logo failed", e); }
  }
  doc.setFillColor(90, 67, 111);
  doc.rect(0, 120, 595, 4, "F");
  doc.setFontSize(20); doc.setTextColor(90, 67, 111);
  doc.text(t("s.pdf.fallback_title"), 297, 150, { align: "center" });
  doc.setFontSize(13); doc.setTextColor(80, 80, 80);
  doc.text(t("s.pdf.fallback_subtitle"), 297, 172, { align: "center" });

  let y = 220;
  doc.setFontSize(12); doc.setTextColor(30, 30, 30);
  const rows: [string, string][] = [
    [t("s.pdf.method"), "Edahabia / BaridiMob"],
    [t("s.pdf.ccp"), settings.ccp_number ?? "—"],
    ...(settings.ccp_key ? [[t("s.pdf.key"), settings.ccp_key] as [string, string]] : []),
    [t("s.pdf.beneficiary_en"), settings.account_holder ?? "—"],
    [t("s.pdf.amount_en"), price],
    ...(paymentRef ? [[t("s.pdf.reference_en"), paymentRef] as [string, string]] : []),
    [t("s.pdf.duration_en"), t("s.pdf.duration_days_en", { days: settings.subscription_duration_days ?? 30 })],
  ];
  for (const [k, v] of rows) {
    doc.setTextColor(120, 110, 140); doc.text(`${k}:`, 60, y);
    doc.setTextColor(30, 30, 30); doc.text(String(v), 200, y);
    y += 24;
  }

  if (qrDataUrl) {
    try { doc.addImage(qrDataUrl, "PNG", 380, 220, 160, 160); }
    catch (e) { console.warn("[pdf] fallback QR failed", e); }
  }

  y = Math.max(y, 420);
  doc.setFontSize(11); doc.setTextColor(90, 67, 111);
  doc.text(t("s.pdf.steps_en"), 60, y); y += 18;
  doc.setTextColor(40, 40, 40);
  [
    `1. ${t("s.pdf.step1")}`,
    `2. ${t("s.pdf.step2")}`,
    `3. ${t("s.pdf.step3")}`,
    `4. ${t("s.pdf.step4")}`,
    `5. ${t("s.pdf.step5")}`,
  ].forEach((line) => { doc.text(line, 60, y); y += 16; });

  doc.setFontSize(10); doc.setTextColor(120, 110, 140);
  doc.text(t("s.pdf.footer_en", { url: PLATFORM_URL }), 297, 800, { align: "center" });
  return doc;
}

export async function downloadPaymentInstructionsPDF(settings: SettingsLike, t: T, lang: Lang, qrDataUrl?: string, paymentRef?: string) {
  let logoSrc = BLANK_PNG;

  // Step 1: Fonts
  console.info("[pdf] Waiting fonts...");
  try { await ensureArabicFont(); }
  catch (e) { console.error("PDF ERROR (fonts):", e); }

  // Step 2: Logo
  console.info("[pdf] Loading logo...");
  try { logoSrc = await imageToDataUrl(logoAsset.url); }
  catch (e) { console.error("PDF ERROR (logo):", e); }

  // Step 3+: HTML render attempt
  let host: HTMLDivElement | null = null;
  try {
    console.info("[pdf] Creating template...");
    host = document.createElement("div");
    host.style.cssText = "position:fixed; left:-99999px; top:0; width:794px; visibility:hidden;";
    host.setAttribute("aria-hidden", "true");
    host.innerHTML = buildInvoiceHTML(settings, logoSrc, t, lang, qrDataUrl, paymentRef);
    document.body.appendChild(host);
    const node = host.querySelector("#rawa-pdf-root") as HTMLElement | null;
    if (!node) throw new Error("template root missing");

    console.info("[pdf] Loading QR + images...");
    await waitForImages(node);
    try {
      const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
      if (fonts?.ready) await fonts.ready;
    } catch (e) { console.warn("[pdf] fonts.ready failed", e); }

    console.info("[pdf] Rendering canvas (html2canvas)...");
    const canvas = await html2canvas(node, {
      scale: Math.min(3, window.devicePixelRatio > 1 ? 2.5 : 2),
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 4000,
    });

    console.info("[pdf] Creating PDF...");
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait", compress: true });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      doc.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    } else {
      let remaining = imgH;
      let position = 0;
      while (remaining > 0) {
        doc.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        remaining -= pageH;
        if (remaining > 0) { doc.addPage(); position -= pageH; }
      }
    }
    console.info("[pdf] Saving PDF...");
    doc.save(`${t("s.pdf.filename")}.pdf`);
    return;
  } catch (error) {
    console.error("PDF ERROR:", error);
    // Fallback: always produce a PDF
    try {
      const doc = buildFallbackPdf(settings, t, qrDataUrl, paymentRef, logoSrc);
      console.info("[pdf] Saving fallback PDF...");
      doc.save(`${t("s.pdf.filename")}.pdf`);
    } catch (fallbackError) {
      console.error("PDF ERROR (fallback also failed):", fallbackError);
      throw fallbackError;
    }
  } finally {
    if (host && host.parentNode) host.parentNode.removeChild(host);
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