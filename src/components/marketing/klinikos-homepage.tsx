"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, LogIn } from "lucide-react";
import styles from "./klinikos-homepage.module.css";

const fragments = [
  ["FOLLOW-UP", "12%", "22%", "13s", "0s"],
  ["REFERRAL", "78%", "18%", "17s", "1.2s"],
  ["RESULT", "66%", "72%", "15s", "0.6s"],
  ["PAPERWORK", "8%", "68%", "19s", "2s"],
  ["STAFF TASK", "42%", "12%", "16s", ".9s"],
  ["CLAIM", "88%", "52%", "14s", "1.6s"],
  ["LEAD", "24%", "84%", "18s", ".3s"],
  ["PAYMENT", "56%", "88%", "15s", "2.4s"],
  ["SCHEDULING", "18%", "44%", "20s", "1.1s"],
  ["LAB", "84%", "80%", "13s", ".5s"],
  ["PROVIDER", "36%", "62%", "17s", "1.9s"],
  ["REBOOKING", "70%", "36%", "16s", ".8s"],
] as const;

const zumiStates = [
  ["Dormant", "Quiet. Nothing requires attention."],
  ["Observing", "Reading operational state across your systems."],
  ["Mapping", "Connecting each open thread to a system and an owner."],
  ["Analyzing", "Weighing which gaps carry real operational risk."],
  ["Signal detected", "A specific pathway has lost continuity."],
  ["Resolved", "Owned, acknowledged and recorded."],
] as const;

const stageNames = [
  "Entry",
  "Scheduling",
  "Intake",
  "Staff ownership",
  "Provider action",
  "Result / referral / billing",
  "Follow-up",
  "Retention",
] as const;

const threads = [
  {
    key: "followup",
    label: "Follow-up",
    before: ["Call logged", "Visit booked", "Forms sent", "No owner recorded", "Encounter closed", "2-week recheck advised", "Continuity breaks", "Patient not seen again"],
    after: ["Call logged", "Visit booked", "Forms returned", "Owner: front desk", "Encounter closed", "Recheck captured", "Recheck booked 08/24", "Patient retained"],
    breakAt: [6],
    signal: "3 follow-ups require ownership",
    resolved: "Every recommended recheck has a named owner and a date.",
  },
  {
    key: "referral",
    label: "Referral",
    before: ["Provider referral", "Appointment offered", "Records attached", "Sent to Aegis Heart", "Awaiting consult", "Acknowledgment unknown", "Continuity breaks", "Outcome never returned"],
    after: ["Provider referral", "Appointment offered", "Records attached", "Sent to Aegis Heart", "Consult confirmed", "Acknowledged 08/06", "Report returned", "Care loop closed"],
    breakAt: [5, 6],
    signal: "2 referrals have no recorded acknowledgment",
    resolved: "Every outbound referral is tracked until a report comes back.",
  },
  {
    key: "billing",
    label: "Billing readiness",
    before: ["Visit completed", "Eligibility unchecked", "Intake incomplete", "No coder assigned", "Note unsigned", "Claim not built", "Continuity breaks", "Revenue written off"],
    after: ["Visit completed", "Eligibility verified", "Intake complete", "Owner: billing", "Note signed", "Readiness 100%", "Ready for staff submission", "Revenue protected"],
    breakAt: [3, 6],
    signal: "8 encounters are closed and not billing-ready",
    resolved: "Readiness is checked before staff submits a claim.",
  },
  {
    key: "results",
    label: "Results",
    before: ["Order placed", "Specimen collected", "Panel resulted", "Sat in queue", "Not reviewed", "Not released", "Continuity breaks", "Patient not informed"],
    after: ["Order placed", "Specimen collected", "Panel resulted", "Owner: Dr. Reyes", "Reviewed 08/09", "Release approved", "Recheck scheduled", "Patient informed"],
    breakAt: [4, 6],
    signal: "1 abnormal result is awaiting provider review",
    resolved: "Abnormal results escalate to a named provider, never an unattended queue.",
  },
  {
    key: "lead",
    label: "Med-spa lead",
    before: ["Inquiry received", "Consult offered", "No response logged", "No next action", "Never contacted", "No treatment plan", "Continuity breaks", "Lead lost"],
    after: ["Inquiry received", "Consult offered", "Called back same day", "Owner: coordinator", "Consult held", "Plan priced", "Package booked", "Lead converted"],
    breakAt: [2, 3, 6],
    signal: "5 leads have no next action",
    resolved: "Every inquiry has an owner and a next action within 24 hours.",
  },
] as const;

const surfaces = [
  { group: "Command", items: ["Command center", "Front desk", "Provider workspace"] },
  { group: "Care delivery", items: ["Patient charts", "Schedule", "Encounters", "Telemedicine"] },
  { group: "Clinical", items: ["Labs", "Imaging", "Medications", "Documents", "Intake & forms"] },
  { group: "Connected care", items: ["Referral relay", "Network command", "Identity resolution", "Care Constellation"] },
  { group: "Revenue & quality", items: ["Billing", "Claim readiness", "Insurance", "CRM & revenue recovery"] },
  { group: "Provider network", items: ["Grid marketplace", "Credentials", "Availability", "Service requests"] },
  { group: "Operations", items: ["Tasks", "Messages", "Escalations", "Patient navigation"] },
  { group: "System", items: ["Settings & audit", "Access controls", "System health", "Integration roadmap"] },
] as const;

const levels = [
  { num: "01", title: "Private workflow demo & cost review", credit: "Credited toward evaluation", detail: "A working session on your operational gaps, with a synthetic preliminary operating map.", price: "$500", href: "/private-demo" },
  { num: "02", title: "Founding clinic evaluation", credit: "Credited toward the founding program", detail: "A deeper review of systems, staffing, workflow loss and implementation fit.", price: "$1,500", href: "/founding-clinic" },
  { num: "03", title: "Founding clinic program", credit: "Prior credits applied", detail: "An early-stage build partnership with preferred onboarding and clear production gates.", price: "$8,000", href: "/founding-clinic" },
] as const;

function ZumiOrb({ state = "observing", size = "large" }: { state?: string; size?: "small" | "large" }) {
  return (
    <div className={styles.orb} data-size={size} data-state={state} aria-label={`Zumi ${state}`} role="img">
      <div className={styles.orbGlow} />
      <div className={styles.orbOrbit}>
        {Array.from({ length: 8 }, (_, index) => (
          <span className={styles.orbSpoke} key={index} style={{ "--rotation": `${index * 45}deg` } as React.CSSProperties}>
            <i />
          </span>
        ))}
      </div>
      <div className={styles.orbCore}><span /></div>
    </div>
  );
}

function StatusStrip() {
  return (
    <div className={styles.statusStrip} aria-label="Demonstration status">
      <span>Demo</span><span>Synthetic data</span><span>Human review required</span><span>No PHI</span>
    </div>
  );
}

export function KlinikosHomepage() {
  const [phase, setPhase] = useState(0);
  const [threadKey, setThreadKey] = useState("referral");
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const updatePhase = () => {
      const viewport = window.innerHeight || 800;
      const top = (id: string) => document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      let next = window.scrollY > 60 ? 1 : 0;
      if (top("fragmentation") < viewport * 0.7) next = 2;
      if (top("zumi") < viewport * 0.7) next = 3;
      if (top("map") < viewport * 0.7) next = 4;
      if (top("surfaces") < viewport * 0.7) next = 5;
      setPhase((current) => current === next ? current : next);
    };
    updatePhase();
    window.addEventListener("scroll", updatePhase, { passive: true });
    return () => window.removeEventListener("scroll", updatePhase);
  }, []);

  const activeThread = threads.find((thread) => thread.key === threadKey) ?? threads[0];
  const sequence = resolved ? activeThread.after : activeThread.before;
  const orbState = ["dormant", "observing", "observing", "mapping", "analyzing", "resolved"][phase];
  const phaseLabel = ["Zumi dormant", "Signals detected", "Observing fragmentation", "Mapping continuity", "Analyzing risk", "Under control"][phase];

  return (
    <div className={styles.home} data-phase={phase}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Klinikos home"><ZumiOrb size="small" state={orbState} /><span>KLINIKOS</span></Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#fragmentation">Problem</a><a href="#zumi">Zumi</a><a href="#map">Operating map</a><a href="#surfaces">System</a><a href="#levels">Engagement</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.signIn} href="/login"><LogIn size={14} /><span>Sign in</span></Link>
          <Link className={styles.headerCta} href="/private-demo">See your operating map <ArrowRight size={15} /></Link>
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGrid} />
          <div className={styles.fragments} aria-hidden="true">
            {fragments.map(([label, x, y, duration, delay]) => (
              <span key={label} style={{ left: x, top: y, animationDuration: duration, animationDelay: delay }}>{label}</span>
            ))}
          </div>
          <div className={styles.heroOrb}><ZumiOrb state={orbState} /></div>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>THE CLINIC OPERATING SYSTEM</p>
            <h1 id="hero-title">YOUR CLINIC ISN&apos;T MISSING SOFTWARE.</h1>
            <h2>IT&apos;S MISSING CONTINUITY.</h2>
            <p>Klinikos connects the work that happens between your systems. Follow-ups. Referrals. Results. Paperwork. Staff tasks. Revenue opportunities. Powered by Zumi.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/private-demo">See your clinic operating map <ArrowRight size={17} /></Link>
              <a className={styles.secondaryButton} href="#fragmentation">Explore Klinikos <ArrowDown size={17} /></a>
            </div>
            <StatusStrip />
          </div>
          <div className={styles.scrollCue}><span>Scroll</span><ArrowDown size={14} /><b>{phaseLabel}</b></div>
        </section>

        <section className={styles.fragmentation} id="fragmentation" aria-labelledby="fragmentation-title">
          <div className={styles.sectionLead}>
            <p className={styles.sectionNumber}>01 / FRAGMENTATION</p>
            <h2 id="fragmentation-title">THE PROBLEM ISN&apos;T THAT YOUR CLINIC HAS NO SOFTWARE.</h2>
            <p>The problem is what happens between it.</p>
          </div>
          <div className={styles.islands} aria-label="Disconnected clinic systems">
            {["EHR", "Scheduling", "Phone", "Texting", "Billing", "Labs", "CRM", "Documents", "Staff"].map((island) => <span key={island}>{island}</span>)}
          </div>
          <div className={styles.breakList}>
            <div><b>Patient call</b><span>Scheduled</span><i>→</i><span>Paperwork requested</span><i>→</i><em>Continuity breaks</em></div>
            <div><b>Referral</b><span>Sent</span><i>→</i><em>Acknowledgment unknown</em></div>
            <div><b>Lead</b><span>Contacted</span><i>→</i><em>Follow-up ownership lost</em></div>
          </div>
          <p className={styles.humanNote}>Zumi observes these breaks. It does not close them without a person.</p>
        </section>

        <section className={styles.zumiReveal} id="zumi" aria-labelledby="zumi-title">
          <div className={styles.zumiStage}>
            <ZumiOrb state="mapping" />
            <span className={styles.zumiAxis} />
          </div>
          <div className={styles.zumiCopy}>
            <p className={styles.sectionNumber}>02 / OPERATING INTELLIGENCE</p>
            <h2 id="zumi-title">MEET ZUMI.</h2>
            <h3>Your clinic&apos;s operating intelligence.</h3>
            <p>Zumi observes operational state, organizes workflows, surfaces signals and helps staff hold continuity. It sits across the operating layer. It does not replace your EHR, scheduler, phone line or biller.</p>
            <div className={styles.stateLedger}>
              {zumiStates.map(([label, note], index) => <div key={label} className={index === Math.min(phase, 5) ? styles.stateActive : ""}><span>0{index + 1}</span><b>{label}</b><p>{note}</p></div>)}
            </div>
          </div>
        </section>

        <section className={styles.mapSection} id="map" aria-labelledby="map-title">
          <div className={styles.mapHeading}>
            <div><p className={styles.sectionNumber}>03 / SIGNATURE DEMONSTRATION</p><h2 id="map-title">ONE THREAD, END TO END.</h2></div>
            <p>Pick a thread. See where continuity breaks, then let Zumi reorganize it into an accountable pathway.</p>
          </div>
          <div className={styles.threadPicker} role="group" aria-label="Choose an operating thread">
            {threads.map((thread) => (
              <button className={thread.key === threadKey ? styles.threadActive : ""} key={thread.key} onClick={() => { setThreadKey(thread.key); setResolved(false); }} type="button">{thread.label}</button>
            ))}
          </div>
          <div className={styles.operatingMap} data-resolved={resolved}>
            {stageNames.map((name, index) => {
              const broken = !resolved && activeThread.breakAt.some((breakIndex) => breakIndex === index);
              return (
                <div className={styles.stage} data-broken={broken} key={name}>
                  <div className={styles.stageLine} /><span className={styles.stageDot} />
                  <p>{name}</p><b>{sequence[index]}</b>
                </div>
              );
            })}
          </div>
          <div className={styles.signalPanel} data-resolved={resolved}>
            <div className={styles.signalIdentity}><ZumiOrb size="small" state={resolved ? "resolved" : "signal"} /><span><b>{resolved ? "Resolved pathway" : "Signal detected"}</b><small>Synthetic demonstration</small></span></div>
            <div className={styles.signalCopy}><h3>{resolved ? activeThread.resolved : activeThread.signal}</h3><p>{resolved ? "Zumi reorganized the pathway. A person still confirms every step." : "Zumi found where this pathway stops. Nothing closes without a person."}</p></div>
            <button type="button" onClick={() => setResolved((current) => !current)}>{resolved ? "Show the break again" : "Activate Zumi"}</button>
          </div>
          <StatusStrip />
        </section>

        <section className={styles.surfaces} id="surfaces" aria-labelledby="surfaces-title">
          <div className={styles.surfaceIntro}>
            <div><p className={styles.sectionNumber}>04 / PRODUCT SURFACES</p><h2 id="surfaces-title">THE SYSTEM YOUR STAFF ACTUALLY OPENS.</h2></div>
            <p>Inside the product, motion stops and precision takes over. These surfaces are mapped into the ClinicOS engineering foundation. Availability remains clearly labeled as Live, Demo, Manual fallback, Pending connection, or Roadmap.</p>
          </div>
          <div className={styles.surfaceGrid}>
            {surfaces.map((surface) => <div key={surface.group}><p>{surface.group}</p><ul>{surface.items.map((item) => <li key={item}><Check size={13} />{item}</li>)}</ul></div>)}
          </div>
          <div className={styles.truthBanner}><span>ENGINEERING FOUNDATION</span><p>Synthetic demonstration only. No production PHI. Vendor connections and regulated workflows require contracts, credentials, security review and human authorization.</p></div>
        </section>

        <section className={styles.levels} id="levels" aria-labelledby="levels-title">
          <p className={styles.sectionNumber}>05 / ENGAGEMENT</p>
          <h2 id="levels-title">THREE LEVELS OF ENGAGEMENT.</h2>
          <div className={styles.levelLedger}>
            {levels.map((level, index) => (
              <Link href={level.href} key={level.num} data-premium={index === 2}>
                <strong>{level.num}</strong><div><h3>{level.title}</h3><span>{level.credit}</span></div><p>{level.detail}</p><b>{level.price}</b><ArrowRight size={20} />
              </Link>
            ))}
          </div>
          <div className={styles.levelCta}><Link href="/private-demo">Start clinic operating analysis <ArrowRight size={17} /></Link><span>No PHI required · Requires human review</span></div>
        </section>
      </main>

      <footer className={styles.footer}><span>KLINIKOS</span><p>The clinic operating system · Powered by Zumi</p><Link href="/login">Sign in</Link></footer>
    </div>
  );
}
