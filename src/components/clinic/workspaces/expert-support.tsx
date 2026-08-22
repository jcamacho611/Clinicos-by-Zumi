"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, UserSearch } from "lucide-react";
import type { ExpertSupportPicture } from "@/lib/repositories/expert-support-repository";

/**
 * Asking for expertise the clinic does not have.
 *
 * The directive's wording is the design: "This requires expertise your organization
 * doesn't currently have available." Not a marketplace, not a taxonomy, not a matching
 * score — a plain statement and a way to ask.
 *
 * The part that carries the most weight is the access progression at the bottom. An
 * enterprise evaluator's first question about any expert network is what a matched
 * outsider can see, and the honest answer here is nothing: matching, terms, conflict
 * review, purpose and agreements all happen before access is even discussed, and each is
 * a separate authorized decision. Showing that as a sequence with "Data access: None"
 * standing at the end is more convincing than any assurance copy, because it is what the
 * code actually enforces.
 *
 * There is no expert supply yet, so this never implies a match is coming automatically.
 * `matchingAvailable` is false and the surface says a person will follow up.
 */

const DOMAINS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "quality", label: "Quality and care gaps" },
  { value: "revenue_cycle", label: "Revenue cycle" },
  { value: "billing", label: "Billing" },
  { value: "coding", label: "Coding" },
  { value: "credentialing", label: "Credentialing" },
  { value: "prior_authorization", label: "Prior authorization" },
  { value: "compliance", label: "Compliance" },
  { value: "privacy", label: "Privacy" },
  { value: "security", label: "Security" },
  { value: "interoperability", label: "Systems and integrations" },
  { value: "clinical_informatics", label: "Clinical informatics" },
  { value: "operations", label: "Clinic operations" },
  { value: "education", label: "Training" },
  { value: "patient_experience", label: "Patient experience" },
  { value: "population_health", label: "Population health" },
];

const URGENCY: ReadonlyArray<{ value: string; label: string }> = [
  { value: "routine", label: "No particular deadline" },
  { value: "priority", label: "Within a few weeks" },
  { value: "urgent", label: "This week" },
  { value: "critical", label: "Immediately" },
];

/** What happens before an outsider can see anything. Each step is separately authorized. */
const ACCESS_PROGRESSION = [
  { step: "Matched", note: "A qualified person is identified." },
  { step: "Terms agreed", note: "Both sides accept scope and cost." },
  { step: "Conflict review", note: "Checked for conflicts of interest." },
  { step: "Purpose confirmed", note: "A specific, written reason for the work." },
  { step: "Agreement complete", note: "Signed agreements recorded as evidence." },
];

const inputClass = "mt-1.5 w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition";
const inputStyle = { borderColor: "var(--line-dark)", background: "var(--surface-primary)", color: "var(--text-primary)" };
const labelClass = "text-[12px] font-semibold uppercase tracking-[.14em]";

export function ExpertSupportWorkspace({ picture }: { picture: ExpertSupportPicture }) {
  const [domain, setDomain] = useState(DOMAINS[0].value);
  const [outcome, setOutcome] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [jurisdiction, setJurisdiction] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (picture.requests === null) {
    return (
      <div className="space-y-[var(--space-5)]">
        <h2 className="text-2xl font-light tracking-[-.04em]" style={{ color: "var(--text-primary)" }}>
          Outside expertise is not available for your role.
        </h2>
        <p className="max-w-2xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          Ask an administrator if you need to request specialist support.
        </p>
      </div>
    );
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/expert-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilityDomain: domain,
          outcomeWanted: outcome,
          urgency,
          jurisdictionKey: jurisdiction.trim() || null,
          remoteAllowed: true,
          neededBy: null,
          sourceNeedKey: null,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "That did not save. Nothing was lost — you can try again.");
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <div>
        <h2 className="text-2xl font-light tracking-[-.04em] sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          This needs expertise you do not have in-house.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          Tell Klinikos what outcome you need and a person will find someone appropriate.
          {/* No supply exists yet, so this must not imply an automatic match. */}
          {" "}Matching is not automated yet — a Klinikos operator handles it and will come back to you.
        </p>
      </div>

      {submitted ? (
        <div
          className="rounded-[var(--radius-lg,18px)] border p-[var(--space-6)]"
          style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Request received.</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-7" style={{ color: "var(--text-secondary)" }}>
            Nothing has been shared with anyone outside your organization. A Klinikos operator will review this
            and come back to you before anything else happens.
          </p>
        </div>
      ) : picture.canRequest ? (
        <div
          className="rounded-[var(--radius-lg,18px)] border p-[var(--space-6)]"
          style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass} style={{ color: "var(--text-secondary)" }}>What kind of help?</span>
              <select className={inputClass} onChange={(event) => setDomain(event.target.value)} style={inputStyle} value={domain}>
                {DOMAINS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass} style={{ color: "var(--text-secondary)" }}>When do you need it?</span>
              <select className={inputClass} onChange={(event) => setUrgency(event.target.value)} style={inputStyle} value={urgency}>
                {URGENCY.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className={labelClass} style={{ color: "var(--text-secondary)" }}>What should be true when this is done?</span>
            <textarea
              className={inputClass}
              onChange={(event) => setOutcome(event.target.value)}
              placeholder="Describe the outcome, not the task. Do not include patient details."
              rows={3}
              style={inputStyle}
              value={outcome}
            />
          </label>

          <label className="mt-4 block sm:max-w-xs">
            <span className={labelClass} style={{ color: "var(--text-secondary)" }}>State or jurisdiction (optional)</span>
            <input className={inputClass} onChange={(event) => setJurisdiction(event.target.value)} placeholder="NY" style={inputStyle} value={jurisdiction} />
          </label>

          {error && <p className="mt-4 text-[13px]" role="alert" style={{ color: "var(--status-signal)" }}>{error}</p>}

          <button
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-xs font-semibold transition disabled:opacity-50"
            disabled={pending || outcome.trim().length < 10}
            onClick={submit}
            style={{ background: "var(--accent-intelligence)", color: "var(--obsidian)" }}
            type="button"
          >
            {pending ? "Sending…" : "Request support"}
          </button>
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-lg,18px)] border p-[var(--space-6)] text-[13px] leading-7"
          style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
        >
          You can see requests for this organization but cannot raise one. An administrator can.
        </div>
      )}

      <div
        className="rounded-[var(--radius-lg,18px)] border p-[var(--space-6)]"
        style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: "var(--accent-intelligence)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Nobody sees your records by being matched.
            </p>
            <p className="mt-2 max-w-2xl text-[13px] leading-7" style={{ color: "var(--text-secondary)" }}>
              Each of these is a separate decision, in order, and access is not part of any of them.
            </p>
            <ol className="mt-4 space-y-2">
              {ACCESS_PROGRESSION.map((entry, index) => (
                <li className="flex gap-3 text-[13px] leading-6" key={entry.step}>
                  <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{index + 1}.</span>
                  <span>
                    <span style={{ color: "var(--text-primary)" }}>{entry.step}</span>
                    <span style={{ color: "var(--text-secondary)" }}> — {entry.note}</span>
                  </span>
                </li>
              ))}
              <li className="flex gap-3 pt-2 text-[13px] leading-6" style={{ borderTop: "1px solid var(--line-dark)" }}>
                <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>→</span>
                <span style={{ color: "var(--text-primary)" }}>
                  Data access: <strong>None</strong>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {" "}— if any information is ever needed, it is requested separately, scoped to the minimum, and approved by a named person.
                  </span>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {picture.requests.length > 0 && (
        <div
          className="divide-y rounded-[var(--radius-lg,18px)] border"
          style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
        >
          {picture.requests.map((request) => (
            <div className="flex flex-wrap items-center gap-3 p-[var(--space-5)]" key={request.id}>
              <UserSearch aria-hidden="true" className="size-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {DOMAINS.find((option) => option.value === request.capabilityDomain)?.label ?? request.capabilityDomain}
                </p>
                <p className="mt-1 truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>{request.outcomeWanted}</p>
              </div>
              {/* Status and access are shown as words, never as colour alone. */}
              <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                {request.status.replaceAll("_", " ")} · access {request.dataAccessClass}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
