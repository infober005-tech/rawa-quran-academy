type QueryResponse<T = unknown> = {
  data: T | null;
  error: { code?: string; message: string; details?: string | null; hint?: string | null } | null;
  status: number;
  statusText?: string;
};

type SupabaseLike = {
  from: (table: string) => any;
};

const RELATION_TESTS = [
  { table: "halaqas", select: "id, name" },
  { table: "student_halaqas", select: "halaqa_id, student_id" },
  { table: "profiles", select: "id, full_name" },
  { table: "subscriptions", select: "id, student_id, status" },
  { table: "user_roles", select: "user_id, role" },
  { table: "parent_links", select: "parent_user_id, student_user_id" },
] as const;

const seenAudits = new Set<string>();

function equivalentSql(table: string, select: string, suffix = "limit 1") {
  return `select ${select} from public.${table}${suffix ? ` ${suffix}` : ""};`;
}

function errorSummary(error: QueryResponse["error"]) {
  if (!error) return null;
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  };
}

export function logHalaqaSelect<T>(context: string, table: string, select: string, response: QueryResponse<T>, suffix = "") {
  if (!import.meta.env.DEV) return;
  const failingTable = response.error?.code === "42501" ? table : null;
  const payload = {
    sqlGenerated: equivalentSql(table, select, suffix),
    supabaseSelect: `from("${table}").select(${JSON.stringify(select)})`,
    embeddedTables: embeddedTablesFor(table, select),
    httpStatus: response.status,
    supabaseError: errorSummary(response.error),
    failingTable,
  };
  console.info(`[HalaqaQueryAudit:${context}] SELECT`, payload);
  if (failingTable) {
    console.error(`[HalaqaQueryAudit:${context}] 42501 permission denied`, payload);
  }
}

export async function auditEmbeddedHalaqaRelations(supabase: SupabaseLike, context: string) {
  if (!import.meta.env.DEV || seenAudits.has(context)) return;
  seenAudits.add(context);

  console.groupCollapsed(`[HalaqaQueryAudit:${context}] embedded relation audit`);
  for (const test of RELATION_TESTS) {
    const response = await supabase.from(test.table).select(test.select).limit(1) as QueryResponse<unknown[]>;
    logHalaqaSelect(context, test.table, test.select, response, "limit 1");
  }
  console.groupEnd();
}

export function embeddedTablesFor(table: string, select: string) {
  const embedded = new Set<string>();
  if (table !== "halaqas") embedded.add(table);
  if (select.includes("student_halaqas")) embedded.add("student_halaqas");
  if (select.includes("profiles") || select.includes("teacher:") || select.includes("supervisor:") || select.includes("student:")) embedded.add("profiles");
  if (select.includes("subscriptions")) embedded.add("subscriptions");
  if (select.includes("parent_links")) embedded.add("parent_links");
  if (select.includes("user_roles")) embedded.add("user_roles");
  return Array.from(embedded);
}

export async function selectOrThrow<T>(
  context: string,
  table: string,
  select: string,
  query: PromiseLike<any>,
  suffix = "",
) {
  const response = await query as QueryResponse<T>;
  logHalaqaSelect(context, table, select, response, suffix);
  if (response.error) {
    const tableLabel = response.error.code === "42501" ? ` (${table})` : "";
    throw new Error(`${response.error.message}${tableLabel}`);
  }
  return response.data;
}

export async function attachHalaqaPeople<T extends { teacher_id?: string | null; supervisor_id?: string | null }>(
  supabase: SupabaseLike,
  context: string,
  halaqas: T[],
) {
  const ids = Array.from(new Set(halaqas.flatMap((h) => [h.teacher_id, h.supervisor_id]).filter(Boolean))) as string[];
  if (!ids.length) return halaqas.map((h) => ({ ...h, teacher: null, supervisor: null }));

  const profiles = await selectOrThrow<Array<{ id: string; full_name: string | null; avatar_url?: string | null }>>(
    context,
    "profiles",
    "id, full_name, avatar_url",
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids),
    `where id in (${ids.join(",")})`,
  ) ?? [];

  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  return halaqas.map((h) => ({
    ...h,
    teacher: h.teacher_id ? (byId.get(h.teacher_id) ?? null) : null,
    supervisor: h.supervisor_id ? (byId.get(h.supervisor_id) ?? null) : null,
  }));
}

export async function attachStudentCounts<T extends { id: string }>(supabase: SupabaseLike, context: string, halaqas: T[]) {
  const ids = halaqas.map((h) => h.id);
  if (!ids.length) return halaqas.map((h) => ({ ...h, students: [{ count: 0 }] }));

  const memberships = await selectOrThrow<Array<{ halaqa_id: string }>>(
    context,
    "student_halaqas",
    "halaqa_id",
    supabase.from("student_halaqas").select("halaqa_id").in("halaqa_id", ids),
    `where halaqa_id in (${ids.join(",")})`,
  ) ?? [];

  const counts = memberships.reduce((map, membership) => {
    map.set(membership.halaqa_id, (map.get(membership.halaqa_id) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return halaqas.map((h) => ({ ...h, students: [{ count: counts.get(h.id) ?? 0 }] }));
}