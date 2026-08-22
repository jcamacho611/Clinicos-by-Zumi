import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { loadPersistedActiveQualityGapEvaluations } from "@/lib/repositories/quality-assurance-repository";
import {
  resolveTrustedZumiQualityAssurance,
  type ZumiTrustedQualityAssurance,
} from "@/features/zumi/trusted-orchestration";

export function isQualityGuardianQuestion(question: string) {
  const normalized = question.toLowerCase();
  if (/\b(quality|hedis|ncqa|mips)\b/.test(normalized)) return true;
  if (/\bcare\s+gaps?\b/.test(normalized)) return true;
  if (/\bquality\s+(measure|measures|audit|review|score|scores|gap|gaps|performance)\b/.test(normalized)) return true;
  if (/\bcms\b/.test(normalized) && /\b(quality|measure|measures|gap|gaps|audit|performance)\b/.test(normalized)) return true;
  return false;
}

export type ZumiQualityGuardianContext = {
  requested: boolean;
  coverage: "persisted_active_quality_gap_backlog";
  quality: ZumiTrustedQualityAssurance;
};

function unavailableQuality(warnings: string[]): ZumiTrustedQualityAssurance {
  return {
    available: false,
    snapshot: null,
    internalCapabilityAvailable: null,
    nextActions: [],
    expertNeeds: [],
    blockers: [],
    warnings,
  };
}

/**
 * Loads Quality Guardian state only for a deterministic quality-related question.
 * The repository read is tenant/RBAC scoped and the returned object contains only
 * aggregate/action metadata. Patient identifiers and evidence references never
 * leave the repository/orchestration boundary through this context object.
 *
 * Internal capability is intentionally `unknown` here. Merely failing to discover
 * a quality specialist in this loader must never auto-create outside paid work.
 */
export async function loadZumiQualityGuardianContext(input: {
  session: ClinicSession;
  question: string;
}): Promise<ZumiQualityGuardianContext | null> {
  if (!isQualityGuardianQuestion(input.question)) return null;

  const loaded = await loadPersistedActiveQualityGapEvaluations(input.session);
  if (!loaded.authorized || !loaded.complete) {
    return {
      requested: true,
      coverage: loaded.coverage,
      quality: unavailableQuality(loaded.warnings),
    };
  }

  const quality = resolveTrustedZumiQualityAssurance({
    session: input.session,
    evaluations: loaded.evaluations,
    internalQualityCapabilityAvailable: null,
  });

  return {
    requested: true,
    coverage: loaded.coverage,
    quality: {
      ...quality,
      warnings: [...loaded.warnings, ...quality.warnings],
    },
  };
}
