import type { Metadata } from "next";
import { Route, ShieldCheck, Siren, Users } from "lucide-react";
import { NavigationDraftActions, NavigationReviewActions } from "@/components/clinic/patient-navigation-actions";
import { requireClinicSession } from "@/lib/auth/session";
import { listPatientNavigationWorkspace } from "@/lib/repositories/patient-navigation-repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Patient Navigation — Klinikos",
  description: "Route administrative patient requests into human-reviewed next steps without autonomous clinical advice.",
};

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default async function PatientNavigationPage() {
  const session = await requireClinicSession();
  const workspace = await listPatientNavigationWorkspace(session.organizationId);
  const openTasks = workspace.tasks.filter((task) => task.status === "open");
  const pendingDrafts = workspace.drafts.filter((draft) => draft.status === "draft");
  const openEscalations = workspace.escalations.filter((entry) => entry.status === "open");

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#e6817b]/16 bg-[#090405] px-5 py-9 text-[#fff8f6] sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(151,42,53,.24),transparent_38%),linear-gradient(135deg,rgba(230,129,123,.05),transparent_58%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-[#efaaa1]"><Route className="size-4" /><p className="text-[10px] font-extrabold uppercase tracking-[.22em]">Administrative navigation</p></div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Turn patient requests into owned, reviewable next steps.</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b59b97]">Klinikos can classify and draft an administrative handoff, create staff work, and escalate urgent language. Every draft stays blocked from send until a human reviews it. This surface does not diagnose, prescribe, or answer clinical questions autonomously.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: "Open tasks", value: openTasks.length, icon: Users }, { label: "Drafts to review", value: pendingDrafts.length, icon: ShieldCheck }, { label: "Open escalations", value: openEscalations.length, icon: Siren }].map(({ label, value, icon: Icon }) => <div className="rounded-[1.3rem] border border-[#e6817b]/12 bg-[#14090c]/75 p-4" key={label}><Icon className="size-4 text-[#efaaa1]" /><p className="mt-4 text-2xl font-semibold">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#8f7773]">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <div className="rounded-[1.6rem] border border-[#e6817b]/11 bg-[#0d0608] text-[#fff8f6]">
          <div className="border-b border-[#e6817b]/10 px-5 py-5"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#efaaa1]">New request</p><h2 className="mt-2 text-xl font-semibold">Prepare a review draft</h2><p className="mt-2 text-[10px] leading-5 text-[#8f7773]">The request becomes a blocked draft plus owned staff work. Human review remains authoritative.</p></div>
          {workspace.patients.length ? <NavigationDraftActions patients={workspace.patients} /> : <p className="p-5 text-xs leading-6 text-[#9f8985]">No active patients are available in this organization.</p>}
        </div>

        <div className="rounded-[1.6rem] border border-[#e6817b]/11 bg-[#0d0608] p-5 text-[#fff8f6] sm:p-6">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d6b787]">Human review queue</p><h2 className="mt-2 text-xl font-semibold">Navigation drafts waiting on a person</h2></div>
          {pendingDrafts.length ? <div className="mt-5 divide-y divide-[#e6817b]/10 border-y border-[#e6817b]/10">{pendingDrafts.map((draft) => <article className="py-5" key={draft.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{draft.patientName}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#8f7773]">{draft.purpose.replaceAll("_", " ")} · {draft.riskLevel}</p></div><span className="rounded-full border border-[#d6b787]/15 bg-[#d6b787]/[.05] px-2.5 py-1 text-[9px] font-bold text-[#d6b787]">Blocked from send</span></div><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-[#b7a19c]">{draft.content}</p><NavigationReviewActions draftId={draft.id} disabled={!draft.blockedFromSend} /></article>)}</div> : <p className="mt-5 border-y border-[#e6817b]/10 py-6 text-xs text-[#8f7773]">No patient-navigation drafts are waiting for review.</p>}
        </div>
      </section>

      <section className="mt-6 rounded-[1.6rem] border border-[#e6817b]/11 bg-[#100708] p-5 text-[#fff8f6] sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#efaaa1]">Open navigation work</p>
        {openTasks.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{openTasks.slice(0, 12).map((task) => <div className="rounded-xl border border-[#e6817b]/10 bg-[#0d0608] p-4" key={task.id}><p className="text-xs font-semibold">{task.title}</p><p className="mt-2 text-[10px] text-[#9f8985]">{task.patientName} · {formatDate(task.dueAt)}</p><p className="mt-2 text-[9px] font-bold uppercase tracking-[.12em] text-[#d6b787]">{task.riskLevel}</p></div>)}</div> : <p className="mt-4 text-xs text-[#8f7773]">No open navigation tasks.</p>}
      </section>
    </main>
  );
}
