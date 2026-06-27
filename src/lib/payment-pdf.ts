import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

const ARABIC_PDF_FILENAME = "تعليمات_الدفع_رواء.pdf";

function buildArabicInvoiceHTML(settings: SettingsLike, qrDataUrl?: string): string {
  const price = `${settings.price_dzd ?? "—"} ${settings.currency ?? "DZD"}`;
  const ccpKeyRow = settings.ccp_key
    ? `<div class="row"><span class="lbl">المفتاح</span><span class="val">${settings.ccp_key}</span></div>`
    : "";
  const qrBlock = qrDataUrl
    ? `<div class="qr"><img src="${qrDataUrl}" alt="QR" /><div class="qr-cap">امسح الرمز لنسخ بيانات الدفع</div></div>`
    : "";
  return `
  <div id="rawa-pdf-root" dir="rtl" lang="ar" style="
    width: 794px; min-height: 1123px; background:#ffffff; color:#1a1a1a;
    font-family: 'Cairo','Tajawal','Noto Sans Arabic','Segoe UI',Tahoma,sans-serif;
    padding: 0; margin: 0; box-sizing: border-box;">
    <div style="background: linear-gradient(135deg,#D4AF37 0%, #E8C75B 100%); padding: 36px 48px; text-align:center; color:#3a2a55;">
      <div style="font-size: 14px; letter-spacing: 6px; font-weight:700;">RAWA · رواء</div>
      <h1 style="margin:8px 0 4px; font-size: 30px; font-weight: 900; color:#3a2a55;">تعليمات دفع الاشتراك</h1>
      <div style="font-size: 14px; color:#3a2a55; opacity:.85;">منصة رواء لتعليم القرآن الكريم</div>
    </div>

    <div style="padding: 32px 48px; display:flex; gap:24px; align-items:flex-start;">
      <div style="flex:1; min-width:0;">
        <h2 style="color:#5A436F; font-size:20px; margin:0 0 12px; border-right:4px solid #D4AF37; padding-right:10px;">بيانات الدفع</h2>
        <div style="background:#faf7ff; border:1px solid #ece5f7; border-radius:14px; padding:18px 20px; font-size:15px; line-height:2;">
          <div class="row" style="display:flex; justify-content:space-between; gap:12px;"><span class="lbl" style="color:#7a6a91; font-weight:600;">رقم الحساب البريدي الجاري (CCP)</span><span class="val" style="font-weight:700; color:#3a2a55;">${settings.ccp_number ?? "—"}</span></div>
          ${ccpKeyRow.replace('class="row"', 'class="row" style="display:flex; justify-content:space-between; gap:12px;"').replace('class="lbl"', 'class="lbl" style="color:#7a6a91; font-weight:600;"').replace('class="val"', 'class="val" style="font-weight:700; color:#3a2a55;"')}
          <div class="row" style="display:flex; justify-content:space-between; gap:12px;"><span class="lbl" style="color:#7a6a91; font-weight:600;">اسم صاحب الحساب</span><span class="val" style="font-weight:700; color:#3a2a55;">${settings.account_holder ?? "—"}</span></div>
          <div class="row" style="display:flex; justify-content:space-between; gap:12px;"><span class="lbl" style="color:#7a6a91; font-weight:600;">المبلغ الواجب دفعه</span><span class="val" style="font-weight:800; color:#D4AF37; font-size:17px;">${price}</span></div>
          <div class="row" style="display:flex; justify-content:space-between; gap:12px;"><span class="lbl" style="color:#7a6a91; font-weight:600;">مدة الاشتراك</span><span class="val" style="font-weight:700; color:#3a2a55;">${settings.subscription_duration_days ?? 30} يومًا</span></div>
          <div style="margin-top:10px; color:#7a6a91; font-weight:600;">طريقة الدفع:</div>
          <ul style="margin:4px 0 0; padding-right:20px; color:#3a2a55;">
            <li>البطاقة الذهبية</li>
            <li>بريدي موب</li>
          </ul>
        </div>
      </div>
      ${qrBlock ? `<div style="width:200px; text-align:center;">
        <div style="display:inline-block; padding:10px; background:#fff; border:2px solid #D4AF37; border-radius:14px;">
          <img src="${qrDataUrl}" alt="QR" style="width:180px; height:180px; display:block;" />
        </div>
        <div style="font-size:11px; color:#7a6a91; margin-top:8px;">امسح الرمز لنسخ بيانات الدفع</div>
      </div>` : ""}
    </div>

    <div style="padding: 0 48px 24px;">
      <h2 style="color:#5A436F; font-size:20px; margin:0 0 12px; border-right:4px solid #D4AF37; padding-right:10px;">خطوات الدفع</h2>
      <ol style="font-size:15px; line-height:2; color:#1a1a1a; padding-right:24px; margin:0;">
        <li>قم بتحويل مبلغ الاشتراك.</li>
        <li>احتفظ بوصل الدفع.</li>
        <li>ارجع إلى المنصة.</li>
        <li>ارفع صورة الوصل.</li>
        <li>انتظر مراجعة الإدارة.</li>
        <li>سيتم تفعيل اشتراكك مباشرة بعد الموافقة.</li>
      </ol>
    </div>

    <div style="padding: 0 48px 24px;">
      <div style="background:#fff8e1; border:1px solid #f1d98a; border-right:4px solid #D4AF37; border-radius:12px; padding:14px 18px;">
        <div style="font-weight:800; color:#5A436F; margin-bottom:4px;">ملاحظة</div>
        <div style="font-size:14px; color:#3a2a55; line-height:1.9;">يرجى كتابة رقم المرجع الموجود في رمز QR عند الدفع إن أمكن.</div>
      </div>
    </div>

    <div style="margin-top:auto; padding: 18px 48px; border-top:2px solid #D4AF37; text-align:center; color:#7a6a91; font-size:12px;">
      <div style="font-weight:700; color:#5A436F;">منصة رواء لتعليم القرآن الكريم</div>
      <div>جميع الحقوق محفوظة © 2026</div>
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

export async function downloadPaymentInstructionsPDF(settings: SettingsLike, qrDataUrl?: string) {
  await ensureArabicFont();

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "794px";
  host.innerHTML = buildArabicInvoiceHTML(settings, qrDataUrl);
  document.body.appendChild(host);

  try {
    const node = host.querySelector("#rawa-pdf-root") as HTMLElement;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      doc.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    } else {
      // Paginate
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

    doc.save(ARABIC_PDF_FILENAME);
  } finally {
    document.body.removeChild(host);
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