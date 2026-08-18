import { Blocks, Check, Cloud, ShieldAlert, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageIntro, SectionCard, StatCard, StatusBadge } from "@/components/clinic/workspace-kit";

type ConnectionRow = {
  name: string;
  purpose: string;
  state: string;
  risk: string;
  requirement: string;
  phase: string;
};

const connections: ConnectionRow[] = [
  { name: "Twilio", purpose: "SMS transport, Verify, signed STOP/START callbacks", state: "Pending Connection", risk: "High", requirement: "Platform credentials + sender assignment + messaging registration + consent + live proof", phase: "Phase 2" },
  { name: "Stripe", purpose: "Payments and governed financial evidence", state: "Pending Connection", risk: "Medium", requirement: "Exact environment configuration + signed webhook + controlled live proof", phase: "Phase 2" },
  { name: "270 / 271", purpose: "Eligibility", state: "Roadmap", risk: "Medium", requirement: "Clearinghouse enrollment + contract", phase: "Phase 3" },
  { name: "837 / 835", purpose: "Claims and remittance", state: "Roadmap", risk: "High", requirement: "Clearinghouse enrollment + controls", phase: "Phase 3" },
  { name: "FHIR / SMART", purpose: "Clinical interoperability", state: "Roadmap", risk: "High", requirement: "Counterparty authorization + security review", phase: "Phase 4" },
  { name: "HL7 lab feeds", purpose: "Inbound orders and results", state: "Roadmap", risk: "High", requirement: "Vendor interface + contractual/privacy review", phase: "Phase 4" },
  { name: "Quest Diagnostics", purpose: "Lab orders and results", state: "Manual demo", risk: "High", requirement: "Vendor contract + production interface", phase: "Phase 4" },
  { name: "Labcorp", purpose: "Lab orders and results", state: "Manual demo", risk: "High", requirement: "Vendor contract + production interface", phase: "Phase 4" },
  { name: "BioReference", purpose: "Lab orders and results", state: "Manual demo", risk: "High", requirement: "Vendor contract + production interface", phase: "Phase 4" },
  { name: "Radiology / imaging", purpose: "Orders and source reports", state: "Manual demo", risk: "High", requirement: "Production interface + security/privacy review", phase: "Phase 5" },
  { name: "276 / 277 / 278", purpose: "Claim status and prior authorization", state: "Roadmap", risk: "High", requirement: "Clearinghouse enrollment + controls", phase: "Phase 5" },
  { name: "Telemedicine vendor", purpose: "Secure virtual visits", state: "Roadmap", risk: "High", requirement: "Vendor contract + approved production configuration", phase: "Phase 3" },
];

export function ConnectionsWorkspaceReal() {
  const pending = connections.filter((item) => item.state === "Pending Connection").length;
  const manual = connections.filter((item) => item.state === "Manual demo").length;
  const highRisk = connections.filter((item) => item.risk === "High").length;

  return (
    <div className="space-y-6">
      <PageIntro
        title="Connection truth, not integration theater."
        description="A built adapter is not a connected vendor. A configured vendor is not a verified live workflow. Each row states the strongest claim Klinikos can currently defend."
        action={<Button disabled title="Export is not wired yet" variant="secondary"><Blocks className="size-4" /> Export roadmap</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard accent="teal" detail="Product code exists; external proof remains separate" icon={<Check className="size-4" />} label="Adapter paths" value="2" />
        <StatCard accent="sky" detail="External account or operator work remains" icon={<Webhook className="size-4" />} label="Pending connection" value={String(pending)} />
        <StatCard accent="amber" detail="Requires heightened contractual or security review" icon={<ShieldAlert className="size-4" />} label="High-risk" value={String(highRisk)} />
        <StatCard accent="slate" detail="Truthful manual or synthetic operating paths" icon={<Cloud className="size-4" />} label="Manual demo" value={String(manual)} />
      </div>

      <SectionCard title="Connection capability matrix" description="No row below claims live connectivity solely because code, a credential field, or a vendor account exists.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-extrabold uppercase tracking-[.08em] text-slate-500">
                <th className="px-5 py-3">Connection</th><th className="px-3 py-3">Purpose</th><th className="px-3 py-3">Current state</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">What still proves it</th><th className="px-5 py-3">Phase</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((item) => (
                <tr className="border-b border-slate-100 text-sm last:border-0" key={item.name}>
                  <td className="px-5 py-4 font-extrabold text-slate-950">{item.name}</td>
                  <td className="px-3 py-4 text-slate-700">{item.purpose}</td>
                  <td className="px-3 py-4"><StatusBadge status={item.state} /></td>
                  <td className="px-3 py-4"><StatusBadge status={item.risk} /></td>
                  <td className="px-3 py-4 text-slate-600">{item.requirement}</td>
                  <td className="px-5 py-4"><Badge tone="slate">{item.phase}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
