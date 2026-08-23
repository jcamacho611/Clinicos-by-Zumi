import Link from "next/link";

import { EduCommandHeader, EduEmptyState } from "@/components/edu/edu-shell";
import { WorkforceFeedbackForm } from "@/components/edu/workforce-feedback-form";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { listWorkforceSessions } from "@/lib/edu/workforce-delivery-repository";
import { canSubmitWorkforceFeedback } from "@/lib/edu/workforce-feedback";

export const dynamic = "force-dynamic";

export default async function EduFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const identity = await resolveEduIdentity();
  if (!identity || !canSubmitWorkforceFeedback(identity.role)) return null;

  const { session: requestedSessionId } = await searchParams;
  const sessions = identity.institutionId ? await listWorkforceSessions(identity) : [];
  const selected = sessions.find((session) => session.id === requestedSessionId) ?? sessions[0] ?? null;
  const participantMode = identity.role === "edu_student";

  return (
    <>
      <EduCommandHeader
        eyebrow="Program improvement"
        title={participantMode ? "Training feedback" : "Session reflections"}
        description={participantMode
          ? "Tell the instructional team what helped, what was unclear, and whether your confidence changed. Feedback is not a grade and does not change attendance or completion automatically."
          : "Capture structured delivery feedback that can inform curriculum review and continuous improvement without changing participant outcomes automatically."}
      />
      <div className="px-5 py-6 sm:px-8">
        {!selected ? (
          <EduEmptyState title="No accessible sessions yet" detail="Feedback is linked to a real live instructional session so the program can improve the correct delivery, curriculum version, and cohort." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
            <aside className="border border-[#e28b85]/12 bg-[#12090b]/45 p-5" aria-labelledby="feedback-session-title">
              <h2 className="text-sm font-semibold text-[#f8efed]" id="feedback-session-title">Choose session</h2>
              <ul className="mt-4 grid gap-2">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      aria-current={session.id === selected.id ? "page" : undefined}
                      className="block border p-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e6817b]"
                      href={`/edu/feedback?session=${encodeURIComponent(session.id)}`}
                      style={{
                        borderColor: session.id === selected.id ? "rgba(230,129,123,.5)" : "rgba(226,139,133,.12)",
                        background: session.id === selected.id ? "rgba(230,129,123,.08)" : "rgba(13,7,8,.55)",
                      }}
                    >
                      <span className="block font-semibold text-[#f8efed]">{session.title}</span>
                      <span className="mt-1 block leading-5 text-[#8f7773]">{new Date(session.startsAt).toLocaleString()} · {session.deliveryMode.replaceAll("_", " ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
            <WorkforceFeedbackForm participantMode={participantMode} sessionId={selected.id} />
          </div>
        )}
      </div>
    </>
  );
}
