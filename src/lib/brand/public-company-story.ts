export const publicCompanyStory = {
  mission: {
    eyebrow: "Our mission",
    headline: "Make healthcare work visible, connected, owned, and finishable.",
    statement:
      "Klinikos exists to close the operational gaps that appear between the systems healthcare organizations already use. We are building the operating layer that gives follow-up, referrals, results, tasks, resources, handoffs, and revenue opportunities a visible state, a responsible owner, and a clear next action.",
  },
  why: [
    "Healthcare organizations do not fail because they lack software. They lose continuity when work crosses between systems, people, locations, and organizations without a reliable owner or state.",
    "Klinikos is being built from the operator's point of view: make invisible work visible, make responsibility explicit, preserve human authority where the stakes are high, and never manufacture certainty the system does not actually have.",
  ],
  ecosystem: [
    {
      name: "Klinikos",
      role: "Operating layer",
      description: "Connects operational state across clinic workflows so teams can see what is open, blocked, owned, and complete.",
    },
    {
      name: "Zumi",
      role: "Operating intelligence",
      description: "Observes, organizes, maps, and surfaces operational signals while preserving human review and authorization boundaries.",
    },
    {
      name: "Grid",
      role: "Healthcare exchange",
      description: "Connects legitimate demand with reviewed people, space, equipment, services, education, organizations, and other healthcare capacity through policy-aware transactions.",
    },
    {
      name: "Klinikos EDU",
      role: "Learning environment",
      description: "Uses synthetic training environments to help learners practice healthcare operations and clinical-support workflows without exposing production patient data.",
    },
  ],
  founder: {
    label: "Leadership approach",
    headline: "Operator-led product development with security and systems discipline.",
    paragraphs: [
      "Klinikos is founder-led and shaped by hands-on exposure to outpatient healthcare operations, staffing, follow-up, customer flow, revenue continuity, software engineering, and security-focused technical study.",
      "Public company materials focus on the product, operating model, and evidence rather than turning the company into a personality brand. Qualified commercial diligence should verify the leadership team, contracting party, insurance, security posture, and applicable professional relationships before a production agreement is executed.",
      "The operating philosophy is simple: understand the real workflow before designing the software, make consequential actions attributable, keep clinical and regulated decisions under the right human authority, and build economic systems that can explain where every dollar and every responsibility goes.",
    ],
  },
  accolades: [
    {
      title: "Healthcare operations exposure",
      detail: "Hands-on experience with outpatient clinic and medical-aesthetics operations, customer flow, staffing, follow-up, and revenue continuity informs the product model.",
    },
    {
      title: "Security-focused technical training",
      detail: "Formal computer security and technology study informs the product's emphasis on tenant boundaries, auditability, least privilege, and fail-closed controls.",
    },
    {
      title: "Systems and workflow building",
      detail: "Software, automation, backend, workflow, and systems-oriented projects are developed around real operating problems rather than isolated feature demonstrations.",
    },
    {
      title: "Cross-functional operating discipline",
      detail: "Product, engineering, operations, commercialization, UX, and systems architecture are treated as one operating problem with explicit handoffs and ownership.",
    },
  ],
  principles: [
    {
      title: "Continuity over feature count",
      description: "A product is useful when work reliably reaches the next responsible person, not when the menu contains the most modules.",
    },
    {
      title: "Truth over theater",
      description: "Demo, manual fallback, pending connection, and production-ready states must remain visibly different.",
    },
    {
      title: "Human authority where it matters",
      description: "Clinical, legal, credentialing, regulatory, and other consequential decisions stay under the appropriate human review and authorization.",
    },
    {
      title: "One system, many roles",
      description: "Providers, staff, organizations, sellers, students, partners, and buyers should each see the experience relevant to them while the underlying state remains connected.",
    },
    {
      title: "Economics must reconcile",
      description: "Fees, obligations, payments, payouts, and fulfillment states should be explicit and auditable rather than implied.",
    },
    {
      title: "Build for the widest legitimate use",
      description: "Design the core architecture broadly enough to support new healthcare resources, workflows, and roles without weakening class-specific policy boundaries.",
    },
  ],
  publicBoundaries: [
    "Klinikos does not claim that a synthetic demonstration is production deployment.",
    "Klinikos does not represent manual payment evidence as processor verification.",
    "Klinikos does not bypass professional licensure, credential, regulatory, or organization-specific authorization requirements.",
    "Klinikos does not expose production patient information in its public demonstrations.",
    "Klinikos does not make autonomous clinical decisions on behalf of licensed professionals.",
  ],
} as const;
