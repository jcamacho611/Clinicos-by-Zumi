import { redirect } from "next/navigation";
import { requireClinicSession } from "@/lib/auth/session";
import { commandSurfaces } from "@/lib/design/command-system";
import { OnboardingConversation } from "@/components/clinic/onboarding-conversation";
import { loadKnownContext, needsOnboarding } from "@/lib/onboarding/onboarding-service";

/**
 * Zumi-guided clinic setup.
 *
 * A clinic that has already been configured is sent to its command centre rather than
 * asked the same questions again.
 */

export const dynamic = "force-dynamic";

export const metadata = { title: "Set up your clinic — Klinikos" };

export default async function OnboardingPage() {
  const session = await requireClinicSession();
  if (!process.env.DATABASE_URL) {
    return (
      <div className={`${commandSurfaces.shell} px-5 py-16 sm:px-8`}>
        <p className="text-sm text-slate-300">Setup is unavailable in this environment.</p>
      </div>
    );
  }

  if (!(await needsOnboarding(session.organizationId))) redirect("/dashboard");

  const context = await loadKnownContext(session.organizationId, session.email);
  return (
    <div className={commandSurfaces.shell}>
      <OnboardingConversation context={context} />
    </div>
  );
}
