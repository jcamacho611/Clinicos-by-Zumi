import { ShieldCheck } from "lucide-react";
import { requireClinicSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listOrganizationLegalAcceptances } from "@/lib/legal/legal-access";

export default async function AdminLegalPage() {
  const session = await requireClinicSession();
  const authorized = can(session.role, "settings", "manage");

  if (!authorized) {
    return (
      <section className="rounded-[28px] border border-[#e6817b]/12 bg-[#0b0507] p-7 text-[#f8efed]">
        <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Legal evidence</p>
        <h1 className="mt-3 text-3xl font-light tracking-[-.045em] text-[#fff8f6]">Access denied.</h1>
        <p className="mt-3 text-sm leading-7 text-[#9f8985]">Only an authorized organization administrator may inspect agreement execution evidence. Signatures and document snapshots are not exposed through this administrative list.</p>
      </section>
    );
  }

  const acceptances = await listOrganizationLegalAcceptances(session).catch(() => []);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#e6817b]/12 bg-[#0b0507] p-6 text-[#f8efed] sm:p-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Legal evidence</p>
        <h1 className="mt-3 text-3xl font-light tracking-[-.045em] text-[#fff8f6]">Agreement execution</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9f8985]">Tenant-scoped evidence showing which authenticated users executed which agreement version. This view intentionally omits signature contents and exact agreement snapshots.</p>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#e6817b]/12 bg-[#0b0507] text-[#f8efed]">
        {!acceptances.length ? <p className="p-7 text-sm text-[#8f7773]">No executed agreements are recorded for this organization.</p> : <div className="divide-y divide-[#e6817b]/10">{acceptances.map((record) => (
          <article className="grid gap-4 p-5 sm:grid-cols-[1.15fr_.75fr_.75fr] sm:p-6" key={record.id}>
            <div className="min-w-0"><p className="flex items-center gap-2 text-xs font-semibold text-[#f4e4e1]"><ShieldCheck className="size-4 text-[#e6817b]" />{record.legalName || record.email}</p><p className="mt-1 break-all text-[11px] text-[#806965]">{record.email}</p><p className="mt-2 break-all font-mono text-[11px] leading-4 text-[#655653]">{record.id}</p></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#725d59]">Agreement</p><p className="mt-2 text-xs text-[#d8c1bd]">{record.documentKey}</p><p className="mt-1 text-[11px] text-[#806965]">v{record.documentVersion}</p></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#725d59]">Execution</p><p className="mt-2 text-xs text-[#d8c1bd]">{new Date(record.signedAt ?? record.acceptedAt).toLocaleString()}</p><p className="mt-1 text-[11px] capitalize text-[#806965]">{record.signerCapacity.replaceAll("_", " ")} · {record.status}</p></div>
          </article>
        ))}</div>}
      </section>
    </div>
  );
}
