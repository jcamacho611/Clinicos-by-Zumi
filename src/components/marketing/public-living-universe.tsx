import { projectPublicLivingUniverse } from "@/lib/orchestration/public-living-universe";
import { PublicLivingUniverseStage } from "@/components/marketing/public-living-universe-stage";

/**
 * Server half of the action-first surface. It reads the Path catalog — server authority
 * on what journeys exist and what state each is in — and hands the client a finished,
 * minimum-necessary projection. The catalog itself never reaches the browser.
 */
export function PublicLivingUniverse() {
  return <PublicLivingUniverseStage items={projectPublicLivingUniverse()} />;
}
