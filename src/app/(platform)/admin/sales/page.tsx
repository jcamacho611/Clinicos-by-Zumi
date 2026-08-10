import Link from "next/link";
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
  const canQualify = can(session.role, "sales", "create");

  return (
    <div className="space-y-5">
      {canQualify && (
        <div className="flex items-center justify-between gap-5 border border-[#0b1e3a]/12 bg-[#faf9f5] px-5 py-4">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#1677a8]">Founding clinic qualification</p>
            <p className="mt-1 text-sm font-bold text-[#0b1e3a]">Run the guided Operational Audit qualification and open secure checkout.</p>
          </div>
          <Link className="shrink-0 bg-[#0b1e3a] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-white transition hover:bg-[#1677a8]" href="/admin/sales/audit">
            Open audit desk
          </Link>
        </div>
      )}
      <SalesAdminWorkspace initialData={serialized} />
    </div>
  );
}
