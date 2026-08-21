export type PublicZumiRole =
  | "physician"
  | "nurse"
  | "nurse_practitioner"
  | "physician_assistant"
  | "therapist"
  | "clinic_owner"
  | "practice_manager"
  | "administrator"
  | "front_desk"
  | "biller"
  | "healthcare_student"
  | "healthcare_professional"
  | "contractor"
  | "injector"
  | "vendor"
  | "patient"
  | "educator"
  | "recruiter"
  | "space_owner"
  | "network_operator";

export type PublicZumiGoal =
  | "understand_klinikos"
  | "clinic_operations"
  | "follow_up"
  | "revenue"
  | "staffing"
  | "billing"
  | "patient_access"
  | "learning"
  | "find_work"
  | "find_capacity"
  | "software_stack"
  | "growth";

export type PublicConversationState = {
  sessionMode: "public";
  currentSurface: string;
  authenticated: false;
  confirmedRoles: PublicZumiRole[];
  primaryRole: PublicZumiRole | null;
  latestDeclaredRoles: PublicZumiRole[];
  ownsPractice: boolean;
  managesPractice: boolean;
  currentGoal: PublicZumiGoal | null;
  recentGoals: PublicZumiGoal[];
  lastSubstantiveUserTurn: string | null;
  currentMessageIsShortContinuation: boolean;
  userTurnCount: number;
};

type HistoryMessage = { role: "user" | "assistant"; content: string };

type RoleRule = {
  role: PublicZumiRole;
  group: "clinical" | "operations" | "learner" | "patient" | "network";
  patterns: readonly RegExp[];
};

const ROLE_RULES: readonly RoleRule[] = [
  { role: "physician", group: "clinical", patterns: [/\b(?:i(?:'m| am)|im|i work as|i practice as)\s+(?:a\s+)?(?:doctor|physician|m\.?d\.?)\b/i] },
  { role: "nurse_practitioner", group: "clinical", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:an?\s+)?(?:nurse practitioner|np)\b/i] },
  { role: "physician_assistant", group: "clinical", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:an?\s+)?(?:physician assistant|pa)\b/i] },
  { role: "nurse", group: "clinical", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:an?\s+)?(?:registered nurse|rn|nurse(?!\s+practitioner))\b/i] },
  { role: "therapist", group: "clinical", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:an?\s+)?therapist\b/i] },
  { role: "injector", group: "clinical", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:an?\s+)?(?:injector|aesthetic injector)\b/i] },
  { role: "clinic_owner", group: "operations", patterns: [/\b(?:i own|i run|i operate)\s+(?:my\s+|a\s+|the\s+)?(?:clinic|practice|med spa|medical practice)\b/i, /\b(?:i(?:'m| am)|im)\s+(?:a\s+)?(?:clinic|practice|med spa) owner\b/i] },
  { role: "practice_manager", group: "operations", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:a\s+)?(?:practice manager|clinic manager|office manager)\b/i] },
  { role: "administrator", group: "operations", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:an?\s+)?(?:administrator|admin)\b/i] },
  { role: "front_desk", group: "operations", patterns: [/\b(?:i(?:'m| am)|im|i work)\s+(?:at|on|in)?\s*(?:the\s+)?(?:front desk|reception)\b/i, /\b(?:i(?:'m| am)|im)\s+(?:a\s+)?receptionist\b/i] },
  { role: "biller", group: "operations", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:a\s+)?(?:medical )?biller\b/i] },
  { role: "healthcare_student", group: "learner", patterns: [/\b(?:i(?:'m| am)|im)\s+(?:a\s+)?(?:nursing|medical|healthcare|pa|np) student\b/i, /\bi(?:'m| am) in (?:nursing|medical) school\b/i] },
  { role: "educator", group: "learner", patterns: [/\b(?:i(?:'m| am)|im|i work as)\s+(?:an?\s+)?(?:educator|teacher|instructor|preceptor)\b/i] },
  { role: "patient", group: "patient", patterns: [/\b(?:i(?:'m| am)|im)\s+(?:a\s+)?patient\b/i, /\bi(?:'m| am) looking for (?:care|a doctor|an appointment)\b/i] },
  { role: "contractor", group: "network", patterns: [/\b(?:i(?:'m| am)|im)\s+(?:an?\s+)?(?:contractor|independent contractor|per diem worker)\b/i] },
  { role: "vendor", group: "network", patterns: [/\b(?:i(?:'m| am)|im)\s+(?:a\s+)?(?:vendor|service provider)\b/i] },
  { role: "recruiter", group: "network", patterns: [/\b(?:i(?:'m| am)|im)\s+(?:a\s+)?recruiter\b/i] },
  { role: "space_owner", group: "network", patterns: [/\b(?:i own|i have)\s+(?:an?\s+|the\s+)?(?:office|room|treatment room|chair|clinical space|medical space)\b/i] },
  { role: "network_operator", group: "network", patterns: [/\b(?:i run|i operate|i manage)\s+(?:a\s+|the\s+)?(?:network|clinic network|healthcare network)\b/i] },
  { role: "healthcare_professional", group: "clinical", patterns: [/\b(?:i(?:'m| am)|im)\s+(?:a\s+)?healthcare professional\b/i] },
];

const ROLE_GROUP = new Map(ROLE_RULES.map((rule) => [rule.role, rule.group]));
const CORRECTION = /\b(?:actually|correction|i mean|rather|not quite)\b/i;

const GOAL_RULES: ReadonlyArray<{ goal: PublicZumiGoal; patterns: readonly RegExp[] }> = [
  { goal: "follow_up", patterns: [/\b(?:call[- ]?backs?|follow[- ]?up|missed calls?|leads? slipping|falling through|forgot to call|forgetting to call)\b/i] },
  { goal: "revenue", patterns: [/\b(?:revenue|losing money|lost revenue|recover money|missed bookings?|unbooked leads?)\b/i] },
  { goal: "billing", patterns: [/\b(?:billing|claims?|denials?|eligibility|insurance|authorization|collections?)\b/i] },
  { goal: "staffing", patterns: [/\b(?:need|find|hire|hiring|coverage)\b[^.?!]{0,40}\b(?:nurse|provider|injector|receptionist|staff|assistant)\b/i, /\b(?:open|unfilled)\s+(?:shift|role|position)\b/i] },
  { goal: "find_work", patterns: [/\b(?:extra work|extra shifts?|per diem|find work|looking for work|job|gig|opportunit(?:y|ies))\b/i] },
  { goal: "find_capacity", patterns: [/\b(?:need|find|rent|offer|list|have)\b[^.?!]{0,40}\b(?:room|chair|space|equipment|service|capacity)\b/i] },
  { goal: "learning", patterns: [/\b(?:learn|training|course|student|school|education|skill|practice scenario|certification)\b/i] },
  { goal: "patient_access", patterns: [/\b(?:my appointment|book an appointment|patient portal|my forms|find care|see a doctor)\b/i] },
  { goal: "software_stack", patterns: [/\b(?:too much on software|software costs?|too many apps?|too many systems?|replace.*software|current stack|ehr)\b/i] },
  { goal: "growth", patterns: [/\b(?:grow|more patients|more bookings|increase revenue|expand my practice|expand the clinic)\b/i] },
  { goal: "clinic_operations", patterns: [/\b(?:run|manage|operate|organize|fix)\b[^.?!]{0,40}\b(?:clinic|practice|front desk|office)\b/i, /\b(?:front desk|clinic operations?|practice operations?|intake|scheduling)\b/i] },
  { goal: "understand_klinikos", patterns: [/\b(?:what is this|what is klinikos|what does klinikos do|what can (?:you|i|we) do|how can you help|how could you help|what do you do|like what|what else)\b/i] },
];

const SHORT_CONTINUATION = /^(?:like what|how|why|what else|then what|me\??|for me\??|show me|and\??|okay|ok|cool|what do you mean|can you do that|why would i use it|how (?:would|could) (?:you|that) help|how do you fix (?:it|that)|what about billing)[?.! ]*$/i;

function rolesDeclaredIn(message: string) {
  const roles = ROLE_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(message))).map((rule) => rule.role);
  if (roles.includes("nurse_practitioner")) return roles.filter((role) => role !== "nurse");
  return roles;
}

function goalsIn(message: string) {
  return GOAL_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(message))).map((rule) => rule.goal);
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

export function isPublicShortContinuation(message: string) {
  return SHORT_CONTINUATION.test(message.trim());
}

export function derivePublicConversationState(
  history: readonly HistoryMessage[],
  currentMessage: string,
  currentSurface = "/",
): PublicConversationState {
  let confirmedRoles: PublicZumiRole[] = [];
  let primaryRole: PublicZumiRole | null = null;
  let ownsPractice = false;
  let managesPractice = false;
  const recentGoals: PublicZumiGoal[] = [];
  let currentGoal: PublicZumiGoal | null = null;
  let lastSubstantiveUserTurn: string | null = null;
  let latestDeclaredRoles: PublicZumiRole[] = [];
  let userTurnCount = 0;

  const userMessages = history.filter((message) => message.role === "user").map((message) => message.content).concat(currentMessage);

  for (let index = 0; index < userMessages.length; index += 1) {
    const message = userMessages[index].trim();
    if (!message) continue;
    userTurnCount += 1;

    const declared = rolesDeclaredIn(message);
    if (index === userMessages.length - 1) latestDeclaredRoles = declared;

    if (declared.length > 0) {
      if (CORRECTION.test(message)) {
        const correctedGroups = new Set(declared.map((role) => ROLE_GROUP.get(role)).filter(Boolean));
        confirmedRoles = confirmedRoles.filter((existing) => !correctedGroups.has(ROLE_GROUP.get(existing)));
      }
      confirmedRoles = unique([...confirmedRoles, ...declared]);
      primaryRole = declared[declared.length - 1];
    }

    if (/\b(?:i own|i run|i operate)\s+(?:my\s+|a\s+|the\s+)?(?:clinic|practice|med spa|medical practice)\b/i.test(message)) ownsPractice = true;
    if (/\b(?:i manage|i run|i operate)\s+(?:my\s+|a\s+|the\s+)?(?:clinic|practice|office|med spa|medical practice)\b/i.test(message)) managesPractice = true;
    if (confirmedRoles.includes("clinic_owner")) ownsPractice = true;
    if (confirmedRoles.some((role) => role === "practice_manager" || role === "administrator")) managesPractice = true;

    const detectedGoals = goalsIn(message);
    if (detectedGoals.length > 0) {
      for (const goal of detectedGoals) recentGoals.push(goal);
      currentGoal = detectedGoals[0];
    }

    if (!isPublicShortContinuation(message) && !/^(?:hey|hi|hello|thanks|thank you|cool|ok|okay)[!.? ]*$/i.test(message)) {
      lastSubstantiveUserTurn = message;
    }
  }

  return {
    sessionMode: "public",
    currentSurface: currentSurface.startsWith("/") ? currentSurface.slice(0, 160) : "/",
    authenticated: false,
    confirmedRoles,
    primaryRole,
    latestDeclaredRoles,
    ownsPractice,
    managesPractice,
    currentGoal,
    recentGoals: unique(recentGoals).slice(-5),
    lastSubstantiveUserTurn,
    currentMessageIsShortContinuation: isPublicShortContinuation(currentMessage),
    userTurnCount,
  };
}

export const PUBLIC_ROLE_LABELS: Record<PublicZumiRole, string> = {
  physician: "physician",
  nurse: "nurse",
  nurse_practitioner: "nurse practitioner",
  physician_assistant: "physician assistant",
  therapist: "therapist",
  clinic_owner: "clinic owner",
  practice_manager: "practice manager",
  administrator: "clinic administrator",
  front_desk: "front-desk professional",
  biller: "medical biller",
  healthcare_student: "healthcare student",
  healthcare_professional: "healthcare professional",
  contractor: "healthcare contractor",
  injector: "aesthetic professional",
  vendor: "healthcare vendor or service provider",
  patient: "patient",
  educator: "healthcare educator",
  recruiter: "healthcare recruiter",
  space_owner: "healthcare space owner",
  network_operator: "healthcare network operator",
};

export function publicConversationStateForModel(state: PublicConversationState) {
  const roles = state.confirmedRoles.map((role) => PUBLIC_ROLE_LABELS[role]);
  return [
    `surface=${state.currentSurface}`,
    `self_described_roles=${roles.length > 0 ? roles.join(", ") : "none yet"}`,
    `owns_practice=${state.ownsPractice ? "yes" : "no/unknown"}`,
    `manages_practice=${state.managesPractice ? "yes" : "no/unknown"}`,
    `current_goal=${state.currentGoal ?? "unknown"}`,
    `recent_goals=${state.recentGoals.length > 0 ? state.recentGoals.join(", ") : "none"}`,
    `short_follow_up=${state.currentMessageIsShortContinuation ? "yes" : "no"}`,
  ].join("\n");
}
