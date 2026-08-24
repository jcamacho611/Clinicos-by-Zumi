import { EduCommandHeader } from "@/components/edu/edu-shell";
import { ZumiWorkforcePractice } from "@/components/edu/zumi-workforce-practice";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { industryAcceleratorPathways } from "@/lib/edu/workforce-ai-program";
import { eduZumiPracticeModes, type EduZumiPracticeModeKey } from "@/lib/edu/zumi-workforce-practice";

export const dynamic = "force-dynamic";

export default async function EduZumiPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ pathway?: string }>;
}) {
  const identity = await resolveEduIdentity();
  if (!identity) return null;

  const { pathway: requestedPathway } = await searchParams;
  const pathway = industryAcceleratorPathways.find((entry) => entry.key === requestedPathway) ?? null;
  const allowedModes = eduZumiPracticeModes
    .filter((mode) => mode.allowedRoles.includes(identity.role))
    .map((mode) => mode.key) as EduZumiPracticeModeKey[];

  return (
    <>
      <EduCommandHeader
        eyebrow="Klinikos Intelligence"
        title="Zumi workforce practice"
        description={pathway
          ? `${pathway.label} practice context. Zumi can teach, question, explain, and critique while people retain responsibility for assessed work, attendance, grading, completion, and real-world decisions.`
          : "A governed AI practice space for learning, critique, and instructor support. Zumi can teach, question, explain, and draft; people retain responsibility for assessed work, attendance, grading, completion, and real-world decisions."}
      />
      <div className="px-5 py-6 sm:px-8">
        <ZumiWorkforcePractice allowedModes={allowedModes} pathway={pathway?.label ?? null} />
      </div>
    </>
  );
}
