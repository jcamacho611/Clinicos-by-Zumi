export type EngineImplementationStatus = "existing" | "shared_v1" | "partial" | "external_dependency" | "planned";

export type EngineRegistryEntry = {
  number: number;
  key: string;
  name: string;
  status: EngineImplementationStatus;
  authority: string;
  notes: string;
};

export const klinikosEngineRegistry: readonly EngineRegistryEntry[] = [
  { number: 1, key: "identity", name: "Identity & Account", status: "existing", authority: "auth/session + Prisma", notes: "Users, patient portal accounts, sessions, passkeys, MFA foundations." },
  { number: 2, key: "rbac", name: "Authorization / RBAC", status: "existing", authority: "workspace authorization + roles/permissions", notes: "Organization and route/action boundaries remain authoritative." },
  { number: 3, key: "passport", name: "Klinikos Passport / Profile", status: "partial", authority: "health/intake passports + provider/profile models", notes: "Professional longitudinal orchestration remains to be unified." },
  { number: 4, key: "credential", name: "Credential & Verification", status: "existing", authority: "provider credentials + Grid eligibility", notes: "Human verification and activity-specific eligibility already exist." },
  { number: 5, key: "capability", name: "Capability Registry", status: "shared_v1", authority: "orchestration/capability-engine", notes: "Governed action metadata and policy checks." },
  { number: 6, key: "intent", name: "Intent", status: "shared_v1", authority: "orchestration/intent-engine", notes: "Deterministic fallback plus model schema validation." },
  { number: 7, key: "path", name: "Path", status: "shared_v1", authority: "paths catalog + orchestration/path-engine", notes: "Runtime and progression available." },
  { number: 8, key: "path-persistence", name: "Path Persistence", status: "partial", authority: "PathPersistenceStore contract", notes: "Durable Prisma-backed store still required." },
  { number: 9, key: "next-action", name: "Next Action", status: "shared_v1", authority: "orchestration/next-action-engine", notes: "Cross-domain ranking foundation." },
  { number: 10, key: "policy", name: "Eligibility / Policy", status: "shared_v1", authority: "Grid eligibility + capability policy", notes: "Regulated Grid eligibility remains specialized authority." },
  { number: 11, key: "blocker", name: "Blocker / Alternative", status: "shared_v1", authority: "orchestration/blocker-engine", notes: "Explainable blockers and safe fallback guidance." },
  { number: 12, key: "event", name: "Event / State Transition", status: "shared_v1", authority: "domain events + orchestration event bus", notes: "Unified durable event ledger remains a persistence task." },
  { number: 13, key: "signal", name: "Signal", status: "shared_v1", authority: "event-engine", notes: "Moving signals can be derived from events." },
  { number: 14, key: "notification", name: "Notification", status: "shared_v1", authority: "notification-engine", notes: "Delivery adapters remain connector-dependent." },
  { number: 15, key: "timeline", name: "Activity / Timeline", status: "partial", authority: "domain events + notification timeline", notes: "Unified persisted timeline view remains." },
  { number: 16, key: "graph", name: "Healthcare Relationship / Graph", status: "shared_v1", authority: "graph-engine", notes: "Postgres remains source of truth; graph is an abstraction." },
  { number: 17, key: "provider-network", name: "Provider Network", status: "existing", authority: "provider/network models", notes: "Directory, connections, privileges, capacity foundations exist." },
  { number: 18, key: "referral", name: "Referral Relay", status: "partial", authority: "referral + handoff domain", notes: "Needs more event-driven orchestration into Paths." },
  { number: 19, key: "patient-navigation", name: "Patient Navigation", status: "partial", authority: "patient navigation workspace/domain", notes: "Needs deeper Path orchestration." },
  { number: 20, key: "capacity", name: "Scheduling / Capacity", status: "existing", authority: "appointments + availability + capacity", notes: "Existing scheduling and capacity models." },
  { number: 21, key: "resource", name: "Resource", status: "existing", authority: "Grid universal resource system", notes: "Resources, composition, availability, policy classes." },
  { number: 22, key: "demand", name: "Demand / Need", status: "partial", authority: "Grid requests + capacity", notes: "Universal demand abstraction is emerging from Grid." },
  { number: 23, key: "availability", name: "Availability", status: "existing", authority: "provider/resource availability", notes: "Time-window foundations exist." },
  { number: 24, key: "matching", name: "Matching", status: "shared_v1", authority: "Grid eligibility + orchestration/matching-engine", notes: "Hard eligibility cannot be outweighed by soft rank." },
  { number: 25, key: "offer", name: "Offer / Terms", status: "partial", authority: "Grid request/transaction domain", notes: "Needs normalized reusable offer contract." },
  { number: 26, key: "reservation", name: "Reservation / Booking", status: "shared_v1", authority: "transaction-engine + scheduling", notes: "Collision detection added; durable locking remains domain-specific." },
  { number: 27, key: "transaction", name: "Transaction", status: "shared_v1", authority: "Grid transactions + orchestration/transaction-engine", notes: "Universal lifecycle rules now shared." },
  { number: 28, key: "fulfillment", name: "Fulfillment", status: "shared_v1", authority: "transaction state machine", notes: "Completion requires confirmed fulfillment." },
  { number: 29, key: "obligation", name: "Financial Obligation", status: "shared_v1", authority: "financial-engine", notes: "Who owes whom, amount, fees, due/paid transitions." },
  { number: 30, key: "payment", name: "Payment", status: "partial", authority: "Stripe/GoDaddy rails + financial policy", notes: "Universal server-verified settlement remains connector-dependent." },
  { number: 31, key: "payout", name: "Payout", status: "existing", authority: "GridPayout + Stripe Connect plan", notes: "Production payout rail depends on external activation." },
  { number: 32, key: "revenue", name: "Revenue / Fee", status: "shared_v1", authority: "financial-engine", notes: "Composable fee rules added; commercial configuration remains product policy." },
  { number: 33, key: "claims", name: "Billing / Claim", status: "existing", authority: "billing/claim domain", notes: "Claim readiness and lifecycle foundations exist." },
  { number: 34, key: "documents", name: "Document", status: "existing", authority: "document/record domain", notes: "Governed document foundations exist." },
  { number: 35, key: "consent", name: "Consent / Data Sharing", status: "existing", authority: "ConsentWallet + DataSharingAgreement", notes: "Purpose-bound sharing primitives exist." },
  { number: 36, key: "connectors", name: "Integration / Connector", status: "existing", authority: "connector taxonomy/catalog", notes: "Canonical external-dependency registry exists." },
  { number: 37, key: "entitlement", name: "Connector Activation / Entitlement", status: "shared_v1", authority: "connector-entitlement-engine", notes: "Funding and external readiness are explicit gates." },
  { number: 38, key: "zumi", name: "Zumi Orchestration", status: "shared_v1", authority: "Zumi gateway + orchestration/zumi-orchestration-engine", notes: "Structured validation and deterministic fallback added." },
  { number: 39, key: "review", name: "Human Review", status: "shared_v1", authority: "human-review-engine", notes: "Unified queue semantics and reasoned decisions." },
  { number: 40, key: "audit", name: "Audit", status: "existing", authority: "audit primitives/domain", notes: "Coverage audit remains ongoing." },
  { number: 41, key: "reliability", name: "Reliability / Failure", status: "shared_v1", authority: "ReliabilityEvent + reliability-engine", notes: "Degraded/unavailable/manual fallback behavior shared." },
  { number: 42, key: "workflow", name: "Job / Queue / Workflow", status: "shared_v1", authority: "workflow-engine", notes: "Retry/backoff/dead-letter semantics; durable queue adapter remains." },
  { number: 43, key: "search", name: "Search / Command", status: "shared_v1", authority: "search-engine", notes: "Authorization-filtered record ranking foundation." },
  { number: 44, key: "telemetry", name: "Telemetry / Outcome", status: "shared_v1", authority: "telemetry-engine", notes: "Outcome events and conversion metrics." },
  { number: 45, key: "time-to-outcome", name: "Time-to-Outcome", status: "shared_v1", authority: "telemetry-engine", notes: "Intent/Path start to declared outcome duration." },
] as const;

export function engineStatusSummary() {
  return klinikosEngineRegistry.reduce<Record<EngineImplementationStatus, number>>((counts, engine) => {
    counts[engine.status] += 1;
    return counts;
  }, { existing: 0, shared_v1: 0, partial: 0, external_dependency: 0, planned: 0 });
}
