import type { AppRole } from "@/hooks/use-auth";

// Centralized RBAC matrix. Server-side RLS is the source of truth;
// this mirrors it for UI affordances (hiding buttons, gating routes).
export type Permission =
  // Halaqas
  | "halaqa.view.assigned"
  | "halaqa.view.all"
  | "halaqa.manage"        // create / edit / delete / assign
  | "halaqa.join"
  // Events
  | "event.view"
  | "event.manage"
  | "event.register"
  // Users
  | "user.view.self"
  | "user.view.assigned"
  | "user.view.all"
  | "user.manage"          // create / edit / suspend / delete / roles
  // Attendance
  | "attendance.view.self"
  | "attendance.view.assigned"
  | "attendance.view.all"
  | "attendance.mark"
  // Evaluations
  | "evaluation.view.self"
  | "evaluation.view.assigned"
  | "evaluation.view.all"
  | "evaluation.create"
  // Assignments
  | "assignment.view.self"
  | "assignment.submit"
  | "assignment.create"
  // Reports & analytics
  | "reports.view"
  | "analytics.view"
  // Admin
  | "admin.access"
  | "settings.platform";

const STUDENT: Permission[] = [
  "halaqa.view.assigned", "halaqa.join",
  "event.view", "event.register",
  "user.view.self",
  "attendance.view.self",
  "evaluation.view.self",
  "assignment.view.self", "assignment.submit",
];

const TEACHER: Permission[] = [
  "halaqa.view.assigned", "halaqa.join",
  "event.view", "event.register",
  "user.view.self", "user.view.assigned",
  "attendance.view.assigned",
  "evaluation.view.assigned", "evaluation.create",
  "assignment.view.self", "assignment.create",
];

const HALAQA_SUPERVISOR: Permission[] = [
  "halaqa.view.assigned", "halaqa.join",
  "event.view", "event.register",
  "user.view.self", "user.view.assigned",
  "attendance.view.assigned", "attendance.mark",
];

const GENERAL_SUPERVISOR: Permission[] = [
  "halaqa.view.all",
  "event.view", "event.register",
  "user.view.self", "user.view.assigned", "user.view.all",
  "attendance.view.all",
  "evaluation.view.all",
  "reports.view", "analytics.view",
];

const DIRECTOR: Permission[] = [
  "halaqa.view.assigned", "halaqa.view.all", "halaqa.manage", "halaqa.join",
  "event.view", "event.manage", "event.register",
  "user.view.self", "user.view.assigned", "user.view.all", "user.manage",
  "attendance.view.all", "attendance.mark",
  "evaluation.view.all", "evaluation.create",
  "assignment.view.self", "assignment.create",
  "reports.view", "analytics.view",
  "admin.access", "settings.platform",
];

const PARENT: Permission[] = [
  "halaqa.view.assigned",
  "event.view",
  "user.view.self",
  "attendance.view.assigned",
  "evaluation.view.assigned",
];

const MATRIX: Record<AppRole, Permission[]> = {
  student: STUDENT,
  teacher: TEACHER,
  halaqa_supervisor: HALAQA_SUPERVISOR,
  general_supervisor: GENERAL_SUPERVISOR,
  director: DIRECTOR,
  parent: PARENT,
};

export function rolesCan(roles: AppRole[], perm: Permission): boolean {
  return roles.some((r) => MATRIX[r]?.includes(perm));
}

export function rolesCanAny(roles: AppRole[], perms: Permission[]): boolean {
  return perms.some((p) => rolesCan(roles, p));
}