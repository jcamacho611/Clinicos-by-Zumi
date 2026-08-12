"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const laneConfig = {
  product: { label: "product or supply", examples: "gloves, approved consumables, operational supplies", fulfillment: "pickup, local delivery, shipping, request quote" },
  equipment: { label: "equipment or equipment capacity", examples: "ultrasound time, treatment device, diagnostic equipment", fulfillment: "onsite use, rental, staffed use, request quote" },
  service: { label: "professional service", examples: "billing, credentialing, cybersecurity, consulting", fulfillment: "remote, onsite, project, retainer" },
  education: { label: "education capacity", examples: "preceptor seat, clinical placement, training session", fulfillment: "scheduled cohort, placement, recurring hours" },
  referral: { label: "referral or partner capacity", examples: "specialist consult, imaging capacity, diagnostic availability", fulfillment: "governed referral, consultation, partner handoff" },
} as const;

type Lane = keyof typeof laneConfig;

export function SellerIntakeForm({ lane }: { lane: Lane }) {
  const config = laneConfig[lane];
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [access, setAccess] = useState("");
  const [availability, setAvailability] = useState("");
  const [price, setPrice] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const questions = useMemo(() => [
    `What ${config.label} are you offering?`,
    "Who can buy or access it?",
    "Where and when is it available?",
    "What does it cost?",
    "How is it fulfilled?",
  ], [config.label]);

  if (submitted) return <div className="border border-emerald-200 bg-white p-7"><CheckCircle2 className="size-8 text-emerald-600"/><h3 className="mt-4 text-2xl font-black tracking-[-.04em]">Listing draft created.</h3><p className="mt-3 text-sm leading-7 text-slate-600">Grid captured the minimum useful listing information. Account connection, policy checks, verification, and publication happen next. Restricted or regulated inventory will not be published through the open marketplace lane.</p></div>;

  async function next() {
    if (step < 4) return setStep((s) => s + 1);
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setBusy(false);
    setSubmitted(true);
  }

  const value = [title, access, availability, price, fulfillment][step];
  const setter = [setTitle, setAccess, setAvailability, setPrice, setFulfillment][step];
  const placeholder = [
    `Example: ${config.examples}`,
    "Example: licensed clinics, verified organizations, any approved business buyer",
    "Example: NYC, weekdays, 9 AM–5 PM, 10 units available",
    "$250/session, $50/unit, $1,500/project, or request quote",
    `Example: ${config.fulfillment}`,
  ][step];

  return <div className="border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
    <div className="flex gap-2">{questions.map((q,index)=><button type="button" key={q} onClick={()=>index<=step&&setStep(index)} className={`grid size-9 place-items-center rounded-full border text-xs font-black ${index===step?"border-[#174ea6] bg-[#174ea6] text-white":index<step?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-slate-200 text-slate-400"}`}>{index+1}</button>)}</div>
    <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Step {step+1} of 5</p>
    <h3 className="mt-2 text-2xl font-black tracking-[-.04em]">{questions[step]}</h3>
    <label className="mt-6 block text-xs font-bold text-slate-600">
      {step === 2 || step === 4 ? <textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-[#174ea6] focus:ring-4 focus:ring-blue-50" value={value} onChange={(e)=>setter(e.target.value)} placeholder={placeholder}/> : <Input value={value} onChange={(e)=>setter(e.target.value)} placeholder={placeholder}/>} 
    </label>
    <div className="mt-8 flex justify-between gap-3"><Button disabled={step===0} variant="secondary" onClick={()=>setStep((s)=>Math.max(0,s-1))}>Back</Button><Button disabled={busy || !value.trim()} onClick={next}>{busy?<LoaderCircle className="size-4 animate-spin"/>:null}{step===4?"Create draft":"Continue"}<ArrowRight className="size-4"/></Button></div>
  </div>;
}
