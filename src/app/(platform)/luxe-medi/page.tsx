import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LuxeMediNav } from "@/components/clinic/luxe-medi-nav";
import { LuxeMediWorkspace } from "@/components/clinic/luxe-medi-workspace";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { listLuxeMediWorkspace } from "@/lib/repositories/luxe-medi-repository";

export const metadata: Metadata = {
  title: "Luxe Medi Studio",
};

export default async function LuxeMediPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "luxe_medi", "read")) return notFound();
  const workspace = await listLuxeMediWorkspace(session);

  return (
    <div className="space-y-4">
      <LuxeMediNav />
      <LuxeMediWorkspace
        canCreate={can(session.role, "luxe_medi", "create")}
        canManage={can(session.role, "luxe_medi", "manage")}
        canUpdate={can(session.role, "luxe_medi", "update")}
        workspace={workspace}
      />
    </div>
  );
}
