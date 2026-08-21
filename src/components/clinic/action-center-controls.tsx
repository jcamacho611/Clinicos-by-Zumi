"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Hand, LoaderCircle } from "lucide-react";

/**
 * The two things a person can finish from the Action Center without leaving it.
 *
 * The surface was read-only: an action centre you could not act in. Every item linked
 * away to another workspace, so the one screen designed to answer "what needs me" could
 * not do anything about the answer.
 *
 * These call the existing governed routes rather than a new one. `/api/tasks/[id]/assign`
 * and `/api/tasks/[id]/transition` already enforce tasks:update, scope to the caller's
 * organization, and write an audit row — so the same rules apply here as anywhere else,
 * and this surface gets no privileges of its own.
 *
 * Nothing is optimistic. A row disappears because the server said it changed, not
 * because a button was pressed; the alternative is a list that quietly disagrees with
 * the database. On failure the item stays and says so.
 */

type Action = "claim" | "complete";

export function ActionCenterControls({
  canClaim,
  canComplete,
  taskId,
  userId,
}: {
  canClaim: boolean;
  canComplete: boolean;
  taskId: string;
  userId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canClaim && !canComplete) return null;

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const response = action === "claim"
        ? await fetch(`/api/tasks/${taskId}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: userId }),
          })
        : await fetch(`/api/tasks/${taskId}/transition`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // The note is required by the transition schema and is written to the audit
            // row, so it says where the action came from rather than padding to length.
            body: JSON.stringify({ action: "complete", note: "Completed from the action center." }),
          });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "That did not go through.");
      }
      // Re-read from the server. The row leaves the list because the task changed.
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not go through.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canClaim ? (
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => run("claim")}
          style={{ borderColor: "var(--line-dark)", color: "var(--text-primary)" }}
          type="button"
        >
          {busy === "claim" ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : <Hand aria-hidden="true" className="size-3.5" />}
          Claim
        </button>
      ) : null}

      {canComplete ? (
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => run("complete")}
          style={{ background: "var(--accent-intelligence)", color: "#1a090a" }}
          type="button"
        >
          {busy === "complete" ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : <Check aria-hidden="true" className="size-3.5" />}
          Done
        </button>
      ) : null}

      {error ? (
        <p className="text-[12px]" role="status" style={{ color: "var(--status-signal)" }}>{error}</p>
      ) : null}
    </div>
  );
}
