"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Loader2, Play } from "lucide-react";

export function PathRuntimeActions({
  pathId,
  instanceId,
  currentNodeId,
  currentHref,
  goal,
}: {
  pathId: string;
  instanceId?: string | null;
  currentNodeId?: string | null;
  currentHref?: string | null;
  goal: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function startPath() {
    setState("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/paths", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pathId, goal }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Klinikos could not start this Path.");
      setState("idle");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Klinikos could not start this Path.");
    }
  }

  async function confirmCurrentStep() {
    if (!instanceId || !currentNodeId) return;
    setState("saving");
    setMessage(null);
    try {
      const response = await fetch(`/api/paths/${instanceId}/advance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ completedNodeId: currentNodeId }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "This step cannot be completed yet.");
      setState("idle");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "This step cannot be completed yet.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {!instanceId ? (
          <button type="button" onClick={startPath} disabled={state === "saving"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1e3a] px-4 text-xs font-extrabold text-white disabled:opacity-50">
            {state === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Start this Path
          </button>
        ) : null}
        {currentHref ? (
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1e3a] px-4 text-xs font-extrabold text-white" href={currentHref}>
            Open next action <ArrowUpRight className="size-4" />
          </Link>
        ) : null}
        {instanceId && currentNodeId ? (
          <button type="button" onClick={confirmCurrentStep} disabled={state === "saving"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0b1e3a]/12 bg-white px-4 text-xs font-extrabold text-[#0b1e3a] disabled:opacity-50">
            {state === "saving" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Confirm completed
          </button>
        ) : null}
      </div>
      <p className="text-[11px] leading-5 text-[#0b1e3a]/48">Consequential, regulated, financial, credential, or connector-dependent steps remain blocked until Klinikos receives the required governed evidence or review.</p>
      {message ? <p className={`text-xs ${state === "error" ? "text-rose-700" : "text-[#0b1e3a]/55"}`} aria-live="polite">{message}</p> : null}
    </div>
  );
}
