import { redirect } from "next/navigation";
import { SalesAdminWorkspace, type SalesAdminWorkspaceData } from "@/components/sales/sales-admin-workspace";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { listSalesDemoWorkspace } from "@/lib/repositories/sales-demo-repository";

export default async function SalesAdminPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "sales", "read")) redirect("/dashboard");
  const workspace = await listSalesDemoWorkspace(session);
  const serialized = JSON.parse(JSON.stringify(workspace)) as SalesAdminWorkspaceData;
  return <SalesAdminWorkspace initialData={serialized} />;
}
