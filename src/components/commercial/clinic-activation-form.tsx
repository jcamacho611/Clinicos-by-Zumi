"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ds";
import type { ClinicActivationDraft } from "@/lib/commercial/clinic-activation-rules";

type FormState = ClinicActivationDraft & {
  password: string;
  acceptTerms: boolean;
  syntheticDataOnly: true;
};

const defaultDraft: ClinicActivationDraft = {
  ownerName: "",
  clinicType: "Primary care",
  locationName: "Main clinic",
  city: "",
  state: "NY",
  timezone: "America/New_York",
  teamSize: "1-5",
  primaryGoal: "Bring clinic operations, follow-up, and visibility into one workspace",
  currentSystems: "",
  migrationExpectation: "needs_review",
  communicationsState: "needs_review",
};

function draftFromForm(form: FormState): ClinicActivationDraft {
  return {
    ownerName: form.ownerName,
    clinicType: form.clinicType,
    locationName: form.locationName,
    city: form.city,
    state: form.state,
    timezone: form.timezone,
    teamSize: form.teamSize,
    primaryGoal: form.primaryGoal,
    currentSystems: form.currentSystems,
    migrationExpectation: form.migrationExpectation,
    communicationsState: form.communicationsState,
  };
}

export function ClinicActivationForm({
  token,
  organizationName,
  email,
  productLabel,
  initialDraft,
}: {
  token: string;
  organizationName: string;
  email: string;
  productLabel: string;
  initialDraft?: ClinicActivationDraft;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(initialDraft ? "saved" : "idle");
  const skipInitialSave = useRef(true);
  const [form, setForm] = useState<FormState>({
    ...defaultDraft,
    ...initialDraft,
    password: "",
    acceptTerms: false,
    syntheticDataOnly: true,
  });
  const autosaveDraft = useMemo(() => draftFromForm(form), [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch("/api/onboarding/activate", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...autosaveDraft }),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Progress could not be saved.");
        setSaveState("saved");
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setSaveState("error");
      }
    }, 850);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [autosaveDraft, token]);

  function submit() {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/onboarding/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, token }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Clinic activation could not be completed.");
        window.location.assign(payload.redirectTo || "/dashboard");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Clinic activation could not be completed.");
      }
    });
  }

  const saveTone = saveState === "error" ? "signal" : saveState === "saved" ? "resolved" : saveState === "saving" ? "analyzing" : "neutral";

  return (
    <div className="mt-9 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>Organization</p>
          <p className="mt-3 text-lg font-extrabold">{organizationName}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{email}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>Paid plan</p>
          <p className="mt-3 text-lg font-extrabold">{productLabel}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>Bound to the signed activation link</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 border-y py-5" style={{ borderColor: "var(--line-light)" }}>
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold">Commercial truth is already locked.</p>
          <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
            Organization, email, role, plan, and payment state come from the signed link and cannot be changed by this form.
          </p>
        </div>
        <Badge tone={saveTone}>
          {saveState === "saving" ? <LoaderCircle className="size-3 animate-spin" aria-hidden="true" /> : saveState === "saved" ? <Check className="size-3" aria-hidden="true" /> : null}
          {saveState === "saving" ? "Saving" : saveState === "saved" ? "Progress saved" : saveState === "error" ? "Save retry needed" : "Autosave ready"}
        </Badge>
      </div>

      {error ? (
        <div className="p-4 text-xs font-bold" role="alert" style={{ color: "var(--status-signal)", background: "color-mix(in oklch, var(--status-signal) 8%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-signal) 30%, transparent)", borderRadius: "var(--radius-md)" }}>
          {error}
        </div>
      ) : null}

      {saveState === "error" ? (
        <div className="p-4 text-xs leading-6" style={{ color: "var(--text-on-paper)", background: "color-mix(in oklch, var(--status-analyzing) 9%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-analyzing) 30%, transparent)", borderRadius: "var(--radius-md)" }}>
          Your current page is still usable, but Klinikos could not persist the latest non-secret setup changes. Keep this page open or change a field again before refreshing.
        </div>
      ) : null}

      <ActivationSection number="01" title="Who is opening this workspace?" description="Set the clinic owner account and the primary operating location.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input label="Your name" value={form.ownerName} onChange={(event) => update("ownerName", event.target.value)} />
          <div>
            <Input label="Create password" type="password" value={form.password} onChange={(event) => update("password", event.target.value)} />
            <p className="mt-2 flex items-center gap-2 text-[10px] leading-5" style={{ color: "var(--text-on-paper-dim)" }}>
              <LockKeyhole className="size-3" aria-hidden="true" /> Password is never included in autosaved onboarding progress.
            </p>
          </div>
          <Input label="Clinic type" value={form.clinicType} onChange={(event) => update("clinicType", event.target.value)} />
          <Input label="Primary location name" value={form.locationName} onChange={(event) => update("locationName", event.target.value)} />
          <Input label="City" value={form.city} onChange={(event) => update("city", event.target.value)} />
          <Input label="State" value={form.state} onChange={(event) => update("state", event.target.value.toUpperCase().slice(0, 2))} />
          <SelectField label="Timezone" value={form.timezone} onChange={(value) => update("timezone", value)} options={[
            ["America/New_York", "Eastern"],
            ["America/Chicago", "Central"],
            ["America/Denver", "Mountain"],
            ["America/Los_Angeles", "Pacific"],
          ]} />
          <SelectField label="Team size" value={form.teamSize} onChange={(value) => update("teamSize", value)} options={[
            ["1-5", "1-5"], ["6-15", "6-15"], ["16-30", "16-30"], ["31-75", "31-75"], ["75+", "75+"],
          ]} />
        </div>
      </ActivationSection>

      <ActivationSection number="02" title="What should Klinikos help control first?" description="Give Living Home useful context without asking you to understand the backend.">
        <TextareaField label="Primary operating goal" value={form.primaryGoal} onChange={(value) => update("primaryGoal", value)} />
        <div className="mt-6">
          <TextareaField label="Systems you currently use" value={form.currentSystems} onChange={(value) => update("currentSystems", value)} placeholder="EHR, scheduling, billing, phone, messaging, spreadsheets, etc." />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <SelectField label="Migration expectation" value={form.migrationExpectation} onChange={(value) => update("migrationExpectation", value as FormState["migrationExpectation"])} options={[
            ["needs_review", "Review with Klinikos first"],
            ["not_now", "No migration now"],
            ["manual_import", "Manual import"],
            ["assisted_import", "Assisted import"],
          ]} />
          <SelectField label="Communications today" value={form.communicationsState} onChange={(value) => update("communicationsState", value as FormState["communicationsState"])} options={[
            ["needs_review", "Needs review"],
            ["existing_vendor", "Existing vendor"],
            ["manual_fallback", "Manual workflow"],
            ["not_connected", "Not connected"],
          ]} />
        </div>
      </ActivationSection>

      <ActivationSection number="03" title="Activate access safely" description="Paid access opens the workspace. It does not silently approve production PHI or external integrations.">
        <div className="flex items-start gap-4 p-5" style={{ background: "color-mix(in oklch, var(--status-analyzing) 9%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-analyzing) 28%, transparent)", borderRadius: "var(--radius-md)" }}>
          <ShieldCheck className="mt-0.5 size-5 shrink-0" style={{ color: "var(--status-analyzing)" }} aria-hidden="true" />
          <div>
            <p className="text-sm font-extrabold">Start with synthetic or non-PHI data until production review is complete.</p>
            <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
              Paid software access does not itself approve production patient-data use or turn pending external integrations into live connections. Living Home will preserve those blockers instead of pretending they are complete.
            </p>
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
          <input className="mt-1 size-4" type="checkbox" checked={form.acceptTerms} onChange={(event) => update("acceptTerms", event.target.checked)} />
          <span>I confirm I am authorized to activate this clinic workspace and I will not enter PHI until Klinikos marks the deployment approved for production patient-data use.</span>
        </label>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button variant="gold" size="lg" disabled={pending || !form.acceptTerms || !form.ownerName.trim() || !form.password || !form.city.trim()} onClick={submit}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
            {pending ? "Activating workspace" : "Activate my Klinikos workspace"}
          </Button>
          <p className="max-w-sm text-[10px] leading-5" style={{ color: "var(--text-on-paper-dim)" }}>
            Successful activation signs you into the organization bound to this link and opens Living Home.
          </p>
        </div>
      </ActivationSection>
    </div>
  );
}

function ActivationSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-7" style={{ borderColor: "var(--line-light)" }}>
      <div className="mb-7 grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-5">
        <p className="text-[10px] font-extrabold" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wide)" }}>{number}</p>
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
          <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>{label}</span>
      <select
        className="min-h-11 bg-transparent px-1 text-sm outline-none"
        style={{ color: "var(--text-on-paper)", border: "none", borderBottom: "var(--border-hair-light)" }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function TextareaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>{label}</span>
      <textarea
        className="min-h-28 resize-y bg-transparent px-1 py-3 text-sm leading-6 outline-none"
        style={{ color: "var(--text-on-paper)", border: "none", borderBottom: "var(--border-hair-light)" }}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
