export type CompanyTruthClass = "CURRENT_FACT" | "PROPOSED" | "EXECUTED";

export type CapitalOpportunityType =
  | "accelerator_equity"
  | "non_dilutive_rnd"
  | "state_equity_match";

export type CapitalOpportunityPriority = "A1" | "A2" | "B" | "C";

export type CapitalOpportunitySeed = {
  recordId: string;
  title: string;
  provider: string;
  capitalType: CapitalOpportunityType;
  priority: CapitalOpportunityPriority;
  truthClass: CompanyTruthClass;
  amountRange: string;
  eligibilitySummary: string;
  useRestrictions: string;
  dilution: string;
  repayment: string;
  guaranteeCollateral: string;
  applicationRequirements: readonly string[];
  decisionTimeline: string;
  fundingTimeline: string;
  sourceUrl: string;
  sourceDate: "2026-08-25";
  reviewDate: string;
  reverifyBeforeAction: true;
  status: "research_ready" | "fit_review" | "match_required";
  nextAction: string;
};

export type LenderPriority = "A" | "B" | "C";

export type LenderReadinessSeed = {
  recordId: string;
  lenderProduct: string;
  provider: string;
  priority: LenderPriority;
  truthClass: CompanyTruthClass;
  requestedAmount: null;
  useOfFunds: string;
  entity: "Klinikos, Inc. — final application facts require corporate-evidence reconciliation";
  revenueRequirement: string;
  timeInBusinessRequirement: string;
  creditRequirement: string;
  guarantorRequirement: string;
  collateral: string;
  financialDocuments: readonly string[];
  qualificationGaps: readonly string[];
  debtServiceAnalysis: "not_yet_completed";
  applicationState: "not_applied";
  hardInquiryAuthorized: false;
  decision: "none";
  status: "relationship_research" | "do_not_apply_yet";
  sourceUrl: string;
  sourceDate: "2026-08-25";
  reviewDate: string;
  reverifyBeforeApplication: true;
  nextAction: string;
};

export const capitalOpportunitySeedRegistry: readonly CapitalOpportunitySeed[] = [
  {
    recordId: "techstars-ai-health-baltimore-2026",
    title: "Techstars AI Health Baltimore 2027 cohort",
    provider: "Techstars",
    capitalType: "accelerator_equity",
    priority: "A1",
    truthClass: "CURRENT_FACT",
    amountRange: "$220,000 standard Techstars investment",
    eligibilitySummary:
      "Early-stage AI/health companies with strong healthcare workflow, economics, outcomes, and commercialization fit; final eligibility remains program-controlled.",
    useRestrictions: "Accelerator investment under Techstars program and investment terms; not a grant.",
    dilution:
      "Techstars standard investment terms apply; reverify exact CEA/SAFE terms before any application or acceptance.",
    repayment: "equity/SAFE economics rather than scheduled loan repayment",
    guaranteeCollateral: "none disclosed as a loan guarantee because this is an accelerator equity investment",
    applicationRequirements: [
      "focused healthcare problem and customer",
      "team/founder narrative",
      "product evidence",
      "commercialization/traction path",
      "current corporate and cap-table facts",
    ],
    decisionTimeline: "applications close 2026-11-18; selection timeline controlled by Techstars",
    fundingTimeline: "2027 accelerator cycle if selected and accepted",
    sourceUrl: "https://www.techstars.com/accelerators/baltimore-ai-health",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-08",
    reverifyBeforeAction: true,
    status: "research_ready",
    nextAction:
      "Prepare a focused application around governed healthcare operations, clinician/nursing efficiency, and measurable workflow value; do not lead with the entire ecosystem.",
  },
  {
    recordId: "techstars-northwestern-healthcare-2026",
    title: "Northwestern Medicine & Techstars Healthcare Accelerator 2027 cohort",
    provider: "Northwestern Medicine + Techstars",
    capitalType: "accelerator_equity",
    priority: "A1",
    truthClass: "CURRENT_FACT",
    amountRange: "$220,000 standard Techstars investment, subject to current program terms",
    eligibilitySummary:
      "Healthcare startups aligned with patient experience, physician/nursing efficiency, AI, cybersecurity, or healthcare operations; final selection remains program-controlled.",
    useRestrictions: "Accelerator investment under Techstars program and investment terms; not a grant.",
    dilution:
      "Techstars standard investment terms apply; reverify exact CEA/SAFE terms before any application or acceptance.",
    repayment: "equity/SAFE economics rather than scheduled loan repayment",
    guaranteeCollateral: "none disclosed as a loan guarantee because this is an accelerator equity investment",
    applicationRequirements: [
      "focused healthcare workflow problem",
      "team/founder narrative",
      "product evidence",
      "clinical/operator validation",
      "commercialization path",
      "current corporate and cap-table facts",
    ],
    decisionTimeline: "applications close 2026-11-18; selection timeline controlled by the program",
    fundingTimeline: "2027 accelerator cycle if selected and accepted",
    sourceUrl: "https://www.techstars.com/accelerators/northwestern-medicine-healthcare",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-08",
    reverifyBeforeAction: true,
    status: "research_ready",
    nextAction:
      "Prepare the clinical-efficiency application wedge around Current Visit, Staff Handoff, Clinical Change, and governed intelligence with explicit human-authority boundaries.",
  },
  {
    recordId: "techstars-nyc-2026",
    title: "Techstars New York City 2027 cohort",
    provider: "Techstars",
    capitalType: "accelerator_equity",
    priority: "A2",
    truthClass: "CURRENT_FACT",
    amountRange: "$220,000 standard Techstars investment",
    eligibilitySummary:
      "High-growth startups with strong customer understanding, execution speed, and very large market potential; final selection remains program-controlled.",
    useRestrictions: "Accelerator investment under current Techstars investment terms; not a grant.",
    dilution:
      "$20,000 for 5% common equity through a Post-Money CEA plus $200,000 through an uncapped MFN SAFE under current published standard terms",
    repayment: "equity/SAFE economics rather than scheduled loan repayment",
    guaranteeCollateral: "none disclosed as a loan guarantee because this is an accelerator equity investment",
    applicationRequirements: [
      "large-market thesis",
      "customer/problem evidence",
      "team/founder narrative",
      "product evidence",
      "current corporate and cap-table facts",
    ],
    decisionTimeline: "applications close 2026-11-18; selection timeline controlled by Techstars",
    fundingTimeline: "2027 accelerator cycle if selected and accepted",
    sourceUrl: "https://www.techstars.com/accelerators/nyc",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-08",
    reverifyBeforeAction: true,
    status: "fit_review",
    nextAction:
      "Compare the strategic value and dilution against the two health-specific Techstars programs before spending founder time on a third application.",
  },
  {
    recordId: "nsf-sbir-sttr-2026",
    title: "NSF SBIR/STTR Phase I",
    provider: "U.S. National Science Foundation",
    capitalType: "non_dilutive_rnd",
    priority: "A1",
    truthClass: "CURRENT_FACT",
    amountRange: "up to $305,000 for Phase I under the current solicitation",
    eligibilitySummary:
      "Eligible U.S. small businesses proposing genuine high-risk technical R&D and commercialization; exact solicitation requirements control.",
    useRestrictions: "award funds must support the approved R&D work and allowed award costs",
    dilution: "none",
    repayment: "none, subject to award compliance and allowed costs",
    guaranteeCollateral: "none",
    applicationRequirements: [
      "genuine technical innovation and uncertainty",
      "R&D work plan and measurable milestones",
      "commercial opportunity",
      "company/team eligibility",
      "budget and allowed-cost compliance",
    ],
    decisionTimeline: "next full proposal deadline currently 2026-11-04 at 5 PM applicant local time",
    fundingTimeline: "award timeline controlled by NSF review and award process",
    sourceUrl:
      "https://www.nsf.gov/funding/opportunities/small-business-innovation-research-small-business-technology/nsf26-510/solicitation",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-01",
    reverifyBeforeAction: true,
    status: "research_ready",
    nextAction:
      "Select one defensible technical hypothesis and build the November 4 workback around experiments and measurable technical uncertainty, not generic Klinikos completion.",
  },
  {
    recordId: "nih-sbir-sttr-2026",
    title: "NIH SBIR/STTR current parent opportunity cycle",
    provider: "U.S. National Institutes of Health",
    capitalType: "non_dilutive_rnd",
    priority: "B",
    truthClass: "CURRENT_FACT",
    amountRange: "award amount depends on the exact NIH NOFO and Institute/Center",
    eligibilitySummary:
      "Eligible U.S. small business concerns with biomedical or public-health R&D aligned to an applicable NIH Institute/Center and NOFO.",
    useRestrictions: "award funds must support approved NIH R&D and allowed award costs",
    dilution: "none",
    repayment: "none, subject to award compliance and allowed costs",
    guaranteeCollateral: "none",
    applicationRequirements: [
      "exact NOFO eligibility",
      "Institute/Center programmatic fit",
      "specific aims/R&D plan",
      "team and small-business eligibility",
      "budget and registrations",
    ],
    decisionTimeline:
      "NIH's current 2026 guidance identifies 2026-09-08 for the upcoming small-business cycle; exact NOFO and calendar rules must be rechecked",
    fundingTimeline: "controlled by NIH peer review, council, and award timing",
    sourceUrl:
      "https://grants.nih.gov/news-events/nih-extramural-nexus-news/2026/06/nih-small-business-program-funding-opportunities-now-available-applicant-support-webinar-on-june-9",
    sourceDate: "2026-08-25",
    reviewDate: "2026-08-27",
    reverifyBeforeAction: true,
    status: "fit_review",
    nextAction:
      "Identify the most relevant NIH Institute/Center and NOFO, then seek programmatic-fit guidance before deciding whether the near-term cycle is rational.",
  },
  {
    recordId: "ny-ventures-preseed-seed-2026",
    title: "NY Ventures Pre-Seed and Seed Matching Fund Program",
    provider: "Empire State Development / NY Ventures",
    capitalType: "state_equity_match",
    priority: "A2",
    truthClass: "CURRENT_FACT",
    amountRange: "generally $50,000 to $250,000 under current state materials",
    eligibilitySummary:
      "Early-stage high-growth New York companies, subject to program eligibility and a qualifying private investment match.",
    useRestrictions: "equity investment subject to program terms and approved company use",
    dilution: "state equity investment; exact security and terms require transaction-specific review",
    repayment: "equity economics rather than scheduled loan repayment",
    guaranteeCollateral: "not structured as conventional secured debt",
    applicationRequirements: [
      "New York eligibility",
      "high-growth company case",
      "current cap table",
      "private investment match of at least 1:1 under current program rules",
      "company and investor diligence",
    ],
    decisionTimeline: "rolling application; no fixed deadline currently published",
    fundingTimeline: "controlled by NY Ventures diligence and transaction process",
    sourceUrl: "https://esd.ny.gov/pre-seed-seed-matching-fund-program-faq",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-15",
    reverifyBeforeAction: true,
    status: "match_required",
    nextAction:
      "Keep the application materials current, but do not represent a private match or intended Klinikos ownership as executed until both are supported by current evidence.",
  },
] as const;

export const lenderReadinessSeedRegistry: readonly LenderReadinessSeed[] = [
  {
    recordId: "pursuit-main-street-capital",
    lenderProduct: "Main Street Capital Loan Fund",
    provider: "Pursuit",
    priority: "A",
    truthClass: "CURRENT_FACT",
    requestedAmount: null,
    useOfFunds:
      "Potential startup working capital for production hardening, customer acquisition, implementation capacity, security/risk, and other lender-approved uses.",
    entity: "Klinikos, Inc. — final application facts require corporate-evidence reconciliation",
    revenueRequirement:
      "Startup product can consider new businesses; businesses two to four years old must show sufficient cash flow for debt payments under current published criteria.",
    timeInBusinessRequirement: "New York startups and early-stage businesses up to four years old are within current program scope.",
    creditRequirement:
      "Current published criteria state an average personal credit score of 640+ for owners with 20% or more ownership, plus no open liens/judgments and no bankruptcy in the prior seven years.",
    guarantorRequirement: "Owner/guarantor terms must be confirmed directly before application.",
    collateral: "Confirm directly; current startup eligibility also expects an active commercial lease, identified location, or satisfactory proof of operation outside the home.",
    financialDocuments: [
      "corporate and EIN evidence",
      "ownership/cap-table evidence",
      "business plan and projections",
      "bank/accounting evidence requested by lender",
      "owner financial/credit information",
    ],
    qualificationGaps: [
      "reconcile executed Klinikos ownership",
      "review founder credit privately",
      "confirm qualifying business-location evidence",
      "complete debt-service analysis",
      "confirm hard-inquiry and guaranty terms before application",
    ],
    debtServiceAnalysis: "not_yet_completed",
    applicationState: "not_applied",
    hardInquiryAuthorized: false,
    decision: "none",
    status: "relationship_research",
    sourceUrl: "https://pursuitlending.com/business-loans/products/main-street-capital-loan-fund/",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-01",
    reverifyBeforeApplication: true,
    nextAction:
      "Request a non-binding startup-underwriting conversation and confirm owner-credit, guaranty, location, documentation, and inquiry policy before authorizing an application.",
  },
  {
    recordId: "renaissance-nyc-elevating",
    lenderProduct: "NYC Elevating Business Loan Program",
    provider: "Renaissance Economic Development Corporation",
    priority: "A",
    truthClass: "CURRENT_FACT",
    requestedAmount: null,
    useOfFunds: "Potential startup/working-capital financing for lender-approved commercial uses.",
    entity: "Klinikos, Inc. — final application facts require corporate-evidence reconciliation",
    revenueRequirement: "Current published page accepts startup businesses; exact repayment underwriting must be confirmed directly.",
    timeInBusinessRequirement: "Current published page accepts existing and startup NYC businesses.",
    creditRequirement: "Not fully disclosed on the public program page; confirm directly before application.",
    guarantorRequirement: "Confirm directly before application.",
    collateral: "Confirm directly before application.",
    financialDocuments: [
      "corporate and EIN evidence",
      "ownership/cap-table evidence",
      "business plan/projections",
      "bank/accounting evidence requested by lender",
      "owner financial information when required",
    ],
    qualificationGaps: [
      "reconcile executed Klinikos ownership",
      "review founder credit privately",
      "complete debt-service analysis",
      "confirm documentation, guaranty, and inquiry policy",
    ],
    debtServiceAnalysis: "not_yet_completed",
    applicationState: "not_applied",
    hardInquiryAuthorized: false,
    decision: "none",
    status: "relationship_research",
    sourceUrl: "https://www.renaissancesbs.org/loan-program/nyc-elevating-business-loan-program",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-01",
    reverifyBeforeApplication: true,
    nextAction:
      "Request a non-binding consultation on the startup underwriting box, including credit, guaranty, documentation, repayment, and credit-inquiry behavior.",
  },
  {
    recordId: "renaissance-community-advantage",
    lenderProduct: "SBA Community Advantage",
    provider: "Renaissance Economic Development Corporation",
    priority: "B",
    truthClass: "CURRENT_FACT",
    requestedAmount: null,
    useOfFunds: "Potential larger startup financing for SBA/lender-approved business uses.",
    entity: "Klinikos, Inc. — final application facts require corporate-evidence reconciliation",
    revenueRequirement: "Current published page explicitly describes pre-revenue startups as potentially eligible.",
    timeInBusinessRequirement: "Pre-revenue startups and existing businesses are described as eligible subject to underwriting/SBA requirements.",
    creditRequirement: "Confirm lender/SBA underwriting requirements before application.",
    guarantorRequirement: "SBA/lender owner guaranty requirements must be confirmed for the actual ownership structure.",
    collateral: "SBA/lender collateral requirements depend on the final request and policy; do not infer unsecured status.",
    financialDocuments: [
      "corporate and EIN evidence",
      "executed ownership/cap table",
      "business plan and projections",
      "repayment analysis",
      "SBA/lender forms and owner financial information",
    ],
    qualificationGaps: [
      "reconcile executed Klinikos ownership",
      "complete repayment analysis",
      "review founder credit privately",
      "confirm SBA/lender guaranty and inquiry requirements",
    ],
    debtServiceAnalysis: "not_yet_completed",
    applicationState: "not_applied",
    hardInquiryAuthorized: false,
    decision: "none",
    status: "relationship_research",
    sourceUrl: "https://www.renaissancesbs.org/loan-capital-new-york-city",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-15",
    reverifyBeforeApplication: true,
    nextAction:
      "Keep as a larger-capital pathway and discuss only after the lender package and downside debt-service case are complete.",
  },
  {
    recordId: "accompany-community-advantage",
    lenderProduct: "SBA Community Advantage",
    provider: "Accompany Capital",
    priority: "B",
    truthClass: "CURRENT_FACT",
    requestedAmount: null,
    useOfFunds: "Potential larger startup financing for SBA/lender-approved business uses.",
    entity: "Klinikos, Inc. — final application facts require corporate-evidence reconciliation",
    revenueRequirement: "Current published materials accept startups subject to SBA and lender underwriting.",
    timeInBusinessRequirement: "NYC startups and existing businesses are currently described as eligible subject to SBA rules.",
    creditRequirement: "Confirm directly before application.",
    guarantorRequirement: "Confirm SBA/lender owner guaranty requirements for the actual ownership structure.",
    collateral: "Confirm directly; do not infer unsecured status from program availability.",
    financialDocuments: [
      "corporate and EIN evidence",
      "executed ownership/cap table",
      "business plan and projections",
      "repayment analysis",
      "SBA/lender forms and owner financial information",
    ],
    qualificationGaps: [
      "reconcile executed Klinikos ownership",
      "complete repayment analysis",
      "review founder credit privately",
      "confirm guaranty/collateral/inquiry requirements",
    ],
    debtServiceAnalysis: "not_yet_completed",
    applicationState: "not_applied",
    hardInquiryAuthorized: false,
    decision: "none",
    status: "relationship_research",
    sourceUrl: "https://accompanycapital.org/loans/",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-15",
    reverifyBeforeApplication: true,
    nextAction:
      "Use a non-binding lender conversation to compare the larger Community Advantage path against lower-request startup programs after the repayment model is complete.",
  },
  {
    recordId: "nys-sbrlf2",
    lenderProduct: "NYS Small Business Revolving Loan Fund Round 2 participant-lender pathway",
    provider: "Empire State Development / participating community lenders",
    priority: "A",
    truthClass: "CURRENT_FACT",
    requestedAmount: null,
    useOfFunds: "Potential participating-lender financing for eligible business uses, subject to the selected lender's underwriting.",
    entity: "Klinikos, Inc. — final application facts require corporate-evidence reconciliation",
    revenueRequirement: "Varies by participating Community Based Lending Organization.",
    timeInBusinessRequirement: "Program is designed in part to address financing gaps for new companies; lender-specific requirements still control.",
    creditRequirement: "Varies by participating lender; must be confirmed before application.",
    guarantorRequirement: "Varies by participating lender.",
    collateral: "Varies by participating lender.",
    financialDocuments: [
      "selected lender's checklist",
      "corporate/EIN/ownership evidence",
      "financial and projection package",
      "owner financial information when required",
    ],
    qualificationGaps: [
      "select the best-fit participating lender rather than duplicate applications",
      "reconcile ownership and financial package",
      "review founder credit privately",
      "complete debt-service analysis",
    ],
    debtServiceAnalysis: "not_yet_completed",
    applicationState: "not_applied",
    hardInquiryAuthorized: false,
    decision: "none",
    status: "relationship_research",
    sourceUrl: "https://www.esd.ny.gov/nys-small-business-revolving-loan-fund-round-2",
    sourceDate: "2026-08-25",
    reviewDate: "2026-09-01",
    reverifyBeforeApplication: true,
    nextAction:
      "Use the state program to identify and compare participating lenders, then choose one underwriting path rather than applying across the network simultaneously.",
  },
  {
    recordId: "ny-forward-loan-fund-ii",
    lenderProduct: "New York Forward Loan Fund II",
    provider: "New York State / participating lenders",
    priority: "C",
    truthClass: "CURRENT_FACT",
    requestedAmount: null,
    useOfFunds: "Future working-capital pathway if eligibility changes or the company reaches the published operating-history requirement.",
    entity: "Klinikos, Inc. — final application facts require corporate-evidence reconciliation",
    revenueRequirement: "Current program materials require demonstrated repayment capacity from historical or projected cash flow.",
    timeInBusinessRequirement: "Current published materials require at least one year in business.",
    creditRequirement: "Participating lender underwriting applies.",
    guarantorRequirement: "Participating lender requirements apply.",
    collateral: "Participating lender requirements apply.",
    financialDocuments: ["future lender checklist", "business financials", "repayment evidence"],
    qualificationGaps: [
      "current time in business is below the published one year requirement",
      "build operating and repayment history before reconsidering",
    ],
    debtServiceAnalysis: "not_yet_completed",
    applicationState: "not_applied",
    hardInquiryAuthorized: false,
    decision: "none",
    status: "do_not_apply_yet",
    sourceUrl: "https://esd.ny.gov/new-york-forward-loan-fund-2",
    sourceDate: "2026-08-25",
    reviewDate: "2027-08-01",
    reverifyBeforeApplication: true,
    nextAction:
      "Keep the program visible in the capital universe but do not spend an application or inquiry while the published time-in-business gate is not met.",
  },
] as const;
