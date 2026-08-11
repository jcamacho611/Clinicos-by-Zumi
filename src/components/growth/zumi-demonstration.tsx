"use client";

import { useState } from "react";
import { commandSurfaces } from "@/lib/design/command-system";
import {
  DEMONSTRATION_DATA_NOTICE,
  formatUsdFromCents,
  morningBriefing,
  type DemonstrationLine,
} from "@/lib/growth/demonstration";
import { ZumiAssistantOrb } from "@/components/command/zumi-command-shell";
import { recordIntent } from "@/components/growth/intent-beacon";

/**
 * The scripted Zumi demonstration.
 *
 * There is no input field here, and nothing on this component reaches the AI gateway.
 * A visitor advances through a fixed exchange and sees how Zumi presents work; they
 * do not get to ask it anything, because Zumi is what the subscription buys.
 *
 * The motion is a reveal, which is permitted on a marketing surface: the sequence
 * *is* the argument — fragmented signals resolving into one accounted list.
 */
export function ZumiDemonstration() {
  const [revealed, setRevealed] = useState(1);
  const complete = revealed >= morningBriefing.length;

  function advance() {
    const next = Math.min(morningBriefing.length, revealed + 1);
    setRevealed(next);
    if (next === 2) recordIntent("demo_started", "zumi_briefing");
    if (next === morningBriefing.length) recordIntent("demo_completed", "zumi_briefing");
  }

  return (
    <div className={`${commandSurfaces.panelRaised} p-5 sm:p-7`}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <ZumiAssistantOrb active={!complete} />
        <div>
          <p className={commandSurfaces.eyebrowAi}>Zumi · morning briefing</p>
          <p className="mt-1 text-[11px] text-slate-500">Scripted demonstration</p>
        </div>
      </div>

      <ol className="mt-6 grid gap-5">
        {morningBriefing.slice(0, revealed).map((line, index) => (
          <li key={`${line.speaker}-${index}`}>
            <Line line={line} />
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        {!complete ? (
          <button
            className={`${commandSurfaces.interactive} inline-flex items-center border border-cyan-300/40 bg-cyan-400/[.08] px-4 text-sm font-extrabold text-cyan-200`}
            onClick={advance}
            type="button"
          >
            Continue
          </button>
        ) : (
          <p className="text-[12px] leading-6 text-slate-400">
            That is the whole exchange. Zumi prepared the work; a person confirmed it.
          </p>
        )}
      </div>

      <p className="mt-5 text-[11px] leading-5 text-slate-500">{DEMONSTRATION_DATA_NOTICE}</p>
    </div>
  );
}

function Line({ line }: { line: DemonstrationLine }) {
  if (line.speaker === "owner") {
    return (
      <div className="border-l-2 border-white/20 pl-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-500">Clinic owner</p>
        <p className="mt-1.5 text-base leading-7 text-white">{line.text}</p>
      </div>
    );
  }

  return (
    <div className={`${commandSurfaces.panelAi} p-4`}>
      <p className={commandSurfaces.eyebrowAi}>Zumi</p>
      <p className="mt-2 text-sm leading-7 text-slate-100">{line.text}</p>

      {line.findings && (
        <ul className="mt-4 grid gap-2">
          {line.findings.map((finding) => (
            <li className="flex items-baseline gap-3 border-t border-white/10 pt-2 first:border-t-0 first:pt-0" key={finding.label}>
              <span className="min-w-[2.5rem] text-lg font-extrabold tabular-nums text-cyan-200">{finding.count}</span>
              <span className="text-[13px] leading-6 text-slate-200">{finding.label}</span>
              <span className="ml-auto text-[11px] uppercase tracking-[.1em] text-slate-500">{finding.surface}</span>
            </li>
          ))}
        </ul>
      )}

      {line.opportunityCents !== undefined && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#e6c55b]">Estimated revenue opportunity</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-[-.04em] text-white">
            {formatUsdFromCents(line.opportunityCents)}
          </p>
          {/* An estimate presented as certain is a promise. It is labelled both ways. */}
          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            An estimate derived from the clinic&rsquo;s own recorded values in this demonstration. Not a projection, a forecast, or a guarantee.
          </p>
        </div>
      )}
    </div>
  );
}
