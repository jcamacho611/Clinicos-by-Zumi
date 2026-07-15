import { ClipboardCheck, FilePlus2, Send, Signature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro, Progress, SectionCard, StatusBadge } from "@/components/clinic/workspace-kit";

export function FormsWorkspace() {
  const forms = [
    { title: "New patient intake", use: "Primary care", fields: 32, status: "Active", completion: 88 },
    { title: "Telemedicine consent", use: "All virtual visits", fields: 9, status: "Active", completion: 96 },
    { title: "Chronic care follow-up", use: "Primary care", fields: 18, status: "Active", completion: 91 },
    { title: "No-fault intake", use: "Case management", fields: 41, status: "Draft", completion: 64 },
  ];
  return <div className="space-y-6"><PageIntro title="Intake that arrives chart-ready." description="Build conditional forms, collect signatures, route reviews, lock submissions, and attach the approved record directly to the patient chart." action={<Button variant="primary"><FilePlus2 className="size-4" /> New template</Button>} aside={<Button variant="secondary"><Send className="size-4" /> Send forms</Button>} />
    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><SectionCard title="Form templates" description="Templates are scoped by organization, location, and appointment type."><div className="grid gap-3 p-4 sm:grid-cols-2">{forms.map((form) => <div className="rounded-2xl border border-slate-200 p-4" key={form.title}><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><ClipboardCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{form.title}</p><p className="mt-1 text-[10px] text-slate-400">{form.use} · {form.fields} fields</p></div><StatusBadge status={form.status} /></div><div className="mt-5 flex items-center justify-between text-[9px] font-bold text-slate-400"><span>COMPLETION RATE</span><span>{form.completion}%</span></div><div className="mt-2"><Progress value={form.completion} /></div></div>)}</div></SectionCard><div className="space-y-6"><Card className="bg-[#dff7f1] p-6"><Signature className="size-6 text-teal-700" /><p className="mt-5 text-xl font-extrabold tracking-[-.035em] text-slate-950">Signed and traceable.</p><p className="mt-3 text-xs leading-6 text-slate-600">Every submission keeps template version, timestamp, signer context, review state, lock state, and patient-chart attachment history.</p></Card><SectionCard title="Incomplete today"><div className="space-y-2 p-3">{[["Elena Rivera", "New patient intake", "72%"], ["Lena Morris", "Telemedicine consent", "Not started"], ["Jordan Kim", "No-fault intake", "44%"]].map(([patient, form, progress]) => <div className="rounded-xl border border-slate-100 p-3" key={patient}><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-900">{patient}</p><p className="mt-1 text-[10px] text-slate-400">{form}</p></div><Badge tone="amber">{progress}</Badge></div><Button className="mt-3 w-full" size="sm" variant="secondary"><Send className="size-3.5" /> Send reminder</Button></div>)}</div></SectionCard></div></section>
  </div>;
}
