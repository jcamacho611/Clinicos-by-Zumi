import type { Metadata } from "next";
import {
  Badge,
  Button,
  Card,
  DsSurface,
  ZumiOrb,
  badgeTones,
  buttonSizes,
  buttonVariants,
  zumiStates,
} from "@/components/ds";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Design system",
  // Internal reference. It documents the shared interface vocabulary, which is of no
  // use to a search engine and of some use to anyone probing the product's surface.
  robots: { index: false, follow: false },
};

/**
 * What the shared interface vocabulary actually is.
 *
 * Registry section 62 asks that status, responsibility, next action, risk and
 * provenance be legible. They cannot be legible if the same state is drawn one way in
 * the escalation queue and another way on the schedule, which is the failure a reference
 * page exists to prevent.
 *
 * Everything here is derived rather than described. The tone, variant and size rows
 * iterate the arrays the design system exports, and every colour is a live `var()`
 * rather than a copied value. A page that listed these by hand would be wrong the first
 * time somebody added a tone, and wrong in the most misleading way: confidently.
 */

/**
 * What each state means, taken from how the product actually uses it.
 *
 * `guidanceTone` in the escalations workspace maps blocked to signal, review_required
 * to analyzing, waiting to observing and completed to resolved; `attentionTone` maps a
 * no-show to signal. These sentences describe that usage rather than proposing new
 * meanings, because the drawings are already consistent and the words were the part
 * nobody had written down.
 */
const STATE_MEANING: Record<(typeof zumiStates)[number], string> = {
  dormant: "Nothing is happening. Klinikos is not working on anything for this surface.",
  observing: "Being watched. Nothing is needed from a person yet.",
  mapping: "Klinikos has worked out a next step and is recommending it.",
  analyzing: "A person needs to review this before it can move.",
  signal: "Needs attention now, or something is blocked.",
  resolved: "Settled. No further action is expected.",
};

const NEUTRAL_MEANING =
  "No status claim. Use it for a label that is not reporting state at all.";

const VARIANT_MEANING: Record<(typeof buttonVariants)[number], string> = {
  primary: "The main action on the surface. One per view.",
  dark: "A secondary action that still needs weight.",
  outline: "An alternative action of equal standing.",
  ghost: "A quiet action — dismiss, cancel, close.",
  gold: "Reserved for premium and paid moments: pricing, the founding program. Not a general emphasis colour.",
};

const COLOUR_TOKENS = [
  { token: "--status-observing", label: "Observing" },
  { token: "--status-mapping", label: "Mapping" },
  { token: "--status-analyzing", label: "Analyzing" },
  { token: "--status-signal", label: "Signal" },
  { token: "--status-resolved", label: "Resolved" },
  { token: "--accent-intelligence", label: "Intelligence accent" },
  { token: "--accent-premium", label: "Premium accent" },
  { token: "--accent-signal", label: "Signal accent" },
] as const;

const TYPE_SCALE = [
  { token: "--text-display", label: "Display" },
  { token: "--text-body-lg", label: "Body large" },
  { token: "--text-body", label: "Body" },
  { token: "--text-small", label: "Small" },
  { token: "--text-micro", label: "Micro" },
] as const;

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mt-14" aria-labelledby={`ds-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
      <h2
        className="text-xl font-semibold tracking-[var(--tracking-tight)]"
        id={`ds-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{note}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function DesignSystemPage() {
  // Internal vocabulary, so a session is required — but no permission beyond being a
  // member of a clinic. Every role reads these states; none of them owns the list.
  await requireClinicSession();

  return (
    <DsSurface className="-mx-4 border-y border-[var(--line-dark)] bg-[var(--surface-primary)] text-[var(--text-primary)] sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[var(--container-max)] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <p className="text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-intelligence)]">
          Klinikos design system
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[var(--tracking-tighter)]">
          One way to say the same thing.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
          Status, responsibility and next action have to read the same everywhere, or a clinician has to
          relearn the interface on every screen. This page shows the shared primitives as they actually
          render — every row below is generated from what the design system exports, so it cannot drift
          into describing something that no longer exists.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
          It covers the shared vocabulary, not every surface. Composed views like Current Visit or the
          escalation queue build on these pieces and are documented where they live.
        </p>

        <Section
          title="Status vocabulary"
          note="The six states Klinikos can be in about a piece of work, and what each one claims. These are the words behind the colours; the colours were already consistent and the meanings were the part nobody had written down."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {zumiStates.map((state) => (
              <Card dark key={state} style={{ padding: "var(--space-5)" }}>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: state === "dormant" ? "var(--text-secondary)" : `var(--status-${state})` }}
                  />
                  <span className="text-sm font-bold capitalize">{state}</span>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">{STATE_MEANING[state]}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Badges"
          note="A badge reports state. Every tone the design system exports is shown; neutral is the one that makes no status claim."
        >
          <div className="flex flex-wrap items-center gap-3">
            {badgeTones.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-[12px] leading-5 text-[var(--text-secondary)]">{NEUTRAL_MEANING}</p>
        </Section>

        <Section
          title="Buttons"
          note="Variants carry meaning rather than decoration. Every variant is shown at every size, so a spacing or contrast regression is visible here before it reaches a workspace."
        >
          <div className="space-y-5">
            {buttonVariants.map((variant) => (
              <div className="flex flex-wrap items-center gap-4" key={variant}>
                <span className="w-24 shrink-0 text-[var(--text-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                  {variant}
                </span>
                {buttonSizes.map((size) => (
                  <Button key={size} size={size} variant={variant}>
                    {size}
                  </Button>
                ))}
                <span className="text-[12px] leading-5 text-[var(--text-secondary)]">{VARIANT_MEANING[variant]}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Colour"
          note="Swatches reference the live token, not a copied value. If a token changes, this page changes with it — and if a token is deleted, the swatch goes blank rather than showing a stale colour."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLOUR_TOKENS.map(({ token, label }) => (
              <div className="rounded-[14px] border border-[var(--line-dark)] p-4" key={token}>
                <span aria-hidden className="block h-10 rounded-[10px]" style={{ background: `var(${token})` }} />
                <p className="mt-3 text-[12px] font-bold">{label}</p>
                <code className="mt-1 block text-[11px] text-[var(--text-secondary)]">{token}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Type scale"
          note="Each line is rendered at its own token, so the steps can be judged against each other rather than read as numbers."
        >
          <div className="space-y-3">
            {TYPE_SCALE.map(({ token, label }) => (
              <div className="flex flex-wrap items-baseline gap-4" key={token}>
                <span style={{ fontSize: `var(${token})` }}>{label}</span>
                <code className="text-[11px] text-[var(--text-secondary)]">{token}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Zumi presence"
          note="The orb reports what Klinikos is doing, using the same six states. It is a status indicator, not decoration — an orb that animates while nothing is happening is a lie about the system."
        >
          <div className="flex flex-wrap items-end gap-8">
            {zumiStates.map((state) => (
              <div className="text-center" key={state}>
                <ZumiOrb size={72} state={state} />
                <p className="mt-2 text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-secondary)]">
                  {state}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Accessibility floor"
          note="These hold globally and are not optional per surface. They are listed because a reference page that showed only colour would imply the rest is discretionary."
        >
          <ul className="max-w-3xl space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
            <li>A skip link reaches the page content before any navigation.</li>
            <li>Focus is always visible, including under forced-colours mode.</li>
            <li>Reduced-motion preferences disable animation rather than shortening it.</li>
            <li>Interactive controls keep a 44px minimum touch target.</li>
            <li>Small text on the dark surfaces stays at or above the normal-text contrast floor.</li>
          </ul>
        </Section>
      </div>
    </DsSurface>
  );
}
