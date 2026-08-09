import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  FileLock2,
  Fingerprint,
  Handshake,
  MapPin,
  Network,
  Orbit,
  Route,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  UsersRound,
  Waypoints,
} from "lucide-react";
import {
  GridAvailabilityCreateAction,
  GridContractorPreferencesAction,
  GridCredentialReviewAction,
  GridLocationCreateAction,
  GridMalpracticeReviewAction,
  GridPayoutTransitionAction,
  GridProviderCreateAction,
  GridProviderTransitionAction,
  GridRequestCreateAction,
  GridRequestTransitionAction,
  GridServiceCreateAction,
} from "@/components/clinic/grid/grid-actions";
import type { GridWorkspace as GridWorkspaceData } from "@/lib/repositories/grid-repository";
import { cn } from "@/lib/utils";

export type GridView = "overview" | "providers" | "locations" | "services" | "availability" | "requests" | "payouts" | "handoffs" | "founding-network" | "admin";

const gridTabs: { view: GridView; label: string; href: string }[] = [
  { view: "overview", label: "Grid command", href: "/grid" },
  { view: "providers", label: "Providers", href: "/grid/providers" },
  { view: "locations", label: "Locations", href: "/grid/locations" },
  { view: "services", label: "Services", href: "/grid/services" },
  { view: "availability", label: "Availability", href: "/grid/availability" },
  { view: "requests", label: "Requests", href: "/grid/requests" },
  { view: "payouts", label: "Payouts", href: "/grid/payouts" },
  { view: "handoffs", label: "Handoffs", href: "/grid/handoffs" },
  { view: "founding-network", label: "Founding network", href: "/grid/founding-network" },
];

const viewMeta: Record<GridView, { eyebrow: string; title: string; description: string; accent: string; glow: string }> = {
  overview: { eyebrow: "Network operating layer", title: "The Grid", description: "A credential-aware command system for providers, services, space, capacity, and controlled handoffs.", accent: "text-cyan-200", glow: "from-cyan-400/20 via-sky-500/5" },
  providers: { eyebrow: "Verified participation", title: "Provider signal", description: "Discover public-safe profiles while human reviewers retain authority over credentials, scope, and activation.", accent: "text-emerald-200", glow: "from-emerald-400/20 via-teal-500/5" },
  locations: { eyebrow: "Physical network", title: "Space atlas", description: "Clinic locations, treatment rooms, chairs, and mobile modes with explicit access requirements.", accent: "text-amber-200", glow: "from-amber-400/20 via-orange-500/5" },
  services: { eyebrow: "Governed marketplace", title: "Service exchange", description: "Transparent service ranges and safety gates, never a clinical-superiority leaderboard.", accent: "text-rose-200", glow: "from-rose-400/20 via-pink-500/5" },
  availability: { eyebrow: "Capacity intelligence", title: "Availability pulse", description: "See when verified providers and approved locations can accept controlled requests.", accent: "text-violet-200", glow: "from-violet-400/20 via-indigo-500/5" },
  requests: { eyebrow: "Human-confirmed workflow", title: "Request rail", description: "Every request moves through provider, location, credential, consent, and payment checks with receipts.", accent: "text-cyan-200", glow: "from-cyan-400/20 via-blue-500/5" },
  payouts: { eyebrow: "Transparent estimates", title: "Payout ledger", description: "Estimated contractor compensation with manual approval and payment references—never an automated payout promise.", accent: "text-emerald-200", glow: "from-emerald-400/20 via-teal-500/5" },
  handoffs: { eyebrow: "No silent chart leakage", title: "Handoff radar", description: "Track administrative intent, capacity, response state, and who needs to act without exposing a chart.", accent: "text-lime-200", glow: "from-lime-400/15 via-emerald-500/5" },
  "founding-network": { eyebrow: "Founding network", title: "Build the first constellation", description: "Invite clinics and providers into a controlled evaluation before contracts, credentials, and production gates are complete.", accent: "text-yellow-200", glow: "from-yellow-400/20 via-amber-500/5" },
  admin: { eyebrow: "Restricted control plane", title: "Grid authority", description: "Sensitive credential fields, verification queues, publication controls, and human decisions remain inside the owning tenant.", accent: "text-fuchsia-200", glow: "from-fuchsia-400/20 via-violet-500/5" },
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}), timeZone: "UTC" }).format(new Date(value));
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SignalBadge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
  const tones = {
    cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    rose: "border-rose-300/20 bg-rose-300/10 text-rose-100",
    violet: "border-violet-300/20 bg-violet-300/10 text-violet-100",
    slate: "border-white/10 bg-white/[0.06] text-white/60",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em]", tones[tone])}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = /verified|active|confirmed|completed|recorded|acknowledged|open_demo/i.test(status)
    ? "emerald"
    : /pending|requested|review|draft|submitted|sent/i.test(status)
      ? "amber"
      : /rejected|expired|suspended|declined|failed|cancelled|escalated/i.test(status)
        ? "rose"
        : "slate";
  return <SignalBadge tone={tone}>{title(status)}</SignalBadge>;
}

function MetricCard({ accent, detail, icon: Icon, label, value }: { accent: string; detail: string; icon: typeof Activity; label: string; value: string }) {
  return <article className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_20px_70px_rgba(0,0,0,.16)]"><div className={cn("absolute -right-8 -top-10 size-24 rounded-full blur-3xl", accent)} /><div className="relative"><span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-white/70"><Icon className="size-4" /></span><p className="mt-5 text-2xl font-black tracking-[-.05em] text-white">{value}</p><p className="mt-1 text-[11px] font-extrabold text-white/75">{label}</p><p className="mt-2 text-[9px] leading-4 text-white/35">{detail}</p></div></article>;
}

function GridHeader({ view }: { view: GridView }) {
  const meta = viewMeta[view];
  return <><section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b13] px-5 py-7 shadow-[0_40px_110px_rgba(2,6,23,.35)] sm:px-8 sm:py-9"><div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent", meta.glow)} /><div className="pointer-events-none absolute inset-0 opacity-[.16] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:48px_48px]" /><div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full border border-cyan-300/15 shadow-[0_0_80px_rgba(34,211,238,.12),inset_0_0_80px_rgba(34,211,238,.06)]" /><div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><SignalBadge tone="cyan"><span className="size-1.5 rounded-full bg-cyan-300" /> Demo</SignalBadge><SignalBadge tone="amber">Human review required</SignalBadge><SignalBadge>PostgreSQL-backed</SignalBadge></div><p className={cn("mt-8 text-[10px] font-black uppercase tracking-[.24em]", meta.accent)}>{meta.eyebrow}</p><h2 className="mt-3 text-4xl font-black tracking-[-.065em] text-white sm:text-5xl lg:text-6xl">{meta.title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">{meta.description}</p></div><div className="relative hidden h-32 w-80 shrink-0 xl:block"><div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_60px_rgba(34,211,238,.2)]"><Orbit className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-cyan-200" /></div><div className="absolute left-2 top-2 size-8 rounded-full border border-emerald-300/25 bg-emerald-300/10" /><div className="absolute bottom-2 left-10 size-6 rounded-full border border-violet-300/25 bg-violet-300/10" /><div className="absolute right-4 top-3 size-9 rounded-full border border-amber-300/25 bg-amber-300/10" /><div className="absolute bottom-0 right-14 size-7 rounded-full border border-rose-300/25 bg-rose-300/10" /><svg aria-hidden="true" className="absolute inset-0 size-full opacity-40"><line stroke="rgb(103 232 249)" strokeDasharray="3 5" x1="40" x2="160" y1="20" y2="64" /><line stroke="rgb(167 243 208)" strokeDasharray="3 5" x1="50" x2="160" y1="112" y2="64" /><line stroke="rgb(253 230 138)" strokeDasharray="3 5" x1="280" x2="160" y1="24" y2="64" /><line stroke="rgb(216 180 254)" strokeDasharray="3 5" x1="250" x2="160" y1="116" y2="64" /></svg></div></div></section><div className="mt-4 rounded-[1.35rem] border border-amber-200/10 bg-amber-200/[0.045] px-4 py-3 text-[10px] leading-5 text-amber-100/70"><strong className="font-extrabold text-amber-100">Synthetic data only.</strong> Do not enter real patient information. The Grid does not expose a chart, approve credentials automatically, determine treatment, settle funds, or guarantee provider eligibility.</div></>;
}

function GridNavigation({ canManage, contractor, view }: { canManage: boolean; contractor: boolean; view: GridView }) {
  const tabs = contractor ? gridTabs.filter((tab) => !["handoffs", "founding-network"].includes(tab.view)) : gridTabs;
  return <nav aria-label="Grid sections" className="mt-5 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <Link className={cn("shrink-0 rounded-xl border px-3 py-2 text-[10px] font-extrabold transition", view === tab.view ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-100" : "border-white/8 bg-white/[0.035] text-white/45 hover:border-white/15 hover:text-white/75")} href={tab.href} key={tab.view}>{tab.label}</Link>)}{canManage && <Link className={cn("shrink-0 rounded-xl border px-3 py-2 text-[10px] font-extrabold transition", view === "admin" ? "border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-100" : "border-white/8 bg-white/[0.035] text-white/45 hover:text-white/75")} href="/admin/grid">Admin Grid</Link>}</nav>;
}

function CommandMetrics({ workspace }: { workspace: GridWorkspaceData }) {
  const metrics = workspace.metrics;
  return <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7"><MetricCard accent="bg-cyan-400/25" detail="Owned profiles not yet verified" icon={UserRoundSearch} label="Verification queue" value={String(metrics.providersPendingVerification)} /><MetricCard accent="bg-violet-400/25" detail="Active governed request states" icon={Route} label="Open requests" value={String(metrics.openServiceRequests)} /><MetricCard accent="bg-amber-400/25" detail="Visible rooms and chairs" icon={Building2} label="Space available" value={String(metrics.availableRooms)} /><MetricCard accent="bg-emerald-400/25" detail="Administrative handoffs still open" icon={Handshake} label="Handoffs waiting" value={String(metrics.handoffsAwaitingResponse)} /><MetricCard accent="bg-sky-400/25" detail="Synthetic network availability" icon={Activity} label="Capacity signals" value={String(metrics.capacityListings)} /><MetricCard accent="bg-rose-400/25" detail="Renewal or coverage attention" icon={CalendarClock} label="Expiring authority" value={String(metrics.expiringCredentials)} /><MetricCard accent="bg-lime-400/25" detail="Sum of active low-price displays" icon={CircleDollarSign} label="Opportunity floor" value={formatMoney(metrics.revenueOpportunitiesCents)} /></section>;
}

function ZumiGuidancePanel({ workspace }: { workspace: GridWorkspaceData }) {
  if (!workspace.guidance) return null;
  return <section className="mt-5 rounded-[1.7rem] border border-lime-300/20 bg-lime-300/[0.07] p-5"><div className="flex items-start gap-4"><Sparkles className="mt-1 size-5 shrink-0 text-lime-200" /><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-lime-200">Zumi administrative guidance</p><h3 className="mt-2 text-xl font-black text-white">{workspace.guidance.title}</h3><ul className="mt-3 space-y-2 text-[10px] leading-5 text-white/55">{workspace.guidance.nextSteps.map((step) => <li className="flex gap-2" key={step}><span className="mt-2 size-1.5 shrink-0 rounded-full bg-lime-300" />{step}</li>)}</ul><p className="mt-3 text-[9px] text-lime-100/50">{workspace.guidance.guardrail}</p></div></div></section>;
}

const commandLinks = [
  { title: "Find providers", detail: "Search verified public-safe profiles", href: "/grid/providers", icon: UsersRound, tone: "text-emerald-200 bg-emerald-300/10" },
  { title: "List availability", detail: "Publish credential-gated capacity", href: "/grid/availability", icon: Clock3, tone: "text-violet-200 bg-violet-300/10" },
  { title: "Rent clinic space", detail: "Review chairs, rooms, and requirements", href: "/grid/locations", icon: Building2, tone: "text-amber-200 bg-amber-300/10" },
  { title: "Send referral", detail: "Open the controlled referral relay", href: "/referrals", icon: Waypoints, tone: "text-cyan-200 bg-cyan-300/10" },
  { title: "Request imaging / PT", detail: "Create a governed service request", href: "/grid/requests", icon: ScanSearch, tone: "text-sky-200 bg-sky-300/10" },
  { title: "Book med spa provider", detail: "Use service and scope gates", href: "/grid/services", icon: Sparkles, tone: "text-rose-200 bg-rose-300/10" },
  { title: "Review credentials", detail: "Human verification authority", href: "/provider-network", icon: BadgeCheck, tone: "text-lime-200 bg-lime-300/10" },
  { title: "Track handoffs", detail: "See response and capacity state", href: "/grid/handoffs", icon: Network, tone: "text-fuchsia-200 bg-fuchsia-300/10" },
] as const;

function OverviewView({ workspace }: { workspace: GridWorkspaceData }) {
  return <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-4 sm:p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200">Grid entry points</p><h3 className="mt-2 text-xl font-black tracking-[-.04em] text-white">Move work, not charts.</h3></div><SignalBadge tone="cyan">8 governed paths</SignalBadge></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{commandLinks.map((item) => <Link className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-3 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]" href={item.href} key={item.title}><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", item.tone)}><item.icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-white">{item.title}</span><span className="mt-1 block text-[9px] text-white/35">{item.detail}</span></span><ArrowUpRight className="size-3.5 text-white/20 transition group-hover:text-cyan-200" /></Link>)}</div></section><section className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0b111d] p-5"><div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_70%_20%,rgba(34,211,238,.22),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(168,85,247,.16),transparent_40%)]" /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-violet-200">Network pulse</p><h3 className="mt-2 text-xl font-black tracking-[-.04em] text-white">Live operating picture</h3></div><span className="relative flex size-3"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-30" /><span className="relative inline-flex size-3 rounded-full bg-emerald-300" /></span></div><div className="mt-6 space-y-4">{workspace.requests.slice(0, 4).map((request, index) => <div className="relative flex gap-3" key={request.id}>{index < Math.min(workspace.requests.length, 4) - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%+4px)] w-px bg-white/10" />}<span className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-[10px] font-black text-cyan-200">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1 pb-2"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-extrabold text-white">{request.serviceName}</p><StatusBadge status={request.status} /></div><p className="mt-1 text-[9px] leading-4 text-white/35">{request.originOrganization} → {request.destinationOrganization} · {request.syntheticClientReference}</p></div></div>)}{!workspace.requests.length && <p className="rounded-2xl border border-dashed border-white/10 p-5 text-xs text-white/35">No governed Grid requests exist yet.</p>}</div></div></section></div>;
}

function ProviderCard({ provider, workspace }: { provider: GridWorkspaceData["providers"][number]; workspace: GridWorkspaceData }) {
  return <article className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"><div className="absolute -right-12 -top-12 size-32 rounded-full bg-emerald-400/10 blur-3xl" /><div className="relative"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-sm font-black text-emerald-100">{provider.displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-white">{provider.displayName}, {provider.credential}</h3><StatusBadge status={provider.verificationStatus} /></div><p className="mt-1 text-[10px] text-white/40">{provider.providerType} · {provider.organizationName}</p><p className="mt-1 text-[9px] text-white/30">{provider.specialty ?? "Specialty review pending"}{provider.subspecialty ? ` / ${provider.subspecialty}` : ""}</p></div>{provider.readyForGrid && <BadgeCheck className="size-5 shrink-0 text-emerald-300" />}</div><p className="mt-4 line-clamp-3 text-[10px] leading-5 text-white/45">{provider.bio ?? "Public-safe provider biography is pending human review."}</p><div className="mt-4 flex flex-wrap gap-1.5"><SignalBadge tone="violet">{provider.experienceLevel}</SignalBadge>{provider.mobileServiceAllowed && <SignalBadge>Mobile</SignalBadge>}{provider.chairRentalAllowed && <SignalBadge>Chair eligible</SignalBadge>}{provider.atHomeAllowed && <SignalBadge>At-home requested</SignalBadge>}</div><div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-black/20 p-3"><div><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/25">License evidence</p><p className="mt-1 text-[10px] font-bold text-white/65">{provider.credentialSummary.filter((item) => item.verificationStatus === "verified").length} verified</p></div><div><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/25">Coverage</p><p className={cn("mt-1 text-[10px] font-bold", provider.malpracticeCurrent ? "text-emerald-200" : "text-amber-200")}>{provider.malpracticeCurrent ? `Current to ${formatDate(provider.malpracticeExpiration)}` : "Review required"}</p></div></div>{provider.owned && provider.legalName && <div className="mt-3 rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/[0.06] p-3"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-fuchsia-200">Admin-only authority record</p><p className="mt-1 text-[10px] text-white/55">Legal name: {provider.legalName} · Policy: {provider.malpracticePolicyNumber ?? "Pending"}</p></div>}<GridProviderTransitionAction canManage={workspace.permissions.canManageCredentialing} canUpdate={workspace.permissions.canUpdateCredentialing} provider={provider} /></div></article>;
}

function ProvidersView({ workspace }: { workspace: GridWorkspaceData }) {
  const selfManaged = workspace.providers.find((provider) => provider.selfManaged);
  return <div className="mt-5 space-y-5"><div className="rounded-[1.4rem] border border-violet-300/15 bg-violet-300/[0.055] p-4 text-[10px] leading-5 text-violet-100/70"><strong className="text-violet-100">Experience tiers are pricing-display context only.</strong> Entry, Intermediate, Experienced, and OG / Master Provider never imply clinical superiority. Credentials, lawful scope, privileges, malpractice coverage, and human approval govern participation.</div>{selfManaged && <GridContractorPreferencesAction provider={selfManaged} />}<div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{workspace.providers.map((provider) => <ProviderCard key={provider.id} provider={provider} workspace={workspace} />)}</div></div>;
}

function LocationsView({ workspace }: { workspace: GridWorkspaceData }) {
  return <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{workspace.locations.map((location) => <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5" key={location.id}><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-amber-300/10 text-amber-200"><MapPin className="size-5" /></span><div className="flex flex-wrap justify-end gap-1.5"><StatusBadge status={location.status} />{location.marketplaceVisible && <SignalBadge tone="cyan">Directory visible</SignalBadge>}</div></div><h3 className="mt-5 text-base font-black tracking-[-.03em] text-white">{location.locationName}</h3><p className="mt-1 text-[10px] text-white/40">{location.organizationName} · {location.locationType}</p><p className="mt-3 text-[10px] leading-5 text-white/45">{location.address}</p><div className="mt-4 flex flex-wrap gap-1.5">{location.roomTypes.map((room) => <SignalBadge key={room}>{room}</SignalBadge>)}</div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-4"><div><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Hourly display</p><p className="mt-1 text-sm font-black text-amber-100">{location.hourlyRateCents !== null ? formatMoney(location.hourlyRateCents) : "Review"}</p></div><div><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Daily display</p><p className="mt-1 text-sm font-black text-amber-100">{location.dailyRateCents !== null ? formatMoney(location.dailyRateCents) : "Review"}</p></div></div><div className="mt-4 rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/25">Entry requirements</p><p className="mt-2 text-[9px] leading-4 text-white/45">{[...location.credentialRequirements, ...location.insuranceRequirements].join(" · ") || "Human location review required"}</p></div></article>)}</div>;
}

function ServicesView({ workspace }: { workspace: GridWorkspaceData }) {
  return <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{workspace.services.map((service) => <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5" key={service.id}><div className="flex flex-wrap items-center justify-between gap-2"><SignalBadge tone="rose">{service.category}</SignalBadge><StatusBadge status={service.status} /></div><h3 className="mt-5 text-lg font-black tracking-[-.035em] text-white">{service.serviceName}</h3><p className="mt-1 text-[10px] text-white/40">{service.providerName} · {service.providerType}</p><p className="mt-4 min-h-14 text-[10px] leading-5 text-white/45">{service.description}</p><div className="mt-4 flex items-end justify-between gap-3 border-t border-white/8 pt-4"><div><p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/25">Pricing display</p><p className="mt-1 text-xl font-black tracking-[-.04em] text-white">{formatMoney(service.priceLowCents)}–{formatMoney(service.priceHighCents)}</p></div><SignalBadge tone={service.providerReady ? "emerald" : "amber"}>{service.providerReady ? "Authority current" : "Authority review"}</SignalBadge></div><div className="mt-4 flex flex-wrap gap-1.5">{service.requiresMedicalReview && <SignalBadge tone="amber">Medical review</SignalBadge>}{service.requiresConsent && <SignalBadge>Consent</SignalBadge>}{service.requiresDeposit && <SignalBadge>Manual deposit</SignalBadge>}{service.mobileAllowed && <SignalBadge>Mobile</SignalBadge>}{service.chairRentalAllowed && <SignalBadge>Chair</SignalBadge>}</div></article>)}</div>;
}

function AvailabilityView({ workspace }: { workspace: GridWorkspaceData }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const slots = workspace.providers.flatMap((provider) => provider.availability.map((slot) => ({ ...slot, provider })));
  return <div className="mt-5 space-y-5">{workspace.permissions.canManageOwnGrid && <GridAvailabilityCreateAction enabled locations={workspace.locations} providers={workspace.providers} />}<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{slots.map((slot) => <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4" key={slot.id}><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-violet-300/10 text-sm font-black text-violet-100">{days[slot.dayOfWeek]}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-white">{slot.provider.displayName}</p><p className="mt-1 text-[9px] text-white/35">{slot.startTime}–{slot.endTime} · {title(slot.locationType)}</p></div><StatusBadge status={slot.status} /></div><div className="mt-3 flex flex-wrap gap-1.5">{slot.location && <SignalBadge><MapPin className="size-2.5" /> {slot.location}</SignalBadge>}{slot.onCall && <SignalBadge tone="violet">On call</SignalBadge>}{slot.mobileRadius > 0 && <SignalBadge>{slot.mobileRadius} mi</SignalBadge>}</div></article>)}{!slots.length && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-white/35">No availability has been published.</p>}</div></div>;
}

function RequestCard({ request, workspace }: { request: GridWorkspaceData["requests"][number]; workspace: GridWorkspaceData }) {
  return <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><SignalBadge tone={request.direction === "inbound" ? "violet" : "cyan"}>{request.direction}</SignalBadge><StatusBadge status={request.status} /></div><h3 className="mt-4 text-base font-black tracking-[-.03em] text-white">{request.serviceName}</h3><p className="mt-1 text-[10px] text-white/40">{request.originOrganization} → {request.destinationOrganization}</p></div><p className="text-right text-[9px] leading-4 text-white/30">{formatDate(request.requestedStartAt, true)}<br />{request.syntheticClientReference}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Provider</p><p className="mt-1 text-[10px] font-bold text-white/65">{request.providerName}</p><p className="mt-1 text-[8px] text-white/30">{request.providerType}</p></div><div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Consent</p><p className="mt-1 text-[10px] font-bold text-white/65">{title(request.consentStatus)}</p><p className="mt-1 text-[8px] text-white/30">{request.requiredConsent ? "Required" : "Not required"}</p></div><div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Deposit</p><p className="mt-1 text-[10px] font-bold text-white/65">{title(request.depositStatus)}</p><p className="mt-1 text-[8px] text-white/30">No processor settlement claimed</p></div></div><p className="mt-4 text-[10px] leading-5 text-white/45">{request.notes}</p><div className="mt-3 flex flex-wrap gap-1.5">{request.safetyFlags.map((flag) => <SignalBadge key={flag} tone={/medical|human/i.test(flag) ? "amber" : "slate"}>{flag}</SignalBadge>)}</div><GridRequestTransitionAction canUpdate={workspace.permissions.canUpdateNetworkRequest || workspace.permissions.canManageNetwork} request={request} /></article>;
}

function RequestsView({ workspace }: { workspace: GridWorkspaceData }) {
  return <div className="mt-5 grid gap-4 xl:grid-cols-2">{workspace.requests.map((request) => <RequestCard key={request.id} request={request} workspace={workspace} />)}{!workspace.requests.length && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-white/35">No Grid requests have been created.</p>}</div>;
}

function PayoutsView({ workspace }: { workspace: GridWorkspaceData }) {
  return <div className="mt-5 grid gap-4 xl:grid-cols-2">{workspace.payouts.map((payout) => <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5" key={payout.id}><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-200">Manual payout record</p><h3 className="mt-2 text-base font-black text-white">{payout.serviceName}</h3><p className="mt-1 text-[10px] text-white/40">{payout.providerName}</p></div><StatusBadge status={payout.status} /></div><div className="mt-5 grid grid-cols-3 gap-3"><div><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Gross</p><p className="mt-1 text-sm font-black text-white">{formatMoney(payout.grossAmountCents)}</p></div><div><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Fee</p><p className="mt-1 text-sm font-black text-white">{formatMoney(payout.platformFeeCents)}</p></div><div><p className="text-[8px] uppercase tracking-[.12em] text-white/25">Estimate</p><p className="mt-1 text-sm font-black text-emerald-200">{formatMoney(payout.netAmountCents)}</p></div></div><p className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[0.05] p-3 text-[9px] leading-4 text-amber-100/60">Estimate only. No payment processor transfer or payout guarantee is claimed. Paid status requires a manual external reference.</p>{payout.externalReference && <p className="mt-3 text-[9px] text-white/40">Reference: {payout.externalReference}</p>}<GridPayoutTransitionAction canManage={workspace.permissions.canManageNetwork || workspace.permissions.canManageCredentialing} payout={payout} /></article>)}{!workspace.payouts.length && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-white/35">No payout estimates exist yet.</p>}</div>;
}

function HandoffsView({ workspace }: { workspace: GridWorkspaceData }) {
  return <div className="mt-5 grid gap-5 xl:grid-cols-2"><section className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-lime-200">Care handoffs</p><h3 className="mt-2 text-lg font-black text-white">Who needs to act</h3></div><Handshake className="size-5 text-lime-200" /></div><div className="mt-5 space-y-3">{workspace.handoffs.map((handoff) => <article className="rounded-2xl border border-white/8 bg-black/20 p-4" key={handoff.id}><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-white">{title(handoff.category || handoff.type)}</p><StatusBadge status={handoff.status} /><StatusBadge status={handoff.priority} /></div><p className="mt-2 text-[10px] leading-5 text-white/45">{handoff.requestedAction}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-[8px] text-white/30"><span>{handoff.destinationOrganizationName}</span><span>·</span><span>{title(handoff.deliveryMethod)}</span><span>·</span><span>Due {formatDate(handoff.dueAt)}</span>{handoff.humanReviewRequired && <SignalBadge tone="amber">Human review required</SignalBadge>}</div></article>)}{!workspace.handoffs.length && <p className="text-xs text-white/35">No handoffs are waiting.</p>}</div><Link className="mt-5 inline-flex items-center gap-2 text-[10px] font-black text-lime-200 hover:text-lime-100" href="/network/handoffs">Open governed handoff command <ArrowUpRight className="size-3.5" /></Link></section><section className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-200">Capacity signals</p><h3 className="mt-2 text-lg font-black text-white">Availability without phone tag</h3></div><Activity className="size-5 text-sky-200" /></div><div className="mt-5 space-y-3">{workspace.capacities.map((capacity) => <article className="rounded-2xl border border-white/8 bg-black/20 p-4" key={capacity.id}><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-white">{capacity.service}</p><StatusBadge status={capacity.status} /></div><p className="mt-2 text-[10px] text-white/45">{capacity.facilityName} · {capacity.locationName}</p><p className="mt-2 text-[8px] text-white/25">{formatDate(capacity.startsAt, true)}–{formatDate(capacity.endsAt, true)}</p></article>)}</div></section></div>;
}

function FoundingNetworkView() {
  const stages = [
    ["01", "Profile the network", "Clinics, providers, locations, and services enter as synthetic or contract-reviewed records."],
    ["02", "Verify authority", "Human reviewers confirm license evidence, malpractice coverage, scope, privileges, and renewal dates."],
    ["03", "Pilot the handoff", "A controlled synthetic request proves response ownership, status transitions, and audit behavior."],
    ["04", "Review production gates", "Contracts, BAAs, consent, security, payment, and integration testing remain explicit gates."],
  ];
  return <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7"><p className="text-[9px] font-black uppercase tracking-[.2em] text-yellow-200">Founding network protocol</p><h3 className="mt-3 text-2xl font-black tracking-[-.045em] text-white">Start with relationships that already exist.</h3><p className="mt-3 max-w-2xl text-xs leading-6 text-white/45">The founding Grid does not promise a live nationwide marketplace. It maps real operating relationships, proves synthetic handoffs, and documents what each partner must complete before production participation.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{stages.map(([number, stageTitle, detail]) => <article className="rounded-2xl border border-white/8 bg-black/20 p-4" key={number}><p className="text-[9px] font-black text-yellow-200">{number}</p><h4 className="mt-3 text-sm font-black text-white">{stageTitle}</h4><p className="mt-2 text-[10px] leading-5 text-white/40">{detail}</p></article>)}</div></section><aside className="rounded-[1.7rem] border border-yellow-300/15 bg-gradient-to-br from-yellow-300/10 to-transparent p-5 sm:p-7"><Fingerprint className="size-8 text-yellow-200" /><h3 className="mt-6 text-xl font-black tracking-[-.04em] text-white">Founding participant review</h3><div className="mt-5 space-y-3">{["Organization and location verification", "Provider credential and malpractice review", "Service scope and supervision mapping", "Data-sharing and consent boundaries", "Manual fallback and incident ownership", "Synthetic pilot acceptance criteria"].map((item) => <div className="flex gap-3 text-[10px] leading-5 text-white/55" key={item}><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-yellow-200" />{item}</div>)}</div><Link className="mt-7 inline-flex items-center gap-2 rounded-xl bg-yellow-200 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-yellow-100" href="/founding-clinic">Review founding clinic offer <ArrowUpRight className="size-3.5" /></Link></aside></div>;
}

function AdminView({ workspace }: { workspace: GridWorkspaceData }) {
  const owned = workspace.providers.filter((provider) => provider.owned);
  return <div className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><aside className="space-y-3"><GridProviderCreateAction enabled={workspace.permissions.canCreateCredentialing} /><GridServiceCreateAction enabled={workspace.permissions.canCreateNetworkRequest} providers={workspace.providers} /><GridLocationCreateAction enabled={workspace.permissions.canManageNetwork} /><GridAvailabilityCreateAction enabled={workspace.permissions.canCreateNetworkRequest} locations={workspace.locations} providers={workspace.providers} /></aside><section className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-fuchsia-200">Restricted queue</p><h3 className="mt-2 text-xl font-black tracking-[-.04em] text-white">Provider authority review</h3></div><SignalBadge tone="rose"><FileLock2 className="size-3" /> Admin-only fields</SignalBadge></div><div className="mt-5 space-y-4">{owned.map((provider) => <div className="rounded-[1.7rem] border border-white/8 bg-black/15 p-2" key={provider.id}><ProviderCard provider={provider} workspace={workspace} /><GridCredentialReviewAction canManage={workspace.permissions.canManageCredentialing} provider={provider} /><GridMalpracticeReviewAction canManage={workspace.permissions.canManageCredentialing} provider={provider} /></div>)}</div></section></div>;
}

export function GridWorkspace({ view, workspace }: { view: GridView; workspace: GridWorkspaceData }) {
  const contractor = workspace.viewer.isContractor;
  const sequence = contractor ? ["Requested", "Accept / counter / decline", "Clinic review", "Confirmed", "Completed"] : ["Requested", "Accepted", "Location review", "Credential check", "Pending deposit", "Confirmed", "Completed"];
  return <div className="-m-4 min-h-[calc(100vh-78px)] bg-[#03060c] p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
    <GridHeader view={view} />
    <GridNavigation canManage={workspace.permissions.canManageNetwork || workspace.permissions.canManageCredentialing} contractor={contractor} view={view} />
    {view === "overview" && <><ZumiGuidancePanel workspace={workspace} /><CommandMetrics workspace={workspace} /><OverviewView workspace={workspace} /></>}
    {view === "providers" && <ProvidersView workspace={workspace} />}
    {view === "locations" && <LocationsView workspace={workspace} />}
    {view === "services" && <ServicesView workspace={workspace} />}
    {view === "availability" && <AvailabilityView workspace={workspace} />}
    {view === "requests" && <><div className={cn("mt-5 grid gap-5", !contractor && "xl:grid-cols-[.68fr_1.32fr]")}>{!contractor && <GridRequestCreateAction enabled={workspace.permissions.canCreateNetworkRequest} locations={workspace.locations} patients={workspace.patients} services={workspace.services} />}<div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">Request sequence</p><div className="mt-3 flex flex-wrap gap-1.5">{sequence.map((step, index) => <span className="flex items-center gap-1.5 text-[9px] text-white/45" key={step}><span className="grid size-5 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-[8px] font-black text-cyan-200">{index + 1}</span>{step}{index < sequence.length - 1 && <span className="text-white/15">→</span>}</span>)}</div></div></div><RequestsView workspace={workspace} /></>}
    {view === "payouts" && <PayoutsView workspace={workspace} />}
    {view === "handoffs" && <HandoffsView workspace={workspace} />}
    {view === "founding-network" && <FoundingNetworkView />}
    {view === "admin" && <AdminView workspace={workspace} />}
  </div>;
}
