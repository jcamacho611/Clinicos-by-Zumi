import type { ZumiPresence } from "@/features/zumi/presence";
import { resolvedZumiToolCatalog, type ZumiToolAction, type ZumiToolDescriptor, type ZumiToolReadiness } from "@/features/zumi/tool-catalog";

export type ZumiPlanPhase = "understand" | "retrieve" | "research" | "compute" | "prepare" | "verify" | "respond";

export type ZumiPlanStep = {
  phase: ZumiPlanPhase;
  label: string;
  toolKeys: string[];
  executableNow: boolean;
  requiresApproval: boolean;
};

export type ZumiOrchestrationPlan = {
  goal: string;
  requestedMode: ZumiPresence["mode"];
  candidateTools: Array<{
    key: string;
    label: string;
    readiness: ZumiToolReadiness;
    actions: readonly ZumiToolAction[];
    risk: ZumiToolDescriptor["risk"];
  }>;
  steps: ZumiPlanStep[];
  canPrepareActions: boolean;
  canExecuteConsequentialActions: false;
  notes: string[];
};

const INTENT_TOOLS: ReadonlyArray<{ pattern: RegExp; tools: readonly string[] }> = [
  { pattern: /\b(latest|today|current|news|research|verify|source|look up|internet|web)\b/i, tools: ["web_search"] },
  { pattern: /\b(calculate|math|estimate|forecast|simulate|analy[sz]e|csv|spreadsheet|statistics|code|script)\b/i, tools: ["code_interpreter", "analytics"] },
  { pattern: /\b(schedule|calendar|meeting|appointment|availability|free time)\b/i, tools: ["calendar", "clinic_records"] },
  { pattern: /\b(email|inbox|message|reply|send|follow up|outreach)\b/i, tools: ["email", "documents"] },
  { pattern: /\b(text|sms|phone|call|voice|voicemail)\b/i, tools: ["sms", "voice"] },
  { pattern: /\b(document|file|pdf|form|contract|consent|letter|record)\b/i, tools: ["documents", "file_search"] },
  { pattern: /\b(grid|provider|contractor|space|room|equipment|seller|marketplace|capacity|shift|job)\b/i, tools: ["grid", "maps", "identity_credentials"] },
  { pattern: /\b(map|nearby|distance|route|travel|location|address)\b/i, tools: ["maps"] },
  { pattern: /\b(pay|payment|checkout|refund|payout|invoice|money|charge|stripe)\b/i, tools: ["payments", "marketplace_payouts", "billing"] },
  { pattern: /\b(insurance|eligibility|claim|remit|payer|billing|cms.?1500)\b/i, tools: ["billing", "eligibility_claims"] },
  { pattern: /\b(lab|quest|labcorp|result)\b/i, tools: ["labs", "clinic_records"] },
  { pattern: /\b(imaging|radiology|x-?ray|mri|ct|pacs)\b/i, tools: ["imaging", "clinic_records"] },
  { pattern: /\b(telemedicine|video visit|virtual visit)\b/i, tools: ["telemedicine", "calendar"] },
  { pattern: /\b(credential|license|malpractice|npi|dea|privilege|identity)\b/i, tools: ["identity_credentials"] },
  { pattern: /\b(security|audit|risk|breach|suspicious|login|access control|permission)\b/i, tools: ["security"] },
  { pattern: /\b(github|repository|repo|pull request|pr\b|ci\b|build|deploy|bug|codebase)\b/i, tools: ["github", "code_interpreter"] },
  { pattern: /\b(database|sql|query|table|schema|postgres|supabase)\b/i, tools: ["database", "analytics"] },
  { pattern: /\b(image|photo|screenshot|diagram|scan|picture|visual)\b/i, tools: ["vision"] },
  { pattern: /\b(patient|chart|encounter|clinical|diagnos|medication|treatment)\b/i, tools: ["patient_records", "clinic_records"] },
  { pattern: /\b(remember|memory|preference|always|from now on|my style)\b/i, tools: ["conversation_memory"] },
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function candidateToolKeys(question: string, presence: ZumiPresence) {
  const keys = ["canonical_knowledge"];
  for (const mapping of INTENT_TOOLS) {
    if (mapping.pattern.test(question)) keys.push(...mapping.tools);
  }
  if (presence.mode === "research") keys.push("web_search", "file_search");
  if (presence.mode === "briefing") keys.push("clinic_records", "analytics", "calendar");
  if (presence.mode === "command") keys.push("clinic_records");
  if (presence.inputModalities.includes("voice") || presence.outputModalities.includes("speech")) keys.push("voice");
  if (presence.inputModalities.includes("image")) keys.push("vision");
  if (presence.inputModalities.includes("file")) keys.push("file_search", "documents");
  return unique(keys);
}

function isExecutable(readiness: ZumiToolReadiness) {
  return readiness === "active" || readiness === "configured" || readiness === "provider_capability";
}

function hasAction(tool: { actions: readonly ZumiToolAction[] }, action: ZumiToolAction) {
  return tool.actions.includes(action);
}

function requiresApproval(tool: { actions: readonly ZumiToolAction[]; risk: string; requiresExplicitApprovalForWrite?: boolean }) {
  return Boolean(
    tool.requiresExplicitApprovalForWrite ||
    hasAction(tool, "write") ||
    hasAction(tool, "execute") ||
    tool.risk === "CRITICAL",
  );
}

export function planZumiOrchestration(input: {
  question: string;
  presence: ZumiPresence;
  env?: Record<string, string | undefined>;
}): ZumiOrchestrationPlan {
  const catalog = resolvedZumiToolCatalog(input.env);
  const byKey = new Map(catalog.map((tool) => [tool.key, tool] as const));
  const tools = candidateToolKeys(input.question, input.presence)
    .map((key) => byKey.get(key))
    .filter((tool): tool is (typeof catalog)[number] => Boolean(tool));

  const retrievalTools = tools.filter((tool) => ["knowledge", "memory", "operations", "documents", "marketplace", "clinical", "trust", "security"].includes(tool.family));
  const researchTools = tools.filter((tool) => tool.family === "research" || tool.key === "file_search");
  const computeTools = tools.filter((tool) => hasAction(tool, "compute"));
  const prepareTools = tools.filter((tool) => hasAction(tool, "draft") || hasAction(tool, "write") || hasAction(tool, "execute"));

  const steps: ZumiPlanStep[] = [
    { phase: "understand", label: "Resolve the user's real goal, context, constraints, and risk level.", toolKeys: [], executableNow: true, requiresApproval: false },
  ];

  if (retrievalTools.length) {
    steps.push({
      phase: "retrieve",
      label: "Retrieve the minimum authorized Klinikos, memory, workspace, or record context needed.",
      toolKeys: retrievalTools.map((tool) => tool.key),
      executableNow: retrievalTools.some((tool) => isExecutable(tool.readiness)),
      requiresApproval: false,
    });
  }
  if (researchTools.length) {
    steps.push({
      phase: "research",
      label: "Research current external evidence when needed and keep public research separated from private context.",
      toolKeys: researchTools.map((tool) => tool.key),
      executableNow: researchTools.some((tool) => isExecutable(tool.readiness)),
      requiresApproval: false,
    });
  }
  if (computeTools.length) {
    steps.push({
      phase: "compute",
      label: "Use computation or analysis where it improves precision.",
      toolKeys: computeTools.map((tool) => tool.key),
      executableNow: computeTools.some((tool) => isExecutable(tool.readiness)),
      requiresApproval: false,
    });
  }
  if (prepareTools.length && input.presence.autonomy !== "answer_only") {
    steps.push({
      phase: "prepare",
      label: "Prepare the next safe action or draft without representing it as executed.",
      toolKeys: prepareTools.map((tool) => tool.key),
      executableNow: prepareTools.some((tool) => isExecutable(tool.readiness)),
      requiresApproval: prepareTools.some(requiresApproval),
    });
  }
  steps.push(
    { phase: "verify", label: "Challenge consequential conclusions, check source/status conflicts, and verify action state.", toolKeys: [], executableNow: true, requiresApproval: false },
    { phase: "respond", label: "Explain the answer clearly for the user's requested accessibility and interaction mode.", toolKeys: [], executableNow: true, requiresApproval: false },
  );

  const unavailable = tools.filter((tool) => !isExecutable(tool.readiness));
  const notes = [
    "The plan is advisory until a typed runtime adapter actually executes a tool.",
    "Tool availability never grants permission; tenant, RBAC, data-class, step-up, consent, and human-review gates still apply.",
  ];
  if (unavailable.length) {
    notes.push(`Some useful capabilities are not active yet: ${unavailable.map((tool) => `${tool.label} (${tool.readiness})`).join(", ")}.`);
  }

  return {
    goal: input.question.trim().slice(0, 280),
    requestedMode: input.presence.mode,
    candidateTools: tools.map((tool) => ({ key: tool.key, label: tool.label, readiness: tool.readiness, actions: tool.actions, risk: tool.risk })),
    steps,
    canPrepareActions: input.presence.autonomy === "prepare_actions" || input.presence.autonomy === "suggest_actions",
    canExecuteConsequentialActions: false,
    notes,
  };
}

export function orchestrationInstruction(plan: ZumiOrchestrationPlan) {
  return [
    "Zumi orchestration plan for this turn:",
    ...plan.steps.map((step, index) => `${index + 1}. ${step.phase.toUpperCase()}: ${step.label}${step.toolKeys.length ? ` Candidate tools: ${step.toolKeys.join(", ")}.` : ""}${step.requiresApproval ? " Human approval may be required before any consequential write." : ""}`),
    `Candidate tool readiness: ${plan.candidateTools.map((tool) => `${tool.key}=${tool.readiness}`).join(", ") || "none"}.`,
    "Do not claim a candidate tool was used unless runtime telemetry says it was actually used.",
  ].join("\n");
}
