import { supabase } from "@/integrations/supabase/client";

export type QrPayload = {
  v: 1;
  ref: string;
  token: string;
  studentId: string;
  amount: number;
  currency: string;
  ccp: string;
  ccpKey?: string | null;
  holder: string;
  expiresAt: string;
};

/** Generate a unique transaction reference. */
export function buildPaymentRef(userId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const u = userId.slice(0, 6).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RAWA-PAY-${ts}-${u}-${rnd}`;
}

/** Cryptographically random per-transaction token (server can verify by lookup). */
export function buildQrToken(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compute SHA-256 hex of a File/Blob (used for duplicate-receipt detection). */
export async function sha256Hex(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Check the per-user rate limit before allowing a new payment submission. */
export async function checkRateLimit(userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("can_submit_payment", { _user_id: userId });
  return data === true;
}

/** Placeholder WhatsApp webhook — wire to provider when ready. */
export async function notifyWhatsApp(_event: {
  to?: string | null;
  template: "payment_submitted" | "payment_approved" | "payment_rejected" | "subscription_expired";
  data: Record<string, unknown>;
}): Promise<void> {
  // Intentional no-op: production integration (e.g. Twilio/Meta Cloud API) plugs in here.
  return;
}