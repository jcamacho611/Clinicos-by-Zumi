import Link from "next/link";
import { ArrowRight, Orbit } from "lucide-react";
import type { GridMoney } from "@/lib/money/grid-money";

/**
 * Grid money on the Money surface.
 *
 * Kept visually separate from the clinical revenue cards above it rather than merged
 * into them. A patient balance and a marketplace obligation are promises to different
 * people, and a single blended total would be a number nobody could act on. Direction is
 * stated in words as well as colour, because "you owe" and "to you" are the only two
 * things a person is actually reading this for.
 */

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    .format(cents / 100);
}

export function GridMoneyPanel({ grid }: { grid: GridMoney | null }) {
  if (!grid) return null;

  return (
    <section
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--line-dark)", background: "var(--surface-secondary)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Orbit aria-hidden="true" className="size-4" style={{ color: "var(--accent-intelligence)" }} />
          <h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Grid money</h3>
        </div>
        <Link
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          href="/grid/transactions"
          style={{ color: "var(--accent-intelligence)" }}
        >
          Open transactions <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>

      {grid.quiet ? (
        <p className="mt-3 text-[13px] leading-6" style={{ color: "var(--text-secondary)" }}>
          No Grid transaction has reached settlement yet. Obligations appear here once work is
          recorded as fulfilled.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{money(grid.pendingToYouCents)}</p>
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>Pending to you</p>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{money(grid.youOweCents)}</p>
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>You owe</p>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{money(grid.settledToYouCents)}</p>
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>Settled to you</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {grid.lines.map((line) => (
              <li className="flex items-center justify-between gap-4 text-[12px]" key={line.id}>
                <span style={{ color: "var(--text-secondary)" }}>
                  {line.label} · {line.incoming ? "to you" : "you owe"} · {line.counterparty}
                </span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {line.incoming ? "" : "−"}{money(line.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
