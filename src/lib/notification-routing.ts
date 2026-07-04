import type { AppRole } from "@/hooks/use-auth";

export type NotifRecord = {
  id: string;
  title: string | null;
  content: string | null;
  link: string | null;
};

/**
 * Known top-level routes in the app. Anything not in this set is downgraded
 * to `/dashboard` so we never navigate to a missing route.
 */
const ALLOWED_ROUTES = new Set<string>([
  "/dashboard",
  "/halaqas",
  "/events",
  "/notifications",
  "/admin",
  "/settings",
  "/subscribe",
  "/payment-status",
]);

function normalizePath(link: string): { path: string; search: string } {
  const [rawPath, rawSearch = ""] = link.split("?", 2);
  return { path: rawPath.replace(/\/+$/, "") || "/", search: rawSearch };
}

/**
 * Rough keyword classifier for notification kind based on title/content.
 * Keeps the check language-agnostic (Arabic/English keywords).
 */
function classify(n: NotifRecord): string {
  const text = `${n.title ?? ""} ${n.content ?? ""} ${n.link ?? ""}`.toLowerCase();
  if (/(دفع|payment|وصل|receipt)/.test(text)) return "payment";
  if (/(اشتراك|subscription|تجديد|expire)/.test(text)) return "subscription";
  if (/(حلقة|halaqa)/.test(text)) return "halaqa";
  if (/(فعالية|event)/.test(text)) return "event";
  if (/(تقييم|evaluation)/.test(text)) return "evaluation";
  if (/(حضور|attendance)/.test(text)) return "attendance";
  if (/(واجب|homework|assignment)/.test(text)) return "homework";
  if (/(ملف|profile)/.test(text)) return "profile";
  return "system";
}

/**
 * Resolve the best in-app destination for a notification, respecting the
 * user's role. Falls back to `/dashboard` when no accessible route matches.
 *
 * The DB triggers already write a `link` column; we honor that when it maps
 * to an accessible route, otherwise we infer from title/content.
 */
export function resolveNotificationRoute(
  n: NotifRecord,
  role: AppRole | null,
): string {
  const kind = classify(n);

  // Role-aware overrides for payment notifications
  if (kind === "payment") {
    return role === "director" || role === "general_supervisor"
      ? "/admin"
      : "/payment-status";
  }
  if (kind === "subscription") {
    return role === "director" ? "/admin" : "/subscribe";
  }

  // Trust the trigger-supplied link if it targets a known route
  if (n.link) {
    const { path, search } = normalizePath(n.link);
    if (ALLOWED_ROUTES.has(path)) return search ? `${path}?${search}` : path;
  }

  switch (kind) {
    case "halaqa":
    case "attendance":
    case "homework":
    case "evaluation":
      return "/halaqas";
    case "event":
      return "/events";
    case "profile":
      return "/settings";
    default:
      return "/dashboard";
  }
}