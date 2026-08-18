import "server-only";

import type { ZumiExternalSource } from "@/features/zumi/providers";
import type { ZumiTrustedOrchestration } from "@/features/zumi/trusted-orchestration";

export type ZumiClientAction = {
  id: string;
  title: string;
  reason: string;
  href: string | null;
  state: string;
};

export type ZumiClientBlocker = {
  code: string;
  title: string;
  explanation: string;
};

export type ZumiClientGuidance = {
  path: {
    title: string;
    status: string;
    progress: number;
  } | null;
  nextActions: ZumiClientAction[];
  blockers: ZumiClientBlocker[];
};

export type ZumiClientSource = {
  url: string;
  title?: string;
};

const CONFIDENTIAL_OUTPUT_MARKERS = [
  "ZUMI_MASTER_DIRECTIVE_VERSION",
  "ZUMI_CONVERSATION_SIGNING_SECRET",
  "KLINIKOS_FOUNDER_USER_IDS",
  "KLINIKOS_STEP_UP_SIGNING_SECRET",
  "DOCUMENT_ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_AI_API_KEY",
  "DATABASE_URL",
  "Trusted Klinikos orchestration result:",
  "Trusted Quality Guardian result:",
  "Approved durable memory relevant to this user",
  "Klinikos repository context selected for this question",
] as const;

function safeInternalHref(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || value.includes("\u0000")) return null;
  return value;
}

function safeProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Reduce trusted orchestration to the minimum browser contract. Internal path/action
 * identifiers, capability keys, priorities, action policy blockers, blocker codes,
 * owners, warnings, intent candidates, and policy metadata never cross this boundary.
 */
export function projectTrustedOrchestrationForClient(
  orchestration: ZumiTrustedOrchestration,
): ZumiClientGuidance {
  return {
    path: orchestration.path
      ? {
          title: orchestration.path.title,
          status: orchestration.path.status,
          progress: safeProgress(orchestration.path.progress),
        }
      : null,
    nextActions: orchestration.nextActions.slice(0, 8).map((action, index) => ({
      id: `action-${index + 1}`,
      title: action.title,
      reason: action.reason,
      href: safeInternalHref(action.href),
      state: action.state,
    })),
    blockers: orchestration.blockers.slice(0, 8).map((blocker, index) => ({
      code: `blocker-${index + 1}`,
      title: blocker.title,
      explanation: blocker.explanation,
    })),
  };
}

function isPublicResearchUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) return false;
    if (url.username || url.password) return false;
    return true;
  } catch {
    return false;
  }
}

export function projectZumiSourcesForClient(sources: readonly ZumiExternalSource[]): ZumiClientSource[] {
  const projected: ZumiClientSource[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!isPublicResearchUrl(source.url) || seen.has(source.url)) continue;
    seen.add(source.url);
    projected.push({
      url: source.url,
      ...(source.title?.trim() ? { title: source.title.trim().slice(0, 300) } : {}),
    });
    if (projected.length >= 20) break;
  }

  return projected;
}

export function sanitizeZumiAnswerForClient(answer: string) {
  const blockedMarkers = CONFIDENTIAL_OUTPUT_MARKERS.filter((marker) => answer.includes(marker));
  if (blockedMarkers.length === 0) return { answer, blockedMarkers: [] as string[] };

  return {
    answer: "I can explain the outcome, evidence, and available actions, but I can’t expose Klinikos internal security, orchestration, credential, or proprietary implementation instructions.",
    blockedMarkers: [...blockedMarkers],
  };
}
