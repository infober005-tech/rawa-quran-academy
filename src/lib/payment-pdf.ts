import { jsPDF } from "jspdf";

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

export function downloadPaymentInstructionsPDF(settings: SettingsLike, qrDataUrl?: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(90, 67, 111);
  doc.rect(0, 0, w, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("RAWA QURAN ACADEMY", w / 2, 40, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(212, 175, 55);
  doc.text("Payment Instructions", w / 2, 64, { align: "center" });

  // Body
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  let y = 130;
  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 60, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 230, y);
    y += 26;
  };

  line("Plan", String(settings.subscription_name_ar ?? "Rawa Subscription"));
  line("Price", `${settings.price_dzd ?? "-"} ${settings.currency ?? "DZD"}`);
  line("Duration", `${settings.subscription_duration_days ?? 30} days`);
  line("CCP Number", String(settings.ccp_number ?? "-"));
  if (settings.ccp_key) line("CCP Key", String(settings.ccp_key));
  if (settings.rip_number) line("RIP", String(settings.rip_number));
  line("Account Holder", String(settings.account_holder ?? "-"));

  // Accepted methods
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Accepted Payment Methods", 60, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("• Edahabia Card (online or ATM)", 75, y); y += 20;
  doc.text("• BaridiMob (mobile app transfer)", 75, y); y += 28;

  // Steps
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Steps", 60, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const steps = [
    "1. Pay the subscription amount via Edahabia or BaridiMob.",
    "2. Keep the payment receipt and the transaction number.",
    "3. Log in to Rawa, open /subscribe and upload your receipt.",
    "4. Administration reviews your payment within 24 hours.",
    "5. You will receive a notification once your subscription is active.",
  ];
  for (const s of steps) { doc.text(s, 75, y); y += 18; }

  // QR (right side)
  if (qrDataUrl) {
    try { doc.addImage(qrDataUrl, "PNG", w - 180, 130, 120, 120); } catch { /* ignore */ }
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Scan to copy payment info", w - 120, 260, { align: "center" });
  }

  // Footer
  doc.setDrawColor(212, 175, 55);
  doc.line(60, 780, w - 60, 780);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Rawa Quran Academy · أكاديمية رواء لتحفيظ القرآن الكريم", w / 2, 800, { align: "center" });

  doc.save("rawa-payment-instructions.pdf");
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