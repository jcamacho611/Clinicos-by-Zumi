import "server-only";

import type { ZumiExternalSource } from "@/features/zumi/providers";
import type { ZumiTrustedOrchestration } from "@/features/zumi/trusted-orchestration";
import type { ZumiWorkspaceIntelligence } from "@/features/zumi/workspace-intelligence";

export type ZumiClientAction = {
  id: string;
  title: string;
  reason: string;
  href: string | null;
  state: string;
};

export type ZumiClientGuidance = {
  path: { title: string; status: string; progress: number } | null;
  nextActions: ZumiClientAction[];
  blockers: Array<{ id: string; title: string; explanation: string }>;
};

export type ZumiClientWorkspace = {
  title: string;
  prompt: string;
  suggestedQuestions: string[];
  primaryDestinations: Array<{ label: string; href: string }>;
  relatedDestinations: Array<{ label: string; href: string; description: string }>;
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
  "Current Klinikos workspace:",
] as const;

const CONFIDENTIAL_OUTPUT_PATTERNS = [
  { kind: "private_key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i },
  { kind: "github_token", pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { kind: "stripe_secret", pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { kind: "openai_secret", pattern: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/ },
  { kind: "aws_access_key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { kind: "database_credential_uri", pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s/:@]+:[^\s@]+@[^\s]+/i },
  { kind: "bearer_jwt", pattern: /\bBearer\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/i },
  { kind: "secret_assignment", pattern: /\b(?:AUTH_SECRET|DATABASE_URL|STRIPE_SECRET_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY|TWILIO_AUTH_TOKEN|DOCUMENT_ENCRYPTION_KEY|ZUMI_CONVERSATION_SIGNING_SECRET)\s*[=:]\s*[^\s,;]+/i },
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

export function projectTrustedOrchestrationForClient(orchestration: ZumiTrustedOrchestration): ZumiClientGuidance {
  return {
    path: orchestration.path
      ? { title: orchestration.path.title, status: orchestration.path.status, progress: safeProgress(orchestration.path.progress) }
      : null,
    nextActions: orchestration.nextActions.slice(0, 6).map((action, index) => ({
      id: `action-${index + 1}`,
      title: action.title.slice(0, 160),
      reason: action.reason.slice(0, 500),
      href: safeInternalHref(action.href),
      state: action.state,
    })),
    blockers: orchestration.blockers.slice(0, 6).map((blocker, index) => ({
      id: `blocker-${index + 1}`,
      title: blocker.title.slice(0, 160),
      explanation: blocker.explanation.slice(0, 500),
    })),
  };
}

export function projectWorkspaceIntelligenceForClient(workspace: ZumiWorkspaceIntelligence): ZumiClientWorkspace {
  return {
    title: workspace.title,
    prompt: workspace.prompt,
    suggestedQuestions: workspace.suggestedQuestions.slice(0, 4).map((question) => question.slice(0, 180)),
    primaryDestinations: workspace.primaryDestinations.slice(0, 5).flatMap((item) => {
      const href = safeInternalHref(item.href);
      return href ? [{ label: item.label.slice(0, 80), href }] : [];
    }),
    relatedDestinations: workspace.relatedDestinations.slice(0, 6).flatMap((item) => {
      const href = safeInternalHref(item.href);
      return href ? [{ label: item.label.slice(0, 80), href, description: item.description.slice(0, 240) }] : [];
    }),
  };
}

function isPublicResearchUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;
    if (url.username || url.password) return false;
    return true;
  } catch {
    return false;
  }
}

export function projectZumiSourcesForClient(sources: readonly ZumiExternalSource[]) {
  const projected: Array<{ url: string; title?: string }> = [];
  const seen = new Set<string>();
  for (const source of sources) {
    if (!isPublicResearchUrl(source.url) || seen.has(source.url)) continue;
    seen.add(source.url);
    projected.push({ url: source.url, ...(source.title?.trim() ? { title: source.title.trim().slice(0, 300) } : {}) });
    if (projected.length >= 12) break;
  }
  return projected;
}

export function sanitizeZumiAnswerForClient(answer: string) {
  const blockedMarkers = CONFIDENTIAL_OUTPUT_MARKERS.filter((marker) => answer.includes(marker));
  const blockedKinds = CONFIDENTIAL_OUTPUT_PATTERNS.filter(({ pattern }) => pattern.test(answer)).map(({ kind }) => kind);
  if (blockedMarkers.length === 0 && blockedKinds.length === 0) {
    return { answer, blockedMarkers: [] as string[], blockedKinds: [] as string[] };
  }
  return {
    answer: "I can explain the outcome, evidence, and available actions, but I can’t expose Klinikos internal security, orchestration, credential, or proprietary implementation instructions.",
    blockedMarkers: [...blockedMarkers],
    blockedKinds,
  };
}
