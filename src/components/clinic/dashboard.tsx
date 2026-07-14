"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  ArrowUpRight, CalendarCheck2, CheckCircle2, CircleDollarSign, Clock3,
  FileWarning, FlaskConical, PhoneMissed, ShieldAlert, UsersRound,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { tasks } from "@/lib/clinic-data";
import type { Appointment } from "@/lib/types";


const flow = [
  { day: "Mon", visits: 17, completion: 82 }, { day: "Tue", visits: 21, completion: 88 },
  { day: "Wed", visits: 19, completion: 87 }, { day: "Thu", visits: 24, completion: 92 },
  { day: "Fri", visits: 18, completion: 89 }, { day: "Sat", visits: 8, completion: 96 },
];

const statusTone: Record<string, BadgeTone> = {
  "Checked In": "teal", "In Room": "sky", Confirmed: "slate", Urgent: "rose", High: "amber",
};

export function Dashboard({ appointments, userName }: { appointments: Appointment[]; userName: string }) {
  const firstName = userName.split(/\s+/)[0] || "there";
  const metrics = [
    { label: "Visits today", value: String(appointments.length), change: "Live from the schedule", icon: CalendarCheck2, tone: "bg-[#dff7f1] text-teal-700" },
    { label: "Clinical review", value: "3", change: "2 results · 1 message", icon: ShieldAlert, tone: "bg-rose-50 text-rose-600" },
    { label: "Open claims", value: "$8,420", change: "$2,180 needs action", icon: CircleDollarSign, tone: "bg-amber-50 text-amber-700" },
    { label: "Care gaps closed", value: "12", change: "+18% this month", icon: CheckCircle2, tone: "bg-sky-50 text-sky-700" },
  ];
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] bg-[#102033] p-6 text-white shadow-[0_24px_60px_rgba(16,32,51,.2)] sm:p-8">
        <div className="absolute -right-28 -top-36 size-[360px] rounded-full border-[70px] border-teal-300/10" />
        <div className="absolute bottom-0 right-[18%] h-24 w-24 rounded-full bg-lime-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-teal-300">Tuesday, July 14 · 9:48 AM</p>
            <h2 className="mt-3 max-w-2xl text-balance text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Good morning, {firstName}. The clinic is moving.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Three items need human review before the next appointment block. Everything else is on track.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-100" variant="secondary"><Link href="/patients">Open patient charts <ArrowUpRight className="size-4" /></Link></Button>
            <Button asChild className="border-white/15 bg-white/8 text-white hover:bg-white/15" variant="secondary"><Link href="/schedule">View schedule</Link></Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 12 }} key={metric.label} transition={{ delay: index * 0.06, duration: 0.35 }}>
            <Card className="metric-sheen h-full">
              <CardContent>
                <div className={`grid size-10 place-items-center rounded-xl ${metric.tone}`}><metric.icon className="size-5" /></div>
                <p className="mt-5 text-3xl font-extrabold tracking-[-.05em] text-slate-950">{metric.value}</p>
                <p className="mt-1 text-xs font-bold text-slate-700">{metric.label}</p>
                <p className="mt-2 text-[10px] font-semibold text-slate-400">{metric.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card>
          <CardHeader>
            <div><p className="text-sm font-extrabold text-slate-950">Today&apos;s patient flow</p><p className="mt-1 text-[11px] text-slate-500">Live operational readiness across both clinic locations.</p></div>
            <Button asChild size="sm" variant="ghost"><Link href="/front-desk">Front desk <ArrowUpRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[690px] border-separate border-spacing-0 text-left">
                <thead><tr className="text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400"><th className="border-b border-slate-100 pb-3">Time</th><th className="border-b border-slate-100 pb-3">Patient</th><th className="border-b border-slate-100 pb-3">Visit</th><th className="border-b border-slate-100 pb-3">Readiness</th><th className="border-b border-slate-100 pb-3">Status</th></tr></thead>
                <tbody>{appointments.map((appointment) => <tr className="text-xs" key={appointment.id}><td className="border-b border-slate-100 py-4 font-extrabold text-slate-950">{appointment.time}</td><td className="border-b border-slate-100 py-4"><Link className="flex items-center gap-3" href={`/patients/${appointment.patientId}`}><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-[10px] font-extrabold text-slate-600">{appointment.initials}</span><span><span className="block font-bold text-slate-900">{appointment.patient}</span><span className="mt-0.5 block text-[10px] text-slate-400">{appointment.provider}</span></span></Link></td><td className="border-b border-slate-100 py-4 text-slate-600">{appointment.type}</td><td className="border-b border-slate-100 py-4"><div className="flex gap-1.5"><span className={`size-2 rounded-full ${appointment.formsComplete ? "bg-teal-500" : "bg-amber-400"}`} title="Forms" /><span className={`size-2 rounded-full ${appointment.insuranceVerified ? "bg-teal-500" : "bg-amber-400"}`} title="Insurance" /><span className={`size-2 rounded-full ${appointment.paymentDue === 0 ? "bg-teal-500" : "bg-slate-300"}`} title="Payment" /></div></td><td className="border-b border-slate-100 py-4"><Badge tone={statusTone[appointment.status] ?? "slate"}>{appointment.status}</Badge></td></tr>)}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><div><p className="text-sm font-extrabold text-slate-950">Completion pulse</p><p className="mt-1 text-[11px] text-slate-500">Encounter close-out, last 6 clinic days.</p></div><Badge tone="teal">89%</Badge></CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer height="100%" width="100%"><AreaChart data={flow}><defs><linearGradient id="completion" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0e9f83" stopOpacity={0.34} /><stop offset="100%" stopColor="#0e9f83" stopOpacity={0} /></linearGradient></defs><XAxis axisLine={false} dataKey="day" fontSize={10} tickLine={false} tick={{ fill: "#94a3b8" }} /><Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 11 }} /><Area dataKey="completion" fill="url(#completion)" stroke="#0e9f83" strokeWidth={2.5} type="monotone" /></AreaChart></ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold text-slate-400">AVG. CLOSE TIME</p><p className="mt-1 text-lg font-extrabold text-slate-950">1h 24m</p></div><div className="rounded-xl bg-teal-50 p-3"><p className="text-[9px] font-bold text-teal-700">SIGNED TODAY</p><p className="mt-1 text-lg font-extrabold text-slate-950">8 / 9</p></div></div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><div><p className="text-sm font-extrabold text-slate-950">Priority work queue</p><p className="mt-1 text-[11px] text-slate-500">Ordered by safety, timing, and operational impact.</p></div><Button asChild size="sm" variant="ghost"><Link href="/tasks">All tasks</Link></Button></CardHeader>
          <CardContent className="space-y-2 pt-4">{tasks.slice(0, 4).map((task) => <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50" key={task.id}><span className={`grid size-9 place-items-center rounded-xl ${task.category === "Clinical" ? "bg-rose-50 text-rose-600" : task.category === "Billing" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>{task.category === "Clinical" ? <FlaskConical className="size-4" /> : task.category === "Billing" ? <FileWarning className="size-4" /> : <Clock3 className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-900">{task.title}</p><p className="mt-1 text-[10px] text-slate-400">{task.patient} · {task.owner}</p></div><Badge tone={statusTone[task.priority] ?? "slate"}>{task.priority}</Badge></div>)}</CardContent>
        </Card>

        <Card>
          <CardHeader><div><p className="text-sm font-extrabold text-slate-950">Front-door signals</p><p className="mt-1 text-[11px] text-slate-500">New requests and recovery opportunities.</p></div><Button asChild size="sm" variant="ghost"><Link href="/messages">Open inbox</Link></Button></CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-950 p-4 text-white"><PhoneMissed className="size-5 text-lime-300" /><p className="mt-5 text-2xl font-extrabold">4</p><p className="mt-1 text-xs font-bold">Missed calls</p><p className="mt-2 text-[10px] leading-5 text-slate-400">3 received an automatic acknowledgment. 1 needs callback.</p></div>
            <div className="rounded-2xl bg-[#e1f6f2] p-4"><UsersRound className="size-5 text-teal-700" /><p className="mt-5 text-2xl font-extrabold text-slate-950">7</p><p className="mt-1 text-xs font-bold text-slate-900">New requests</p><p className="mt-2 text-[10px] leading-5 text-slate-500">Appointment and intake requests waiting for staff review.</p></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
