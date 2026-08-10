"use client";

import { useMemo, useState } from "react";

const steps = ["Prospect", "Qualify", "Find pain", "Quantify", "Sell audit", "Collect payment", "Audit", "Prove value", "Founding clinic", "Implement"];

type Form = {
  clinic: string; decisionMaker: string; locations: number; providers: number; staff: number;
  encounters: number; revenueBand: string; insuranceMix: string; billing: string; monthlyTech: number;
  knownLeakage: number; ehr: string; biggestPain: string; afterHours: number; referrals: boolean;
  labs: boolean; claims: boolean; multiLocation: boolean;
};

const initial: Form = { clinic:"", decisionMaker:"", locations:1, providers:1, staff:1, encounters:0, revenueBand:"unknown", insuranceMix:"mixed", billing:"unknown", monthlyTech:0, knownLeakage:0, ehr:"", biggestPain:"", afterHours:0, referrals:false, labs:false, claims:false, multiLocation:false };

export default function SalesQualificationPage() {
  const [form, setForm] = useState<Form>(initial);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(v => ({...v,[key]:value}));
  const score = useMemo(() => {
    let s=0;
    s += Math.min(20, form.providers*3 + form.locations*4);
    s += form.decisionMaker ? 15 : 0;
    s += Math.min(15, (form.referrals?5:0)+(form.labs?5:0)+(form.claims?5:0));
    s += form.insuranceMix !== "cash" ? 10 : 3;
    s += Math.min(10, form.monthlyTech >= 5000 ? 10 : form.monthlyTech >= 2000 ? 7 : form.monthlyTech > 0 ? 4 : 0);
    s += Math.min(10, form.knownLeakage >= 5000 ? 10 : form.knownLeakage > 0 ? 6 : 0);
    s += form.locations > 1 || form.multiLocation ? 10 : form.providers >= 3 ? 6 : 2;
    s += form.afterHours >= 10 ? 5 : form.afterHours > 0 ? 3 : 0;
    s += form.revenueBand === "1m+" ? 5 : form.revenueBand === "500k-1m" ? 3 : 0;
    return Math.min(100,s);
  },[form]);
  const status = score >= 70 ? "QUALIFIED" : score >= 45 ? "MORE INFORMATION REQUIRED" : "DO NOT SELL AUDIT YET";
  const auditPrice = form.providers <= 1 ? 750 : form.providers <= 5 ? 1250 : form.providers <= 15 ? 2500 : form.providers <= 30 ? 4000 : 5000;

  return <main className="min-h-screen bg-[#f6f5f1] text-[#171714] p-6 md:p-10">
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/15 pb-6">
        <div><p className="text-xs uppercase tracking-[.24em] text-black/55">Klinikos Revenue Desk</p><h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Sell the audit. Prove the value.</h1><p className="mt-3 max-w-2xl text-black/65">A guided qualification flow for Founding Clinic prospects. Never invent ROI, compliance claims, or capabilities.</p></div>
        <div className="rounded-full border border-black/20 px-4 py-2 text-sm">Built toward HIPAA-regulated deployment</div>
      </header>

      <div className="overflow-x-auto"><div className="flex gap-2 min-w-max">{steps.map((x,i)=><span key={x} className={`px-3 py-2 rounded-full text-xs ${i<5?"bg-black text-white":"border border-black/20"}`}>{i+1}. {x}</span>)}</div></div>

      <section className="grid lg:grid-cols-[1.5fr_.8fr] gap-6">
        <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm space-y-8">
          <div><p className="text-sm font-semibold">1 · Prospect identity</p><div className="grid md:grid-cols-2 gap-4 mt-4"><Field label="Clinic" value={form.clinic} onChange={v=>set("clinic",v)}/><Field label="Decision maker" value={form.decisionMaker} onChange={v=>set("decisionMaker",v)}/></div></div>
          <div><p className="text-sm font-semibold">2 · Size & economics</p><div className="grid md:grid-cols-3 gap-4 mt-4"><Num label="Locations" value={form.locations} onChange={v=>set("locations",v)}/><Num label="Providers" value={form.providers} onChange={v=>set("providers",v)}/><Num label="Staff" value={form.staff} onChange={v=>set("staff",v)}/><Num label="Patient encounters / month" value={form.encounters} onChange={v=>set("encounters",v)}/><Select label="Annual revenue band" value={form.revenueBand} onChange={v=>set("revenueBand",v)} options={["unknown","under-500k","500k-1m","1m+"]}/><Select label="Insurance mix" value={form.insuranceMix} onChange={v=>set("insuranceMix",v)} options={["mixed","insurance","cash"]}/></div></div>
          <div><p className="text-sm font-semibold">3 · Cost, leakage & fragmentation</p><div className="grid md:grid-cols-2 gap-4 mt-4"><Field label="Current EHR / PM (UNKNOWN is acceptable)" value={form.ehr} onChange={v=>set("ehr",v)}/><Field label="Billing arrangement" value={form.billing} onChange={v=>set("billing",v)}/><Num label="Monthly technology/subscription spend ($)" value={form.monthlyTech} onChange={v=>set("monthlyTech",v)}/><Num label="Known/reported monthly leakage ($)" value={form.knownLeakage} onChange={v=>set("knownLeakage",v)}/><Num label="Owner/admin after-hours per month" value={form.afterHours} onChange={v=>set("afterHours",v)}/><Field label="Biggest operating frustration" value={form.biggestPain} onChange={v=>set("biggestPain",v)}/></div><div className="flex flex-wrap gap-3 mt-5"><Check label="Referral workload" checked={form.referrals} onChange={v=>set("referrals",v)}/><Check label="Lab workflow" checked={form.labs} onChange={v=>set("labs",v)}/><Check label="Claims/denials" checked={form.claims} onChange={v=>set("claims",v)}/><Check label="Multi-location" checked={form.multiLocation} onChange={v=>set("multiLocation",v)}/></div></div>
          <div className="bg-[#171714] text-white rounded-[24px] p-6"><p className="text-xs uppercase tracking-[.2em] text-white/55">Best discovery question</p><p className="text-2xl mt-2">“When you’re done seeing your last patient, how much work is still waiting for you?”</p></div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 self-start">
          <div className="bg-[#171714] text-white rounded-[28px] p-7"><p className="text-xs uppercase tracking-[.2em] text-white/55">Qualification score</p><div className="text-7xl font-semibold mt-2">{score}</div><p className="mt-3 font-semibold">{status}</p><p className="text-sm text-white/60 mt-2">Scores guide the associate. They do not establish guaranteed savings or ROI.</p></div>
          <div className="bg-white rounded-[28px] p-7 shadow-sm"><p className="text-xs uppercase tracking-[.2em] text-black/50">Recommended audit</p><p className="text-4xl font-semibold mt-2">${auditPrice.toLocaleString()}</p><p className="text-sm text-black/60 mt-2">AI-assisted operational analysis + specialist review. Price is based on provider scale.</p></div>
          {score>=70 && <div className="bg-white rounded-[28px] p-7 shadow-sm"><p className="font-semibold">Close script</p><p className="mt-3 text-sm leading-6 text-black/70">“Based on what you’ve shared, your practice qualifies for a Klinikos Operational Audit. We analyze your operating costs, workflows, patient follow-through, revenue leakage and opportunities for consolidation or automation. You receive the findings whether or not you implement Klinikos. For a practice your size, the audit is <strong>${auditPrice.toLocaleString()}</strong>. Would you like me to secure your audit and get the process started?”</p><button className="mt-5 w-full rounded-full bg-black text-white py-3 font-medium">Start audit checkout</button></div>}
          <div className="border border-black/15 rounded-[28px] p-7"><p className="font-semibold">Guardrails</p><ul className="mt-3 text-sm text-black/65 space-y-2"><li>• Never describe Klinikos as HIPAA compliant.</li><li>• Never invent savings, revenue, losses, vendor data, or authority.</li><li>• Label clinic-provided numbers as reported.</li><li>• Human review remains required for clinical and financially sensitive actions.</li><li>• Only demonstrate verified production-ready workflows.</li></ul></div>
        </aside>
      </section>
    </div>
  </main>;
}

function Field({label,value,onChange}:{label:string,value:string,onChange:(v:string)=>void}){return <label className="text-sm"><span className="block text-black/55 mb-2">{label}</span><input className="w-full rounded-2xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black" value={value} onChange={e=>onChange(e.target.value)}/></label>}
function Num({label,value,onChange}:{label:string,value:number,onChange:(v:number)=>void}){return <label className="text-sm"><span className="block text-black/55 mb-2">{label}</span><input type="number" min="0" className="w-full rounded-2xl border border-black/15 bg-[#faf9f6] px-4 py-3 outline-none focus:border-black" value={value} onChange={e=>onChange(Number(e.target.value)||0)}/></label>}
function Select({label,value,onChange,options}:{label:string,value:string,onChange:(v:string)=>void,options:string[]}){return <label className="text-sm"><span className="block text-black/55 mb-2">{label}</span><select className="w-full rounded-2xl border border-black/15 bg-[#faf9f6] px-4 py-3" value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
function Check({label,checked,onChange}:{label:string,checked:boolean,onChange:(v:boolean)=>void}){return <label className={`cursor-pointer rounded-full px-4 py-2 text-sm border ${checked?"bg-black text-white border-black":"border-black/15"}`}><input className="sr-only" type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>{label}</label>}
