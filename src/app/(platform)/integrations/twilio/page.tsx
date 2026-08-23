import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquareText, ShieldCheck } from "lucide-react";
import { TwilioRoutingPanel } from "@/components/clinic/twilio-routing-panel";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Twilio SMS routing" };

export default async function TwilioRoutingPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "integrations", "read")) redirect("/dashboard");
  const canManage = can(session.role, "integrations", "manage");

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-[#071018] p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.16)] sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[.18em] text-cyan-200">Communications control plane</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-.055em]">Twilio patient SMS routing</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Configure tenant routing and prove it against Twilio without turning provider configuration into permission to message a patient or spend money.</p>
          </div>
          <Button asChild variant="secondary"><Link href="/integrations"><ArrowLeft className="size-4" aria-hidden="true" />Back to integrations</Link></Button>
        </div>
      </section>

      <div className="flex gap-3 border border-amber-200 bg-amber-50 p-5 text-xs leading-6 text-amber-900">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p><strong>Authority remains layered.</strong> Provider routing verification, phone possession, SMS permission, template policy, quiet hours, vendor funding, registration, and the production gate are separate controls. This screen manages routing only.</p>
      </div>

      {!canManage ? (
        <div className="flex gap-3 border border-slate-200 bg-white p-5 text-sm text-slate-700"><MessageSquareText className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden="true" /><p>You have read access to Twilio routing state. A role with integration-management permission is required to change or verify routing.</p></div>
      ) : null}

      <TwilioRoutingPanel canManage={canManage} />
    </div>
  );
}
