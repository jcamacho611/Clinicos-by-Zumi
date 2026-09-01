import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

export type KlinikosPathNodeState = "complete" | "current" | "upcoming" | "blocked";
export type KlinikosPathAvailability =
  | "available_now"
  | "requires_setup"
  | "requires_verification"
  | "requires_organization_connection"
  | "defined";
export type KlinikosPathAudience = "professional" | "learner" | "clinic" | "operations" | "patient";
export type KlinikosPathGroup = "individual" | "clinic" | "organization" | "education";

export type KlinikosPathNode = {
  id: string;
  label: string;
  description: string;
  href?: string;
  capabilityKey?: string;
  state: KlinikosPathNodeState;
};

export type KlinikosPathDefinition = {
  id: string;
  title: string;
  summary: string;
  audience: KlinikosPathAudience;
  group: KlinikosPathGroup;
  from: string;
  to: string;
  availability: KlinikosPathAvailability;
  governance: string;
  commercialBoundary?: string;
  intentExamples: string[];
  nodes: KlinikosPathNode[];
};

export const klinikosPathCatalog: KlinikosPathDefinition[] = [
  {
    id: "find-extra-work",
    title: "Find extra healthcare work",
    summary: "Move from professional readiness to availability, matching, and Grid opportunity.",
    audience: "professional",
    group: "individual",
    from: "Licensed or otherwise eligible professional",
    to: "Eligible paid opportunity",
    availability: "requires_verification",
    governance: "Grid eligibility is determined by the requirements of each opportunity. Klinikos does not waive licensure, credential, malpractice, scope-of-practice, facility, or employer requirements.",
    commercialBoundary: "Grid professional access may become valuable when you are ready to manage recurring opportunities and availability.",
    intentExamples: ["I want extra work Friday", "Find me weekend healthcare work", "I want to pick up shifts"],
    nodes: [
      { id: "profile", label: "Professional profile", description: "Confirm the professional context Klinikos already knows.", href: "/provider", state: "complete" },
      { id: "credentials", label: "Credential readiness", description: "Review the credentials and requirements that affect eligibility.", href: "/provider-network", capabilityKey: "network.provider.review", state: "current" },
      { id: "availability", label: "Availability", description: "Set when you are open to work.", href: "/grid/availability", capabilityKey: "grid.availability.manage", state: "upcoming" },
      { id: "matches", label: "Grid matches", description: "See opportunities that fit your profile and availability.", href: "/grid/providers", capabilityKey: "grid.match.review", state: "upcoming" },
      { id: "transaction", label: "Work and payment", description: "Track accepted work through completion and transaction state.", href: "/grid/transactions", capabilityKey: "grid.transaction.manage", state: "upcoming" },
    ],
  },
  {
    id: "find-healthcare-resource",
    title: "Find healthcare space, equipment, or capacity",
    summary: "Turn a plain-language resource need into truthful Grid discovery and a governed request path.",
    audience: "professional",
    group: "individual",
    from: "A real need for healthcare space, equipment, services, or capacity",
    to: "A reviewed resource request or eligible match",
    availability: "available_now",
    governance: "Public discovery does not reserve a resource or establish eligibility. Ownership, permitted use, location, availability, professional scope, facility, insurance, payment, and transaction requirements remain server-governed and resource-specific.",
    commercialBoundary: "A request, reservation, payment, or entitlement exists only after the authenticated Grid workflow verifies its required conditions.",
    intentExamples: ["I need a treatment room Saturday", "find healthcare equipment", "I need space for a client", "find available clinical capacity"],
    nodes: [
      { id: "need", label: "Describe the real need", description: "Capture the resource, timing, location, use, and constraints without exposing patient information.", href: "/grid", state: "current" },
      { id: "discover", label: "Review real availability", description: "Use Grid discovery and the map to inspect currently published resource truth.", href: "/grid", state: "current" },
      { id: "eligibility", label: "Check the requirements", description: "Confirm the requester, intended use, resource rules, evidence, and any regulated conditions.", href: "/grid/trust", state: "upcoming" },
      { id: "request", label: "Create a governed request", description: "Ask for the resource without treating discovery, payment, or a browser redirect as a reservation.", href: "/grid/requests", state: "upcoming" },
      { id: "confirm", label: "Confirm only after recheck", description: "Reserve and transact only after availability, eligibility, and required financial conditions are revalidated.", href: "/grid/transactions", state: "upcoming" },
    ],
  },
  {
    id: "become-grid-ready",
    title: "RN to injector readiness",
    summary: "Connect learning, competency, professional readiness, and Grid eligibility in one governed journey.",
    audience: "learner",
    group: "individual",
    from: "Registered nurse exploring aesthetics",
    to: "Ready to pursue eligible injector opportunities",
    availability: "requires_verification",
    governance: "Education and competency evidence do not create legal authority to practice. Scope, supervision, prescribing/delegation rules, facility requirements, credentials, and malpractice coverage remain independently governed.",
    commercialBoundary: "Paid EDU pathways or Grid access should appear only when they unlock a concrete next step the user is eligible to pursue.",
    intentExamples: ["I just graduated nursing school and want to become an injector", "I want to become an injector", "Help me qualify for Grid opportunities", "What do I need to learn next"],
    nodes: [
      { id: "goal", label: "Goal", description: "Define the professional capability you want to build.", href: "/edu", capabilityKey: "edu.learning.open", state: "complete" },
      { id: "learning", label: "Learning pathway", description: "Find the relevant Klinikos EDU courses and scenarios.", href: "/edu/courses", capabilityKey: "edu.learning.open", state: "current" },
      { id: "competency", label: "Competency evidence", description: "Track demonstrated skills and remaining milestones.", href: "/edu/competencies", capabilityKey: "edu.competency.review", state: "upcoming" },
      { id: "readiness", label: "Professional readiness", description: "Review requirements that affect a specific Grid opportunity.", href: "/provider-network", capabilityKey: "network.provider.review", state: "upcoming" },
      { id: "grid", label: "Eligible opportunities", description: "Enter Grid only where the opportunity requirements are satisfied.", href: "/grid/workspace", capabilityKey: "grid.match.review", state: "upcoming" },
    ],
  },
  {
    id: "student-clinical-placement",
    title: "Student to clinical placement",
    summary: "Move from enrolled learning to readiness evidence and a governed placement search.",
    audience: "learner",
    group: "education",
    from: "Student or learner",
    to: "Eligible clinical placement",
    availability: "requires_organization_connection",
    governance: "Placement depends on school/site agreements, program requirements, supervision, onboarding, health/credential requirements, and available approved capacity. Klinikos does not guarantee placement.",
    intentExamples: ["I need a clinical placement", "Find me a preceptor", "I need clinical hours", "help me get placed"],
    nodes: [
      { id: "program", label: "Program context", description: "Confirm the learning program and placement objective.", href: "/edu", state: "complete" },
      { id: "requirements", label: "Placement readiness", description: "Review required competencies and institutional prerequisites.", href: "/edu/competencies", state: "current" },
      { id: "capacity", label: "Placement capacity", description: "Find governed education or preceptor capacity on Grid.", href: "/grid/browse?intent=education", state: "upcoming" },
      { id: "agreement", label: "School and site approval", description: "Confirm the organization relationship and required human approvals.", href: "/network/directory", state: "upcoming" },
      { id: "placement", label: "Placement", description: "Track the approved placement and next learning step.", href: "/edu/dashboard", state: "upcoming" },
    ],
  },
  {
    id: "clinician-independent-practice",
    title: "Clinician to independent practice",
    summary: "Turn professional readiness into a governed path toward operating independently.",
    audience: "professional",
    group: "individual",
    from: "Practicing clinician",
    to: "Independent practice readiness",
    availability: "requires_setup",
    governance: "Entity structure, professional-practice rules, supervision/collaboration, insurance, facility, payer, tax, privacy, prescribing, and state-specific requirements remain the responsibility of the appropriate professionals and organizations.",
    intentExamples: ["I want to work independently", "I want to open my own practice", "help me become independent"],
    nodes: [
      { id: "readiness", label: "Professional readiness", description: "Identify professional requirements relevant to the intended services.", href: "/provider-network", state: "current" },
      { id: "business", label: "Practice setup", description: "Map the organization, location, insurance, and operating requirements that need human confirmation.", href: "/founding-clinic", state: "upcoming" },
      { id: "operations", label: "Operating system", description: "Prepare Clinic OS around the workflows the practice will actually run.", href: "/activate", state: "upcoming" },
      { id: "capacity", label: "Market capacity", description: "Publish only eligible, real capacity or seek appropriate Grid resources.", href: "/grid/workspace", state: "upcoming" },
    ],
  },
  {
    id: "provider-to-clinic-owner",
    title: "Provider to clinic owner",
    summary: "Move from clinical practice into a defined clinic operating and growth path.",
    audience: "professional",
    group: "individual",
    from: "Provider",
    to: "Clinic owner/operator",
    availability: "requires_setup",
    governance: "Ownership and professional-practice structures vary by jurisdiction. Klinikos can organize requirements and operations but does not replace legal, tax, clinical, insurance, or licensing advice.",
    intentExamples: ["I want to own a clinic", "help me become a clinic owner", "I want to start a healthcare business"],
    nodes: [
      { id: "model", label: "Define the care model", description: "Clarify services, people, location, and operational objective.", href: "/founding-clinic", state: "current" },
      { id: "entity", label: "Entity and operating readiness", description: "Track the external professional, business, insurance, and facility setup that must be verified.", href: "/founding-clinic", state: "upcoming" },
      { id: "clinic-os", label: "Activate Clinic OS", description: "Configure the operating workflows around the real clinic.", href: "/activate", state: "upcoming" },
      { id: "network", label: "Connect capacity", description: "Use Grid and Network when the clinic is ready to buy, sell, refer, or share governed capacity.", href: "/grid/workspace", state: "upcoming" },
    ],
  },
  {
    id: "fill-staffing-need",
    title: "Fill an open staffing need",
    summary: "Turn a clinic staffing gap into qualified Grid matches and a confirmed work flow.",
    audience: "clinic",
    group: "clinic",
    from: "Open clinic coverage need",
    to: "Eligible confirmed coverage",
    availability: "available_now",
    governance: "Eligibility, licensure, credentials, malpractice, employment/contract classification, scope and facility rules are checked before a person should be treated as a valid match.",
    commercialBoundary: "Organization Grid access can be offered when the clinic is ready to publish and manage recurring real demand.",
    intentExamples: ["I need an injector Saturday", "Find coverage for Friday", "I need a nurse this weekend"],
    nodes: [
      { id: "need", label: "Define the need", description: "Capture role, timing, location, and requirements.", href: "/grid/requests", capabilityKey: "grid.request.create", state: "current" },
      { id: "matches", label: "Qualified matches", description: "Review professionals and capacity that fit the need.", href: "/grid/providers", capabilityKey: "grid.match.review", state: "upcoming" },
      { id: "availability", label: "Availability", description: "Confirm that the selected match can cover the requested window.", href: "/grid/availability", capabilityKey: "grid.availability.manage", state: "upcoming" },
      { id: "confirm", label: "Confirm", description: "Move the selected match into the current transaction or handoff flow.", href: "/grid/transactions", capabilityKey: "grid.transaction.manage", state: "upcoming" },
    ],
  },
  {
    id: "clinic-monetize-capacity",
    title: "Monetize unused clinic capacity",
    summary: "Identify legitimate idle capacity, make it available, and route it into governed Grid demand.",
    audience: "clinic",
    group: "clinic",
    from: "Unused rooms, hours, services, equipment, or training capacity",
    to: "Published eligible capacity with transaction visibility",
    availability: "available_now",
    governance: "Only legitimate capacity that the organization is permitted to offer should be published. Facility, professional, equipment, insurance, lease, tax, fee-splitting, and other transaction rules remain resource-specific.",
    commercialBoundary: "Organization Grid access becomes valuable when the clinic is ready to publish and transact on real capacity.",
    intentExamples: ["I have an empty room three days a week", "monetize my unused space", "what can my clinic sell", "we have unused capacity"],
    nodes: [
      { id: "inventory", label: "Find idle capacity", description: "Identify the specific real resource and when it is unused.", href: "/grid/resources", state: "current" },
      { id: "readiness", label: "Publication readiness", description: "Confirm ownership, permitted use, availability, terms, and required evidence.", href: "/grid/trust", state: "upcoming" },
      { id: "publish", label: "Publish availability", description: "Make reviewed capacity visible to eligible demand.", href: "/grid/resources", state: "upcoming" },
      { id: "offers", label: "Review offers", description: "Compare real offers and availability before committing.", href: "/grid/resources/offers", state: "upcoming" },
      { id: "transaction", label: "Track the transaction", description: "Keep reservation, fulfillment, payment, obligation, and payout truth distinct.", href: "/grid/transactions", state: "upcoming" },
    ],
  },
  {
    id: "clinic-operational-optimization",
    title: "Improve clinic operations",
    summary: "Turn recurring operational friction into owned work, measurable follow-through, and the right Klinikos operating layer.",
    audience: "clinic",
    group: "clinic",
    from: "Operational friction or leakage",
    to: "Owned, measurable operating workflow",
    availability: "available_now",
    governance: "Klinikos can surface and coordinate operational work; clinical judgment, employment decisions, regulated billing submissions, and external legal/compliance obligations remain with authorized humans and connected systems.",
    commercialBoundary: "A paid operating analysis or implementation can be offered after the clinic has seen the specific workflow problem Klinikos can help resolve.",
    intentExamples: ["our clinic is disorganized", "fix our workflow", "we keep dropping follow ups", "optimize our clinic"],
    nodes: [
      { id: "diagnose", label: "Find the operating gap", description: "Start with the actual queue, workflow, handoff, or leakage causing friction.", href: "/dashboard", state: "current" },
      { id: "ownership", label: "Assign ownership", description: "Route unresolved work to the correct role and queue.", href: "/tasks", state: "upcoming" },
      { id: "measure", label: "Measure the pattern", description: "Use operational evidence to see what repeats and what changes.", href: "/quality", state: "upcoming" },
      { id: "implement", label: "Implement the operating change", description: "Activate the appropriate Clinic OS workflow or implementation path.", href: "/founding-clinic", state: "upcoming" },
    ],
  },
  {
    id: "prepare-procurement-response",
    title: "Prepare a governed procurement response",
    summary: "Organize an RFP, RFQ, or RFI from source requirements through evidence, pricing, approvals, and a human-authorized submission path.",
    audience: "operations",
    group: "organization",
    from: "An external procurement opportunity or buyer requirement set",
    to: "A reviewable response package with explicit evidence and decision ownership",
    availability: "defined",
    governance: "Klinikos may organize requirements, evidence, pricing, risks, approvals, and work. It does not invent compliance, customer, security, integration, pricing, or production claims, and only authorized humans may approve or submit a response.",
    commercialBoundary: "A defined Path is not proof that an automated procurement engine, submission integration, contract, award, or revenue exists.",
    intentExamples: ["prepare our RFP response", "review this RFQ", "build a procurement compliance matrix", "respond to a healthcare solicitation"],
    nodes: [
      { id: "source", label: "Capture source requirements", description: "Keep the authoritative solicitation, amendments, dates, and buyer instructions together.", href: "/dashboard", state: "current" },
      { id: "matrix", label: "Map requirements to evidence", description: "Separate verified evidence, planned capability, exceptions, owners, and unanswered questions.", href: "/tasks", state: "upcoming" },
      { id: "price", label: "Apply governed pricing", description: "Use effective-dated pricing and authorized exceptions rather than browser-owned numbers.", href: "/pricing", state: "upcoming" },
      { id: "approve", label: "Review and approve", description: "Route legal, security, clinical, financial, and executive decisions to accountable humans.", href: "/tasks", state: "upcoming" },
      { id: "submit", label: "Submit through the required channel", description: "Record the authorized final package and external outcome; Klinikos does not claim submission without evidence.", state: "blocked" },
    ],
  },
  {
    id: "clinic-add-service",
    title: "Add a clinic service",
    summary: "Map a new service from operating requirements to staffing, capacity, workflow, and revenue readiness.",
    audience: "clinic",
    group: "clinic",
    from: "Existing clinic",
    to: "Operationally ready new service",
    availability: "requires_setup",
    governance: "A service should not be treated as launch-ready until professional scope, facility, equipment, insurance, consent, documentation, pricing, billing and other applicable requirements are confirmed.",
    intentExamples: ["I want to add a service", "add a new treatment", "expand what my clinic offers"],
    nodes: [
      { id: "service", label: "Define the service", description: "Clarify the service, patient/customer, professional, location, and operating model.", href: "/founding-clinic", state: "current" },
      { id: "requirements", label: "Requirements", description: "Identify what must be present or verified before launch.", href: "/integrations", state: "upcoming" },
      { id: "capacity", label: "People and capacity", description: "Find or publish the professionals, space, equipment, or services needed.", href: "/grid/workspace", state: "upcoming" },
      { id: "workflow", label: "Clinic workflow", description: "Configure scheduling, intake, care, follow-up, payment and reporting around the service.", href: "/dashboard", state: "upcoming" },
    ],
  },
  {
    id: "clinic-improve-revenue",
    title: "Improve clinic revenue flow",
    summary: "Find where revenue is delayed or lost, then route each blocker to the right operational or billing action.",
    audience: "operations",
    group: "clinic",
    from: "Delayed or lost revenue",
    to: "Owned revenue recovery path",
    availability: "available_now",
    governance: "Financial insight does not replace coding, payer, accounting, legal, clinical documentation, or processor evidence requirements. Submission and settlement remain externally governed where applicable.",
    commercialBoundary: "Deeper revenue workflow, implementation, or higher Clinic OS tiers can be offered where the measured leakage justifies them.",
    intentExamples: ["why are we losing money", "improve revenue", "show unpaid balances", "revenue leakage"],
    nodes: [
      { id: "signals", label: "Find delayed revenue", description: "See where money is waiting and why.", href: "/billing", state: "current" },
      { id: "readiness", label: "Resolve missing requirements", description: "Fix claim, eligibility, documentation, payment, or follow-up blockers through the appropriate queue.", href: "/claim-readiness", state: "upcoming" },
      { id: "recovery", label: "Recover opportunities", description: "Own follow-up and revenue-recovery work instead of leaving it implicit.", href: "/crm", state: "upcoming" },
      { id: "measure", label: "Measure the change", description: "Review the pattern after the operating intervention.", href: "/quality", state: "upcoming" },
    ],
  },
  {
    id: "clinic-expand-locations",
    title: "Expand to another location",
    summary: "Move from one operating clinic into a governed multi-location setup without duplicating disconnected workflows.",
    audience: "clinic",
    group: "clinic",
    from: "Operating clinic",
    to: "Additional location in the same governed operating system",
    availability: "requires_setup",
    governance: "Each location may have independent facility, payer, professional, insurance, storage, privacy, tax, permit, and operational requirements. Existing configuration is not automatic proof of readiness elsewhere.",
    commercialBoundary: "Multi-location Clinic OS and implementation pricing should appear after the second-location scope is understood.",
    intentExamples: ["open a second location", "expand locations", "add another clinic", "multi location"],
    nodes: [
      { id: "scope", label: "Location scope", description: "Define what will be shared and what is location-specific.", href: "/founding-clinic", state: "current" },
      { id: "readiness", label: "Location readiness", description: "Track facility, professional, payer, insurance and operational prerequisites.", href: "/integrations", state: "upcoming" },
      { id: "configure", label: "Configure Clinic OS", description: "Add the location to the governed operating context.", href: "/settings", state: "upcoming" },
      { id: "network", label: "Connect local capacity", description: "Use Grid and Network for real local demand, supply and partnerships.", href: "/grid/workspace", state: "upcoming" },
    ],
  },
  {
    id: "fix-referral-leakage",
    title: "Fix referral leakage",
    summary: "Find broken referral loops, assign ownership, follow patients, and close the care gap.",
    audience: "operations",
    group: "clinic",
    from: "Open or stuck referral loops",
    to: "Owned, closed referral follow-through",
    availability: "available_now",
    governance: "Care coordination can organize administrative follow-through but does not replace clinical judgment, patient choice, consent, record-release requirements, or destination eligibility.",
    intentExamples: ["We're losing patients after referrals", "Show me stuck referrals", "Find referral gaps"],
    nodes: [
      { id: "diagnose", label: "Find open loops", description: "Review referral activity that still needs closure.", href: "/referrals", capabilityKey: "care.referral.manage", state: "current" },
      { id: "ownership", label: "Assign ownership", description: "Move unresolved work into a clear owner queue.", href: "/tasks", capabilityKey: "work.task.manage", state: "upcoming" },
      { id: "followup", label: "Patient follow-up", description: "Coordinate outreach and next actions.", href: "/patient-navigation", capabilityKey: "care.patient.navigate", state: "upcoming" },
      { id: "network", label: "Network resolution", description: "Use the care network when capacity or destination is the blocker.", href: "/network", capabilityKey: "network.provider.review", state: "upcoming" },
      { id: "closure", label: "Close the loop", description: "Return to referral state and confirm the care loop is resolved.", href: "/referrals", capabilityKey: "care.referral.manage", state: "upcoming" },
    ],
  },
  {
    id: "organization-education-partner",
    title: "Organization to education partner",
    summary: "Define real learning capacity and prepare it for governed institutional participation.",
    audience: "clinic",
    group: "organization",
    from: "Healthcare organization with learning capacity",
    to: "Education partner readiness",
    availability: "requires_organization_connection",
    governance: "Institutional agreements, supervision, faculty/preceptor qualifications, learner privacy, site rules and program approval remain required. Klinikos does not unilaterally designate an approved clinical site.",
    intentExamples: ["we want students", "become an education partner", "offer clinical placements", "host trainees"],
    nodes: [
      { id: "capacity", label: "Define learning capacity", description: "Describe the real placement, preceptor, simulation, or training capacity available.", href: "/grid/resources", state: "current" },
      { id: "readiness", label: "Institutional readiness", description: "Identify agreements, role, supervision and evidence required.", href: "/edu", state: "upcoming" },
      { id: "publish", label: "Publish governed capacity", description: "Make approved education capacity discoverable to the right participants.", href: "/grid/browse?intent=education", state: "upcoming" },
    ],
  },
  {
    id: "school-placement-network",
    title: "School to placement network",
    summary: "Connect institutional learner demand with governed clinical and training capacity.",
    audience: "learner",
    group: "education",
    from: "Education institution or program",
    to: "Governed placement network",
    availability: "requires_organization_connection",
    governance: "Institutional identity, agreements, program rules, learner requirements, site approval, supervision and privacy obligations must be established before placement activity can be treated as operational.",
    intentExamples: ["our school needs placements", "find sites for our students", "build a placement network"],
    nodes: [
      { id: "program", label: "Program demand", description: "Define cohorts, timing, competencies and placement requirements.", href: "/edu/cohorts", state: "current" },
      { id: "partners", label: "Partner capacity", description: "Find participating organizations and governed education capacity.", href: "/grid/browse?intent=education", state: "upcoming" },
      { id: "agreements", label: "Institutional agreements", description: "Track the human and institutional approvals required before assignment.", href: "/network/directory", state: "upcoming" },
      { id: "cohort", label: "Placement operations", description: "Coordinate approved learners and placements through the EDU context.", href: "/edu/cohorts", state: "upcoming" },
    ],
  },
  {
    id: "educator-preceptor-opportunity",
    title: "Educator to preceptor opportunity",
    summary: "Turn appropriate teaching capacity into a governed education opportunity.",
    audience: "professional",
    group: "education",
    from: "Qualified clinician or educator",
    to: "Eligible preceptor or teaching opportunity",
    availability: "requires_verification",
    governance: "Preceptor eligibility depends on program, institution, profession, site, supervision and other requirements. A professional profile alone is not approval to supervise learners.",
    intentExamples: ["I want to be a preceptor", "I can teach students", "find teaching opportunities"],
    nodes: [
      { id: "profile", label: "Teaching profile", description: "Define profession, experience, setting, capacity, and teaching objective.", href: "/provider-network", state: "current" },
      { id: "requirements", label: "Program requirements", description: "Review institution-specific qualifications and agreements.", href: "/edu", state: "upcoming" },
      { id: "availability", label: "Teaching availability", description: "Publish approved education capacity and timing.", href: "/grid/resources", state: "upcoming" },
      { id: "match", label: "Eligible opportunity", description: "Review matching education demand where requirements are satisfied.", href: "/grid/browse?intent=education", state: "upcoming" },
    ],
  },
  {
    id: "grid-higher-value-opportunity",
    title: "Move into higher-value Grid opportunities",
    summary: "Use verified readiness, experience, availability and evidence to discover more appropriate opportunity classes.",
    audience: "professional",
    group: "individual",
    from: "Existing Grid participant",
    to: "Higher-value eligible opportunities",
    availability: "requires_verification",
    governance: "Reputation and experience can inform ranking but never override hard eligibility, credential, scope, insurance, facility, organization, or transaction requirements.",
    commercialBoundary: "A paid professional tier should unlock real workflow value such as recurring availability and opportunity management, not hide basic eligibility truth.",
    intentExamples: ["find better opportunities", "higher paying work", "advance on Grid", "grow my Grid career"],
    nodes: [
      { id: "evidence", label: "Readiness and evidence", description: "Review what is verified and what remains missing for the opportunity class you want.", href: "/provider-network", state: "current" },
      { id: "availability", label: "Availability", description: "Keep current availability and geography truthful.", href: "/grid/availability", state: "upcoming" },
      { id: "matches", label: "Eligible matches", description: "Compare opportunities only after hard eligibility is satisfied.", href: "/grid/opportunities", state: "upcoming" },
      { id: "transactions", label: "Transaction history", description: "Track accepted work, fulfillment and financial truth.", href: "/grid/transactions", state: "upcoming" },
    ],
  },
  {
    id: "patient-find-care",
    title: "Find the right care entry point",
    summary: "Help a person describe what they need and reach an appropriate available care entry without exposing marketplace operator mechanics.",
    audience: "patient",
    group: "individual",
    from: "Person looking for care or a service",
    to: "Appropriate care or service entry point",
    availability: "defined",
    governance: "Klinikos may guide administrative discovery but does not diagnose, guarantee availability, replace emergency services, or override patient choice, clinical triage, eligibility, privacy, or provider/facility rules.",
    intentExamples: ["I need a service", "find me a clinic", "I need an appointment", "where should I go for care"],
    nodes: [
      { id: "need", label: "Describe what you need", description: "Start in plain language without requiring marketplace terminology.", href: "/portal", state: "current" },
      { id: "destination", label: "Appropriate entry", description: "Guide toward an available clinic/service path when the required information exists.", href: "/grid/workspace", state: "upcoming" },
      { id: "next", label: "Next step", description: "Move into the patient-safe appointment, intake, or contact experience offered by the destination.", href: "/portal", state: "upcoming" },
    ],
  },
  {
    id: "launch-another-organization",
    title: "Launch another organization",
    summary: "Define a new organization context without copying assumptions or leaking data from an existing tenant.",
    audience: "clinic",
    group: "organization",
    from: "Existing operator/founder",
    to: "Separate governed organization context",
    availability: "requires_setup",
    governance: "A new organization requires its own verified entity, roles, permissions, operational configuration, financial relationships, vendor context and data boundaries. Existing tenant access never transfers automatically.",
    intentExamples: ["launch another organization", "start another clinic", "create a new healthcare company"],
    nodes: [
      { id: "scope", label: "Define the new organization", description: "Clarify the organization, purpose, people, locations and services.", href: "/founding-clinic", state: "current" },
      { id: "boundary", label: "Identity and access boundary", description: "Create a distinct governed organization and role context.", href: "/settings", state: "upcoming" },
      { id: "operations", label: "Operating setup", description: "Configure the workflows and connections appropriate to the new organization.", href: "/activate", state: "upcoming" },
    ],
  },
];

export function getKlinikosPath(pathId: string) {
  return klinikosPathCatalog.find((path) => path.id === pathId);
}

export function findKlinikosPathFromIntent(input: string) {
  const result = resolveIntentDeterministically(input);
  const pathId = result.candidatePathIds[0];
  return pathId ? getKlinikosPath(pathId) ?? null : null;
}
