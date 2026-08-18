import Link from "next/link";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { ClinicActivationForm } from "@/components/commercial/clinic-activation-form";
import { Badge, DsSurface } from "@/components/ds";
import { getClinicActivationDraft } from "@/lib/commercial/clinic-activation-draft";
import { ClinicProvisioningError, getClinicActivationPreview } from "@/lib/commercial/clinic-provisioning";

export const metadata = {
  title: "Activate Klinikos",
  description: "Complete a paid Klinikos clinic workspace activation.",
};

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  let preview: Awaited<ReturnType<typeof getClinicActivationPreview>> | null = null;
  let draft: Awaited<ReturnType<typeof getClinicActivationDraft>> = null;
  let error = "";

  if (!token) {
    error = "This page needs a signed Klinikos activation link.";
  } else {
    try {
      preview = await getClinicActivationPreview(token);
      if (!preview.alreadyActivated) draft = await getClinicActivationDraft(token);
    } catch (caught) {
      error = caught instanceof ClinicProvisioningError ? caught.message : "This activation link could not be verified.";
    }
  }

  return (
    <DsSurface>
      <main className="min-h-screen" style={{ background: "var(--surface-paper-2)", color: "var(--text-on-paper)" }}>
        <header style={{ borderBottom: "var(--border-hair-light)", background: "var(--surface-paper)" }}>
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <KlinikosWordmark href="/" markClassName="h-8 w-8" textClassName="h-[18px] w-[160px]" />
            <span className="hidden items-center gap-2 text-xs sm:flex" style={{ color: "var(--text-on-paper-dim)" }}>
              <LockKeyhole className="size-4" aria-hidden="true" />
              Signed paid-workspace activation
            </span>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-12 lg:py-16">
          <aside
            className="relative overflow-hidden p-7 sm:p-9 lg:sticky lg:top-8 lg:h-fit"
            style={{ background: "var(--obsidian)", color: "var(--text-primary)", borderRadius: "var(--radius-lg)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(circle at 78% 18%, color-mix(in oklch, var(--cyan-500) 20%, transparent), transparent 32%), radial-gradient(circle at 18% 86%, color-mix(in oklch, var(--gold-500) 14%, transparent), transparent 30%)",
              }}
            />
            <div className="relative">
              <Badge tone={preview?.alreadyActivated ? "resolved" : "mapping"}>
                {preview?.alreadyActivated ? "Workspace active" : "Paid clinic setup"}
              </Badge>
              <h1
                className="mt-7 text-balance font-extrabold"
                style={{ fontSize: "var(--text-h1)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)" }}
              >
                Finish the workspace. Start with what matters.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                Your signed activation link already carries the paid organization, owner email, plan, role, and commercial state. This page only collects the setup details needed to prepare your first Klinikos workspace.
              </p>

              <div className="mt-10 space-y-5 border-t pt-7" style={{ borderColor: "var(--line-dark)" }}>
                <ActivationPromise icon={CheckCircle2} title="Your paid state stays server-owned">
                  Nothing typed here can change the organization, plan, role, price, or payment evidence bound to the signed link.
                </ActivationPromise>
                <ActivationPromise icon={ShieldCheck} title="Production patient data stays gated">
                  Paid access does not turn pending external connections or production PHI approval into completed states.
                </ActivationPromise>
                <ActivationPromise icon={LockKeyhole} title="Secrets are not autosaved">
                  Non-secret setup progress can resume, while your password remains outside the draft payload.
                </ActivationPromise>
              </div>
            </div>
          </aside>

          <section
            className="p-6 sm:p-9"
            style={{ background: "var(--surface-paper)", border: "var(--border-hair-light)", borderRadius: "var(--radius-lg)" }}
            aria-labelledby="activation-form-heading"
          >
            <div className="max-w-3xl">
              <p className="text-[12px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wider)" }}>
                Secure activation
              </p>
              <h2 id="activation-form-heading" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Tell Klinikos how this clinic should open.
              </h2>
              <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>
                Progress saves as you work. After activation, Klinikos signs you in and brings you directly to Living Home with the clinic and role already bound to your account.
              </p>
            </div>

            {error ? (
              <div className="mt-8 p-5" role="alert" style={{ background: "color-mix(in oklch, var(--status-signal) 9%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-signal) 35%, transparent)", borderRadius: "var(--radius-md)" }}>
                <p className="text-sm font-extrabold" style={{ color: "var(--status-signal)" }}>{error}</p>
                <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
                  Ask your Klinikos contact to review payment state and issue a new activation link if needed.
                </p>
              </div>
            ) : preview?.alreadyActivated ? (
              <div className="mt-8 p-6" style={{ background: "color-mix(in oklch, var(--status-resolved) 10%, var(--surface-paper))", border: "1px solid color-mix(in oklch, var(--status-resolved) 35%, transparent)", borderRadius: "var(--radius-md)" }}>
                <Badge tone="resolved">Already active</Badge>
                <p className="mt-4 text-lg font-extrabold">This workspace has already been activated.</p>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>Use the clinic sign-in to return to Living Home.</p>
                <Link className="mt-5 inline-flex min-h-11 items-center font-extrabold underline-offset-4 hover:underline" href="/login" style={{ color: "var(--accent-signal)" }}>
                  Sign in to Klinikos
                </Link>
              </div>
            ) : preview ? (
              <ClinicActivationForm
                token={token}
                organizationName={preview.organizationName}
                email={preview.email}
                productLabel={preview.productLabel}
                initialDraft={draft ?? undefined}
              />
            ) : null}
          </section>
        </div>
      </main>
    </DsSurface>
  );
}

function ActivationPromise({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-9 shrink-0 place-items-center" style={{ background: "var(--surface-raised)", color: "var(--cyan-400)", borderRadius: "var(--radius-md)" }}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-extrabold">{title}</p>
        <p className="mt-1 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{children}</p>
      </div>
    </div>
  );
}
