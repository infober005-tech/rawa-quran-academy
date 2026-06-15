import { lazy, Suspense, type ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const make = <P,>(loader: () => Promise<{ [k: string]: ComponentType<P> }>, name: string) =>
  lazy(async () => {
    const mod = await loader();
    return { default: mod[name] as ComponentType<P> };
  });

export const StudentDashboard = make(() => import("@/features/dashboards/StudentDashboard"), "StudentDashboard");
export const TeacherDashboard = make(() => import("@/features/dashboards/TeacherDashboard"), "TeacherDashboard");
export const SupervisorDashboard = make(() => import("@/features/dashboards/SupervisorDashboard"), "SupervisorDashboard");
export const GeneralSupervisorDashboard = make(() => import("@/features/dashboards/GeneralSupervisorDashboard"), "GeneralSupervisorDashboard");
export const DirectorDashboard = make(() => import("@/features/dashboards/DirectorDashboard"), "DirectorDashboard");
export const ParentDashboard = make(() => import("@/features/dashboards/ParentDashboard"), "ParentDashboard");

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export function LazyDashboard({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>;
}
