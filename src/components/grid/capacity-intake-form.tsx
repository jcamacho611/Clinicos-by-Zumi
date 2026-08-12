"use client";

import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, LoaderCircle, MapPin, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#174ea6] focus:ring-4 focus:ring-blue-50";

export function CapacityIntakeForm() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState("Treatment room");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NY");
  const [availability, setAvailability] = useState("");
  const [uses, setUses] = useState("");
  const [rate, setRate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const steps = [
    { title: "What are you listing?", icon: Building2 },
    { title: "Where is it?", icon: MapPin },
    { title: "When can Grid use it?", icon: CheckCircle2 },
    { title: "What can it be used for?", icon: CheckCircle2 },
    { title: "What do you want for it?", icon: WalletCards },
  ] as const;

  if (submitted) {
    return <div className="border border-emerald-200 bg-white p-7"><CheckCircle2 className="size-8 text-emerald-600"/><h3 className="mt-4 text-2xl font-black tracking-[-.04em] text-slate-950">Capacity draft created.</h3><p className="mt-3 text-sm leading-7 text-slate-600">Your basic listing is ready for account connection and review. It will not become publicly marketplace-visible until the owner account and applicable review requirements are complete.</p></div>;
  }

  async function next() {
    if (step < 4) return setStep((s) => s + 1);
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setBusy(false);
    setSubmitted(true);
  }

  return <div className="border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
    <div className="flex flex-wrap gap-2">{steps.map((item,index)=><button key={item.title} className={`rounded-full border px-3 py-2 text-[11px] font-extrabold ${index===step?"border-[#174ea6] bg-[#174ea6] text-white":index<step?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-slate-200 text-slate-400"}`} onClick={()=>index<=step&&setStep(index)} type="button">{index+1}</button>)}</div>
    <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Step {step+1} of 5</p>
    <h3 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">{steps[step].title}</h3>

    {step===0 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Capacity type<select className={field} value={type} onChange={(e)=>setType(e.target.value)}><option>Treatment room</option><option>Chair</option><option>Exam room</option><option>Procedure room</option><option>Office</option><option>Training room</option><option>Lab capacity</option><option>Imaging capacity</option><option>Other healthcare capacity</option></select></label><label className="text-xs font-bold text-slate-600">Listing name<Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Example: Saturday treatment room"/></label></div>}
    {step===1 && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">City<Input value={city} onChange={(e)=>setCity(e.target.value)}/></label><label className="text-xs font-bold text-slate-600">State<Input value={state} maxLength={2} onChange={(e)=>setState(e.target.value.toUpperCase())}/></label></div>}
    {step===2 && <label className="mt-6 block text-xs font-bold text-slate-600">Availability<Input value={availability} onChange={(e)=>setAvailability(e.target.value)} placeholder="Example: Saturdays 10 AM–6 PM"/></label>}
    {step===3 && <label className="mt-6 block text-xs font-bold text-slate-600">Permitted uses<textarea className={`${field} min-h-28 py-3`} value={uses} onChange={(e)=>setUses(e.target.value)} placeholder="Example: consultations, wellness services, injectables where permitted..."/></label>}
    {step===4 && <label className="mt-6 block text-xs font-bold text-slate-600">Rate or pricing preference<Input value={rate} onChange={(e)=>setRate(e.target.value)} placeholder="$75/hour, $400/day, or request quote"/></label>}

    <div className="mt-8 flex justify-between gap-3"><Button disabled={step===0} onClick={()=>setStep((s)=>Math.max(0,s-1))} variant="secondary">Back</Button><Button disabled={busy || (step===0 && !name) || (step===1 && (!city || !state))} onClick={next}>{busy?<LoaderCircle className="size-4 animate-spin"/>:null}{step===4?"Create draft":"Continue"}<ArrowRight className="size-4"/></Button></div>
  </div>;
}
