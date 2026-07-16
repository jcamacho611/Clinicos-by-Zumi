export const REGISTRY_CANON_VERSION = "2026-07-16.2";

export const completionGateKeys = [
  "userAndPurpose",
  "visibleInterface",
  "databaseArchitecture",
  "accessAndPermissions",
  "auditLogging",
  "validation",
  "errorRecovery",
  "manualFallback",
  "integrationContract",
  "testing",
  "demoData",
  "documentation",
  "securityReview",
  "acceptanceCriteria",
] as const;

export type CompletionGateKey = (typeof completionGateKeys)[number];
export type RegistryDeliveryStatus = "CONNECTED" | "DEMO" | "FOUNDATION" | "PLANNED" | "VENDOR_DEPENDENT" | "GOVERNED";
export type RegistryDeliveryMode = "native" | "manual-fallback" | "adapter-ready" | "governance";

export interface CanonicalRegistrySection {
  number: number;
  slug: string;
  title: string;
  mandate: string;
  ownerRoles: string[];
  interfaceRoute: string;
  databaseObjects: string[];
  deliveryStatus: RegistryDeliveryStatus;
  deliveryMode: RegistryDeliveryMode;
  features: string[];
}

function featureList(value: string) {
  return value.split("|").map((feature) => feature.trim()).filter(Boolean);
}

function section(input: Omit<CanonicalRegistrySection, "features"> & { features: string }) {
  return { ...input, features: featureList(input.features) } satisfies CanonicalRegistrySection;
}

export const clinicOsDayOneRegistry: CanonicalRegistrySection[] = [
  section({
    number: 1, slug: "central-purpose", title: "Central ClinicOS Purpose",
    mandate: "Deliver a complete EMR, clinic operating system, and connected-care network for every participating practice.",
    ownerRoles: ["clinic_owner", "administrator", "medical_director"], interfaceRoute: "/dashboard",
    databaseObjects: ["organizations", "locations", "patients", "encounters", "settings"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Complete EMR and operating system per clinic | Secure healthcare network for independent clinics | Longitudinal patient timeline across authorized providers | Exchange referrals, records, labs, imaging, documents, medications, allergies, diagnoses, and care updates | Community-provider communication | Reduce repeated testing, lost referrals, missing records, faxing, phone tag, billing delays, incomplete forms, and missed follow-ups | Patient-controlled information access | Owner command center | Support primary care, medical spas, urgent care, specialty, no-fault, workers compensation, diagnostic, and multi-location practices",
  }),
  section({
    number: 2, slug: "connected-clinic-network", title: "Connected-Clinic Network and Interoperability",
    mandate: "Connect verified clinics while preserving provenance, reconciliation, delivery, and safe manual fallback.",
    ownerRoles: ["administrator", "referral_coordinator", "provider"], interfaceRoute: "/network",
    databaseObjects: ["facilities", "providers", "network_connections", "data_sharing_agreements", "patient_identifiers", "patient_matches", "record_requests", "referrals", "integrations", "integration_events"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Participating-clinic directory | Clinic verification | Location verification | Provider verification | Organization profiles | Facility profiles | Department profiles | Specialty listings | Network participation status | Data-sharing relationship status | Trusted-clinic connections | Referral partner directory | Laboratory directory | Imaging-center directory | Pharmacy directory | Hospital directory | Payer directory | Master patient index | Patient matching across clinics | Duplicate-patient detection | Possible-match review queue | Patient-record merging | Record-separation controls | Demographic reconciliation | Patient identity correction workflow | Record locator service | Cross-organization patient search | Source-organization labels | Patient aliases and former names | Identity confidence score | Shared encounters | Shared visit summaries | Shared diagnoses | Shared problem lists | Shared allergies | Shared medications | Shared immunizations | Shared procedures | Shared vitals | Shared laboratory results | Shared imaging reports | Shared referrals | Shared care plans | Shared discharge summaries | Shared clinical documents | Shared provider messages | Shared follow-up activity | Shared quality gaps | Shared patient-submitted information | Record source and date | Original author and organization | Shared corrections and addendums | Request patient records | Approve or deny record requests | Send and receive clinical summaries | Send referrals | Accept or reject referrals | Referral status tracking | Return specialist consultation notes | Send and receive labs and imaging reports | Push encounter summaries | Query connected records | Download permitted records | Export transition-of-care documents | Share selected chart sections | Share complete approved chart package | Record-delivery confirmations | Failed-delivery queue | Retry and recovery workflow | Manual upload fallback | Fax fallback tracking | Direct secure-message fallback | Data reconciliation before chart import | FHIR-ready architecture | SMART on FHIR application support | HL7 v2 message support | C-CDA document support | Direct secure messaging | Health Information Exchange connectivity | TEFCA and QHIN roadmap | Carequality-compatible strategy | External EMR connectors | Hospital-system connectors | Laboratory interfaces | Radiology interfaces | Pharmacy interfaces | Payer and clearinghouse interfaces | Data normalization | Integration monitoring | Interface error queue | Message acknowledgments | Mapping and version management",
  }),
  section({
    number: 3, slug: "access-consent-sharing", title: "Access, Consent, and Record-Sharing Controls",
    mandate: "Enforce minimum-necessary, purpose-bound, consent-aware access for every record interaction.",
    ownerRoles: ["privacy_officer", "administrator", "auditor"], interfaceRoute: "/access-controls",
    databaseObjects: ["consents", "access_grants", "record_requests", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "governance",
    features: "Organization-based access | Location-based access | Department-based access | Role-based access | Patient-specific access | Care-team access | Minimum-necessary access | Purpose-of-use selection | Treatment access | Payment access | Healthcare-operations access | Patient authorization tracking | Consent capture | Consent expiration | Consent withdrawal | Consent scope by organization | Consent scope by data category | Sensitive-record restrictions | Patient-selected sharing preferences | Provider-requested access | Emergency break-glass access | Break-glass reason requirement | Emergency-access alerts | Access revocation | Temporary access | Read-only access | Download restrictions | Printing restrictions | Patient-visible access history | Full audit history | Accessed-by identity | Represented clinic | Access purpose | Information accessed | Access timestamp | Change history | Download history | Sharing history",
  }),
  section({
    number: 4, slug: "multi-tenant-platform", title: "Multi-Tenant Clinic Platform",
    mandate: "Operate ClinicOS as a configurable SaaS with strict customer isolation and multi-organization control.",
    ownerRoles: ["super_administrator", "clinic_owner", "administrator"], interfaceRoute: "/settings",
    databaseObjects: ["organizations", "locations", "departments", "facilities", "settings", "subscriptions"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Multiple organizations | Multiple locations | Multiple departments | Multiple facilities | Multiple brands under one ownership group | Separate Luxe Medi and Brooklyn Family Medicine workspaces | Cross-location reporting | Cross-organization permissions | Organization selector | Location selector | Department selector | Organization-level settings | Location-level settings | Clinic templates | Specialty-specific configurations | Customer data separation | Tenant-level encryption boundaries | Custom branding | Custom logos | Custom colors | Custom forms | Custom appointment types | Custom workflows | Custom user roles | Custom dashboards | Subscription-plan controls | Module activation controls | Feature flags | Demo mode | Training mode | Sandbox environment | Data export | Account termination and export workflow",
  }),
  section({
    number: 5, slug: "users-providers-permissions", title: "Users, Providers, Credentials, and Permissions",
    mandate: "Represent every clinic role, credential, provider identity, and least-privilege action explicitly.",
    ownerRoles: ["super_administrator", "administrator", "medical_director"], interfaceRoute: "/settings",
    databaseObjects: ["users", "roles", "permissions", "providers", "provider_credentials"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Super administrator | Clinic owner | Organization administrator | Location manager | Medical director | Physician | Nurse practitioner | Physician assistant | Nurse | Medical assistant | Front desk | Scheduler | Biller | Revenue-cycle manager | Quality and HEDIS manager | Referral coordinator | Case manager | Document reviewer | Auditor | External referring provider | Patient | Patient proxy or guardian | Read-only user | Provider legal name | Provider display name | Provider credentials | NPI | Multiple NPIs | DEA number | DEA expiration | State licenses | License expiration | Taxonomy | Specialty | Subspecialty | Facility affiliations | Hospital affiliations | Supervising or collaborating provider | Prescribing permissions | Signature | Co-signature requirements | Telemedicine eligibility | Appointment availability | Accepted insurance | Services performed | Provider photograph | Biography | Public and private profile controls | View patient chart permission | Edit patient chart permission | Create notes permission | Sign notes permission | Co-sign notes permission | Add addendums permission | Order labs permission | Release results permission | Prescribe permission | Send referrals permission | View billing permission | Edit claims permission | Collect payments permission | Export records permission | Access sensitive records permission | Manage users permission | Configure integrations permission | Access analytics permission | Use AI tools permission | Approve AI-generated content permission | Break-glass permission",
  }),
  section({
    number: 6, slug: "patient-registration", title: "Patient and Client Registration",
    mandate: "Create accurate patient and med-spa client identities with duplicate prevention and complete administrative context.",
    ownerRoles: ["front_desk", "scheduler", "patient"], interfaceRoute: "/patients",
    databaseObjects: ["patients", "patient_identifiers", "patient_contacts", "emergency_contacts", "patient_insurance", "patient_pharmacies", "patient_preferences", "patient_matches"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "New patient registration | Returning-patient registration | Med-spa client registration | Patient or client designation | Demographics | Legal name | Preferred name | Former names | Date of birth | Age | Sex assigned at birth | Gender identity where appropriate | Pronouns | Address | Phone | Email | Preferred contact method | Preferred language | Interpreter needed | Emergency contact | Guardian or proxy | Responsible party | Guarantor | Primary insurance | Secondary insurance | Preferred pharmacy | Communication preferences | Portal status | Consent status | Photograph | Identity-document verification | Duplicate checking | Patient merge review | Deceased-patient status | Inactive and archive status",
  }),
  section({
    number: 7, slug: "complete-patient-chart", title: "Complete Patient Chart and EMR",
    mandate: "Provide one complete, navigable, longitudinal patient record with clinical, administrative, revenue, and audit context.",
    ownerRoles: ["provider", "clinical_staff", "front_desk", "biller"], interfaceRoute: "/patients",
    databaseObjects: ["patients", "encounters", "clinical_notes", "vitals", "allergies", "medications", "problems", "diagnoses", "procedures", "documents", "audit_logs"], deliveryStatus: "DEMO", deliveryMode: "native",
    features: "Chart patient name | Preferred name | Patient photograph | Date of birth | Age | Sex | Pronouns | Phone | Primary insurance | Allergies alert | Risk alerts | Care team | Portal status | Upcoming appointment | Balance due | Open care gaps | Active cases | Emergency flags | Summary | Longitudinal timeline | Demographics | Insurance | Emergency contacts | Care team section | Encounters | Clinical notes | SOAP notes | Vitals | Allergies | Medications | Problem list | Diagnoses | Procedures | Medical history | Surgical history | Family history | Social history | Immunizations | Pregnancy status where relevant | Smoking and tobacco status | Care plans | Orders | Referrals | Labs | Imaging | Documents | Forms | Consents | Messages | Tasks | Billing | Payments | Quality measures | Care gaps | No-fault cases | Workers compensation cases | Audit history",
  }),
  section({
    number: 8, slug: "clinical-encounters", title: "Clinical Encounter and Charting System",
    mandate: "Support complete structured documentation with explicit human review, signature, locking, coding, and addenda.",
    ownerRoles: ["provider", "clinical_staff", "medical_director"], interfaceRoute: "/encounters",
    databaseObjects: ["encounters", "soap_notes", "clinical_notes", "note_templates", "smart_phrases", "vitals", "diagnoses", "procedures", "orders", "referrals"], deliveryStatus: "CONNECTED", deliveryMode: "native",
    features: "New-patient visit | Established-patient visit | Follow-up visit | Annual physical | Annual wellness visit | Urgent sick visit | Telemedicine visit | Lab-review visit | Medication-management visit | Procedure visit | Weight-loss visit | IV-hydration visit | Botox or filler consultation | Injectable-treatment visit | Medical-spa follow-up | No-fault visit | Workers compensation visit | Custom encounter types | Visit reason | Chief complaint | History of present illness | Review of systems | Vitals | Height | Weight | BMI | Blood pressure | Pulse | Temperature | Oxygen saturation | Pain score | Physical examination | Assessment | Plan | Diagnoses | ICD-10 codes | Procedures | CPT codes | Modifiers | Orders | Referrals | Prescriptions | Patient instructions | Follow-up plan | Care-team assignment | Supporting documents | Provider signature | Co-signature | Encounter billing status | SOAP subjective | SOAP objective | SOAP assessment | SOAP plan | Note templates | Specialty templates | Smart phrases | Auto-save | Draft status | Ready-for-review status | Signed status | Locked status | Addendum support | Amendment history | Co-signature workflow | Time-based billing fields | Medical-decision-making fields | Internal-only sections | Patient-visible sections | Printable visit summary | AI-assisted draft | Mandatory human review | Full note audit history",
  }),
  section({
    number: 9, slug: "scheduling", title: "Scheduling and Calendar",
    mandate: "Coordinate organizations, locations, departments, providers, rooms, equipment, patients, and reminders across time zones.",
    ownerRoles: ["scheduler", "front_desk", "provider"], interfaceRoute: "/schedule",
    databaseObjects: ["appointments", "appointment_types", "provider_availability", "rooms", "resources", "check_ins", "waitlist"], deliveryStatus: "CONNECTED", deliveryMode: "native",
    features: "Organization calendar | Location calendar | Department calendar | Provider calendar | Room calendar | Equipment and resource calendar | Day view | Week view | Month view | Multi-provider view | Appointment types | Visit durations | Provider availability | Recurring availability | Blocked time | Vacation and time-off | Overbooking controls | Appointment requests | Staff-booked appointments | Patient self-requesting | Approved patient self-scheduling | Walk-in appointments | Mobile and at-home appointments | Telemedicine appointments | Recurring appointments | Waitlist | Cancellation list | Rescheduling | No-show tracking | Cancellation-reason tracking | Appointment reminders | Confirmation reminders | Follow-up reminders | Pre-visit instructions | Post-visit instructions | Color-coded appointments | Schedule conflict detection | Time-zone support | Calendar export and integration | Requested status | Pending confirmation status | Confirmed status | Arrived status | Checked in status | In room status | Ready for provider status | With provider status | Checkout status | Completed status | Cancelled status | No-show status | Rescheduled status",
  }),
  section({
    number: 10, slug: "front-desk", title: "Front Desk Workspace",
    mandate: "Give front-desk teams one operational board for patient readiness, communications, payment, and handoffs.",
    ownerRoles: ["front_desk", "scheduler", "location_manager"], interfaceRoute: "/front-desk",
    databaseObjects: ["appointments", "check_ins", "forms", "consents", "payments", "call_logs", "tasks", "referrals"], deliveryStatus: "DEMO", deliveryMode: "native",
    features: "Todays appointments | Patient arrival list | Check-in | Room assignment | Check-out | New-patient registration | Demographic verification | Insurance-card upload | ID upload | Insurance verification status | Forms-completion status | Consent status | Copay due | Deposit due | Balance due | Payment collection | Receipt delivery | Missed calls | Callback queue | Voicemails | Website requests | Patient portal requests | Urgent messages | Provider alerts | Referral status | No-show follow-up | Cancellation refill and waitlist workflow | Follow-up scheduling | Print and export approved summaries | Internal staff messaging | Task assignment",
  }),
  section({
    number: 11, slug: "provider-workspace", title: "Provider Workspace",
    mandate: "Prioritize clinical work and preserve licensed-provider control over every clinical decision.",
    ownerRoles: ["provider", "medical_director"], interfaceRoute: "/provider",
    databaseObjects: ["appointments", "encounters", "lab_results", "imaging_results", "referrals", "prior_authorizations", "messages", "quality_gaps", "tasks"], deliveryStatus: "DEMO", deliveryMode: "native",
    features: "Todays schedule | Patient queue | Ready-for-provider queue | Patient summary | Pre-visit intake summary | Open encounter | SOAP-note editor | Pending signatures | Co-signature queue | Lab-review queue | Imaging-review queue | Refill-request queue | Referral queue | Prior-authorization queue | Patient-message queue | Quality-gap alerts | Follow-up tasks | Urgent escalations | Telemedicine waiting room | Provider performance dashboard",
  }),
  section({
    number: 12, slug: "patient-portal", title: "Patient and Client Portal",
    mandate: "Give patients secure, consent-aware control over appointments, approved records, communication, payments, and sharing.",
    ownerRoles: ["patient", "patient_proxy", "portal_administrator"], interfaceRoute: "/portal",
    databaseObjects: ["users", "patients", "appointments", "forms", "consents", "documents", "messages", "payments", "access_grants", "audit_logs"], deliveryStatus: "DEMO", deliveryMode: "native",
    features: "Create portal account | Secure portal login | Portal multifactor authentication | Manage authorized proxies | Request appointments | View upcoming appointments | Permitted rescheduling | Permitted cancellation | Complete intake forms | Sign consents | Upload identification | Upload insurance cards | Update demographics | Update pharmacy | Update contact preferences | Pay deposits | Pay copays | Pay balances | View statements | Download receipts | Secure office messaging | Request prescription refills | Request referrals | View approved visit summaries | View approved laboratory results | View approved imaging reports | View approved documents | Access telemedicine links | View care plans | View patient instructions | View appropriate care gaps | View record-sharing activity | Manage sharing permissions | Download and export permitted records | Request corrections | Request medical records | Receive notifications",
  }),
  section({
    number: 13, slug: "forms-consents", title: "Intake Forms, Consents, and E-Signatures",
    mandate: "Build, version, complete, review, sign, lock, and attach healthcare forms with complete provenance.",
    ownerRoles: ["administrator", "front_desk", "provider", "patient"], interfaceRoute: "/forms",
    databaseObjects: ["form_templates", "form_assignments", "form_submissions", "form_reviews", "form_events", "consents", "signatures", "documents", "tasks", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Drag-and-drop form builder | Form field types | Required fields | Conditional logic | Section logic | Repeatable sections | Save and resume | Mobile completion | Staff-completed forms | Patient-completed forms | Provider-completed forms | Form versioning | Expiration dates | Renewal reminders | E-signature | Signature date and time | Signer identity | Witness signature | Provider signature | Locked submission | Staff review | Provider review | Correction request | PDF creation | Chart attachment | Patient copy | New-patient intake template | Medical history template | Surgical history template | Family history template | Social history template | Medication list template | Allergy list template | HIPAA acknowledgment | Notice of Privacy Practices acknowledgment | Financial policy | Communication consent | SMS consent | Call-recording disclosure | Telemedicine consent | Treatment consent | Medical-spa consent | Botox and filler consent | IV-hydration consent | Weight-loss consent | Photography and before-after consent | No-fault intake | Workers compensation intake | Assignment of benefits",
  }),
  section({
    number: 14, slug: "documents", title: "Document Management",
    mandate: "Securely capture, classify, version, review, release, search, and export every chart and case document.",
    ownerRoles: ["document_reviewer", "front_desk", "provider", "case_manager"], interfaceRoute: "/documents",
    databaseObjects: ["documents", "document_categories", "document_reviews", "document_events", "tasks", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "manual-fallback",
    features: "Identification documents | Insurance cards | Intake documents | Consent documents | Clinical notes | Laboratory results | Imaging reports | Referrals | Prior authorizations | Patient education | Billing documents | Claim documents | No-fault documents | Workers compensation documents | Attorney documents | Adjuster documents | Medical-necessity documents | Signed agreements | Before-and-after media | Miscellaneous documents | Upload | Camera capture | Scan | Preview | Download | Print | Categorize | Tag | Search | Filter | Link to patient | Link to encounter | Link to referral | Link to case | Internal-only setting | Patient-visible setting | Provider-review status | Release-approval status | Version control | Expiration tracking | Secure storage | Encryption | PDF viewer | Packet export | Full audit log",
  }),
  section({
    number: 15, slug: "orders-referrals", title: "Orders, Referrals, and Care Coordination",
    mandate: "Close the loop on every order and referral across connected and external organizations.",
    ownerRoles: ["provider", "referral_coordinator", "clinical_staff"], interfaceRoute: "/referrals",
    databaseObjects: ["orders", "referrals", "referral_events", "documents", "tasks", "escalations", "network_connections", "data_sharing_agreements", "consents", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "manual-fallback",
    features: "Create clinical order | Laboratory order | Imaging order | Procedure order | Medication order | Referral order | Referral destination search | Referral reason | Clinical question | Priority level | Supporting-document attachment | Referral authorization | Referral-status tracking | Sent status | Received status | Accepted status | Scheduled status | Completed status | Consultation note received | Closed-loop referral confirmation | Referral reminder | Patient outreach | Specialist response | Follow-up task | Failed-referral escalation | Connected-clinic referral exchange | External-clinic fax fallback | External-clinic Direct fallback",
  }),
  section({
    number: 16, slug: "laboratory", title: "Laboratory System",
    mandate: "Manage orders, structured results, review, release, follow-up, provenance, correction, and vendor adapters.",
    ownerRoles: ["provider", "clinical_staff", "lab_reviewer"], interfaceRoute: "/labs",
    databaseObjects: ["lab_orders", "lab_results", "lab_result_items", "lab_events", "documents", "tasks", "escalations", "notifications", "audit_logs", "integrations", "integration_events"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Laboratory-order creation | Test selection | Diagnosis attachment | Order priority | Collection information | Specimen information | Order printing | Electronic transmission | Manual-order fallback | Result receipt | Manual result upload | Structured result entry | Test name | LOINC mapping | Result value | Unit | Reference range | Abnormal flag | Critical flag | Collection date | Result date | Ordering provider | Result source | Reviewing provider | Provider-review queue | Review comments | Patient-release approval | Released-to-portal status | Patient-notified status | Follow-up task | Repeat-lab order | Longitudinal result graph | Result correction | Result provenance | Quest strategy | Labcorp strategy | BioReference strategy | Local-lab strategy | Hospital-lab strategy | HL7 interface readiness | FHIR interface readiness",
  }),
  section({
    number: 17, slug: "imaging", title: "Imaging and Radiology",
    mandate: "Manage imaging orders, authorization, transmission, results, review, release, correction, and future PACS connectivity.",
    ownerRoles: ["provider", "clinical_staff", "radiology_reviewer"], interfaceRoute: "/imaging",
    databaseObjects: ["imaging_orders", "imaging_results", "imaging_events", "prior_authorizations", "documents", "tasks", "escalations", "notifications", "audit_logs", "integrations", "integration_events"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Imaging-order creation | Modality selection | Body-part selection | Diagnosis attachment | Clinical indication | Prior-authorization status | Imaging-facility selection | Order transmission | Manual-order fallback | Imaging appointment status | Report receipt | Imaging-report upload | Structured report fields | Radiology-review queue | Provider comments | Patient-release approval | Released-to-portal status | Patient-notified status | Follow-up task | Report correction | Image and link attachment | Longitudinal imaging timeline | Lenox Hill and RadNet-style integration | Local imaging integration | Hospital imaging integration | DICOM and PACS roadmap | HL7 interface readiness | FHIR interface readiness",
  }),
  section({
    number: 18, slug: "medications", title: "Medication, Pharmacy, and E-Prescribing",
    mandate: "Maintain a complete medication history and provider-controlled refill and prescribing workflow.",
    ownerRoles: ["provider", "clinical_staff", "patient"], interfaceRoute: "/medications",
    databaseObjects: ["medications", "medication_reconciliations", "refill_requests", "prescriptions", "medication_warnings", "medication_events", "patient_pharmacies", "tasks", "escalations", "prior_authorizations", "integrations", "integration_events", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Medication list | Active medications | Historical medications | Dosage | Route | Frequency | Start and end dates | Prescribing provider | Medication reconciliation | Discontinued medication | Patient-reported medication | Refill requests | Refill-review queue | Pharmacy directory | Pharmacy search | Preferred pharmacy | Prescription status | Medication-delivery status | Allergy interaction alerts | Source-labeled exact allergy checks | Source-labeled duplicate checks | Medication interaction roadmap | Medication interaction service roadmap | E-prescribing vendor integration | Controlled-substance workflow | Controlled-substance and EPCS planning | PDMP integration planning | Prior authorization | Formulary checks | Human provider approval | Failed transmission queue | Manual prescription fallback | Complete medication audit history",
  }),
  section({
    number: 19, slug: "billing-revenue-cycle", title: "Billing and Revenue-Cycle Management",
    mandate: "Prepare, validate, submit, reconcile, appeal, collect, and report every clinical and patient financial transaction.",
    ownerRoles: ["biller", "revenue_cycle_manager", "clinic_owner"], interfaceRoute: "/billing",
    databaseObjects: ["billing_accounts", "superbills", "claims", "claim_lines", "denials", "remittances", "payments", "invoices", "patient_balances"], deliveryStatus: "DEMO", deliveryMode: "adapter-ready",
    features: "Billing account | Guarantor | Superbills | CPT codes | ICD-10 codes | Modifiers | Units | Place of service | Rendering-provider NPI | Billing-provider NPI | Facility NPI | Tax ID | Payer | Claim creation | Claim lines | CMS-1500 generation | Claim validation | Claim-scrubbing roadmap | Billing review queue | Electronic claim submission | Clearinghouse connection | Claim acknowledgment | Rejected-claim handling | Denial tracking | Denial reason | Appeal workflow | Corrected claim | Payment posting | ERA and remittance | Patient responsibility | Copays | Coinsurance | Deductibles | Patient balances | Statements | Invoices | Receipts | Self-pay billing | Payment plans | Refunds | Financial notes | Revenue dashboard | Draft claim status | Ready for review claim status | Submitted claim status | Accepted claim status | Rejected claim status | Denied claim status | Paid claim status | Partially paid claim status | Patient balance claim status | Appealed claim status | Closed claim status | 270 and 271 eligibility | 837 claims | 835 remittance | 276 and 277 claim status | 278 prior authorization",
  }),
  section({
    number: 20, slug: "insurance-verification", title: "Insurance Verification",
    mandate: "Capture, verify, age, and communicate eligibility and benefit information without guaranteeing coverage.",
    ownerRoles: ["front_desk", "biller", "patient"], interfaceRoute: "/insurance",
    databaseObjects: ["patient_insurance", "insurance_verifications", "documents", "tasks"], deliveryStatus: "DEMO", deliveryMode: "adapter-ready",
    features: "Primary insurance | Secondary insurance | Payer | Plan | Member ID | Group number | Subscriber information | Relationship to subscriber | Effective date | Termination date | Eligibility status | Copay | Deductible | Deductible met | Coinsurance | Coverage notes | Network status | Authorization requirements | Verification date | Verified by | Verification source | Insurance-card images | Manual verification | Electronic eligibility | Failed-verification queue | Reverification reminders | No guarantee of coverage notice",
  }),
  section({
    number: 21, slug: "payments-memberships", title: "Payments, Deposits, and Memberships",
    mandate: "Collect and reconcile patient payments and med-spa packages without exposing PHI to payment processors.",
    ownerRoles: ["front_desk", "biller", "clinic_owner"], interfaceRoute: "/billing",
    databaseObjects: ["payments", "payment_links", "invoices", "patient_balances", "payment_events", "membership_plans", "patient_memberships", "package_plans", "package_purchases", "subscriptions"], deliveryStatus: "FOUNDATION", deliveryMode: "manual-fallback",
    features: "Payment links | Deposits | Copays | Balances | Package payments | Membership payments | Invoices | Receipts | Refunds | Payment status | Payment history | Card-processing integration | Stripe adapter | Square adapter | Secure checkout | No PHI in payment descriptions | Payment-plan support | Failed-payment notices | Overdue-payment tasks | Reconciliation | Refund audit | Medical-spa packages | Luxe Medi memberships | Package-session tracking | Package expiration | Gift-card roadmap",
  }),
  section({
    number: 22, slug: "no-fault", title: "No-Fault Case Management",
    mandate: "Coordinate no-fault clinical, legal, document, authorization, billing, and profitability workflows.",
    ownerRoles: ["case_manager", "biller", "provider"], interfaceRoute: "/cases",
    databaseObjects: ["nofault_cases", "case_documents", "case_tasks", "case_packets", "claims", "payments"], deliveryStatus: "DEMO", deliveryMode: "manual-fallback",
    features: "No-fault case profile | Accident date | Claim number | Carrier | Adjuster | Attorney | Policy information | Body parts injured | Diagnosis list | Treatment plan | Assignment of benefits | NF-2 tracking | NF-3 support | CMS-1500 support | Medical-necessity documents | Narrative builder | Narrative due dates | Prior-authorization tracking | Denial tracking | Appeal tracking | Independent medical examination tracking | Document checklist | Case-task checklist | Attorney communications | Adjuster communications | Packet builder | Packet export | Billing ledger | Case timeline | Case profitability dashboard",
  }),
  section({
    number: 23, slug: "workers-compensation", title: "Workers Compensation Case Management",
    mandate: "Coordinate workers compensation care, authorization, work status, documents, billing, and case profitability.",
    ownerRoles: ["case_manager", "biller", "provider"], interfaceRoute: "/cases",
    databaseObjects: ["workers_comp_cases", "case_documents", "case_tasks", "case_packets", "claims"], deliveryStatus: "DEMO", deliveryMode: "manual-fallback",
    features: "Workers compensation case profile | Employer | Carrier | Claim number | Adjuster | Attorney | Injury date | Injured body parts | Diagnoses | Treatment plan | Work-status tracking | Return-to-work status | Authorization tracking | C-4 support roadmap | Narrative reports | IME tracking | Denials | Appeals | Case documents | Case tasks | Packet builder | Packet export | Billing ledger | Case timeline | Case profitability dashboard",
  }),
  section({
    number: 24, slug: "quality-population-health", title: "HEDIS, Quality, and Population Health",
    mandate: "Detect, evidence, close, report, and improve quality measures across patients, providers, clinics, and payers.",
    ownerRoles: ["quality_manager", "provider", "clinic_owner"], interfaceRoute: "/quality",
    databaseObjects: ["quality_measures", "quality_gaps", "patient_quality_status", "outreach_campaigns", "tasks"], deliveryStatus: "DEMO", deliveryMode: "native",
    features: "Quality-measure library | HEDIS measure tracking | Electronic clinical quality measures | Patient-level measure status | Provider-level performance | Clinic-level performance | Care-gap detection | Open care gaps | Closed care gaps | Exclusions | Measure evidence | Missing-data alerts | Outreach queue | Reminder campaigns | Patient follow-up | Documentation prompts | Quality dashboard | Monthly quality report | Payer-reporting support | Provider comparison | Quality bonus tracking roadmap | Diabetes A1C measure | Blood-pressure control measure | Breast-cancer screening | Cervical-cancer screening | Colorectal-cancer screening | Immunizations | Medication adherence | Follow-up after hospitalization | Depression screening | Tobacco-use screening | BMI screening | Preventive-care reminders | Annual wellness reminders",
  }),
  section({
    number: 25, slug: "telemedicine", title: "Telemedicine",
    mandate: "Provide consent-aware virtual visit operations around a compliant video-vendor adapter.",
    ownerRoles: ["provider", "front_desk", "patient"], interfaceRoute: "/telemedicine",
    databaseObjects: ["appointments", "consents", "encounters", "messages", "documents", "payments", "audit_logs"], deliveryStatus: "DEMO", deliveryMode: "adapter-ready",
    features: "Telemedicine appointment type | Telemedicine eligibility and configuration | Digital consent | Patient waiting room | Secure video link | Provider join | Visit status | Chat during visit | Document sharing | Clinical documentation | Payment status | Patient instructions | Follow-up task | No-show tracking | Compliant video-vendor integration | Telemedicine audit trail",
  }),
  section({
    number: 26, slug: "communications", title: "Messaging, Calls, and Communications",
    mandate: "Unify consent-aware, assigned, auditable communication across patient, staff, provider, referral, and lead channels.",
    ownerRoles: ["front_desk", "provider", "biller", "referral_coordinator"], interfaceRoute: "/messages",
    databaseObjects: ["message_threads", "messages", "call_logs", "sms_logs", "email_logs", "tasks", "escalations"], deliveryStatus: "DEMO", deliveryMode: "adapter-ready",
    features: "Phone channel | Voicemail channel | SMS channel | Email channel | Website forms channel | Patient portal channel | Internal messages | Provider-to-provider messages | Referral messages | Social-media lead capture | Instagram inquiry tracking | Facebook inquiry tracking | Unified communications inbox | Call logs | Missed-call detection | Missed-call text-back | Voicemail transcription | Call summaries | Call recording controls | Recording disclosure | SMS consent | SMS opt-out | Email tracking | Secure patient messaging | Internal staff messaging | Provider messaging | Message assignment | Read and unread status | Response-time tracking | Escalation | Communication templates | Approved-language library | Delivery failures | Retry queue | Communication audit history | Luxe Medi booking category | Luxe Medi price question category | Luxe Medi weight-loss inquiry | Luxe Medi IV inquiry | Luxe Medi injectables inquiry | Luxe Medi payment question | BFM appointment request | BFM new-patient request | BFM existing-patient request | BFM billing question | BFM lab question | BFM medication and refill question | Insurance question | No-fault and workers compensation question | Emergency symptom | Angry caller | Staff and internal call | Unknown and needs review",
  }),
  section({
    number: 27, slug: "crm-revenue-recovery", title: "CRM, Lead Management, and Revenue Recovery",
    mandate: "Capture, route, recover, convert, and attribute every patient, client, campaign, and referral opportunity.",
    ownerRoles: ["front_desk", "growth_manager", "clinic_owner"], interfaceRoute: "/crm",
    databaseObjects: ["patients", "message_threads", "call_logs", "tasks", "appointments", "payments", "activity_logs"], deliveryStatus: "PLANNED", deliveryMode: "native",
    features: "Lead capture | Patient-request capture | Contact records | Lead source | Website leads | Social leads | Phone leads | Referral leads | Campaign source | Service interest | Appointment interest | Estimated value | Pipeline stages | Assigned staff member | Follow-up due | Contact attempts | Lead notes | Booking status | Payment status | Form status | Lost-lead reason | No-response reactivation | Old-lead reactivation | Missed-call recovery | Unanswered-message recovery | Unbooked-consult recovery | No-show recovery | Cancellation refill | Waitlist replacement | Unpaid-deposit tracking | Unpaid-balance tracking | Package and membership opportunity | Follow-up scheduling | Referral follow-up | Lost-money calculation | Recovered-money calculation | Conversion dashboard | Luxe new lead | Luxe contacted | Luxe consultation requested | Luxe forms sent | Luxe deposit or payment needed | Luxe appointment booked | Luxe completed visit | Luxe follow-up needed | Luxe package or membership opportunity | Luxe lost or no response | BFM new-patient inquiry | BFM existing-patient request | BFM appointment requested | BFM intake incomplete | BFM insurance needed | BFM appointment scheduled | BFM checked in | BFM provider review | BFM follow-up needed | BFM billing, lab, or document issue | BFM urgent escalation",
  }),
  section({
    number: 28, slug: "tasks-notifications-escalations", title: "Tasks, Notifications, and Escalations",
    mandate: "Give every item an owner, due state, dependency, proof, escalation path, and acknowledged resolution.",
    ownerRoles: ["all_staff", "provider", "clinic_owner"], interfaceRoute: "/tasks",
    databaseObjects: ["tasks", "notifications", "escalations", "documents", "activity_logs"], deliveryStatus: "DEMO", deliveryMode: "native",
    features: "Task creation | Task assignment | Due date | Priority | Task organization | Task location | Patient link | Encounter link | Case link | Referral link | Task category | Task comments | Attachments | Recurring tasks | Task dependencies | Completion proof | Overdue status | Reassignment | Escalation | Staff notifications | Provider notifications | Owner notifications | Patient notifications | Email notifications | SMS notifications | In-app notifications | Notification preferences | Urgent alerts | Acknowledgment requirement | Escalation chain | Escalation-resolution notes | Normal risk | Needs staff risk | Needs provider risk | Urgent risk | Do not automate risk | New status | Needs callback status | Contacted status | Appointment requested status | Booked status | Forms sent status | Forms incomplete status | Payment needed status | Paid status | Completed status | Lost or no response status | Escalate to staff status | Escalate to provider status | Urgent status | Do not automate status",
  }),
  section({
    number: 29, slug: "owner-analytics", title: "Owner Command Center and Analytics",
    mandate: "Give owners an accurate operational, clinical, revenue, quality, security, integration, and workload command center.",
    ownerRoles: ["clinic_owner", "administrator", "location_manager"], interfaceRoute: "/dashboard",
    databaseObjects: ["appointments", "patients", "tasks", "claims", "payments", "quality_gaps", "integration_events", "audit_logs"], deliveryStatus: "DEMO", deliveryMode: "native",
    features: "Todays appointments metric | New patients metric | New clients metric | New leads metric | Missed calls metric | Unanswered messages metric | Appointment requests metric | Booked appointments metric | No-shows metric | Cancellations metric | Forms incomplete metric | Insurance missing metric | Payments due metric | Deposits due metric | Patient balances metric | Claims pending metric | Claims rejected metric | Denials metric | Labs awaiting review metric | Imaging awaiting review metric | Referrals incomplete metric | Prior authorizations pending metric | Follow-ups overdue metric | Staff tasks metric | Provider tasks metric | Urgent escalations metric | Quality gaps metric | Patient outreach needed metric | No-fault case issues metric | Workers compensation case issues metric | Revenue collected metric | Estimated lost revenue | Estimated recovered revenue | Conversion rate | Staff workload | Provider productivity | Location performance | Organization performance | AI activity | Integration failures | Security alerts | Daily report | Weekly report | Monthly report | Custom date range | Organization comparison | Location comparison | Provider comparison | Export CSV | Export PDF | Scheduled reports | Role-specific reporting | Custom report builder",
  }),
  section({
    number: 30, slug: "ai-agent-system", title: "AI and Agent System",
    mandate: "Use AI for constrained administrative support with logged tools, human checkpoints, recovery, and hard clinical prohibitions.",
    ownerRoles: ["clinic_owner", "administrator", "provider", "ai_reviewer"], interfaceRoute: "/ai-assistants",
    databaseObjects: ["ai_summaries", "ai_classifications", "ai_drafts", "ai_reviews", "audit_logs", "tasks", "escalations"], deliveryStatus: "DEMO", deliveryMode: "governance",
    features: "Front-desk agent | Intake agent | Call-summary agent | Request-classification agent | Follow-up agent | Payment-reminder agent | Billing-preparation agent | Provider-preparation agent | Lab follow-up agent | Quality-gap agent | No-fault packet agent | Workers compensation packet agent | Document-classification agent | Owner-report agent | Secure chat assistant | AI voice agent | Summarize calls | Transcribe calls | Classify requests | Route requests | Create tasks | Detect missing information | Summarize intake | Summarize chart activity | Prepare provider pre-visit summaries | Draft nonclinical responses | Draft follow-up messages | Categorize documents | Flag risk | Identify overdue work | Prepare billing information | Detect care gaps | Prepare packet checklists | Generate owner reports | Recommend next administrative action | Single augmented-model calls | Retrieval | Tool use | Memory | Prompt chaining | Routing | Parallel evaluation | Orchestrator-worker workflows | Evaluator-optimizer review loops | Human checkpoints | Maximum-iteration limits | Ground-truth verification from tools | Sandboxed testing | Tool-use logs | Clear tool documentation | Failure recovery | Human approval gates | No AI diagnosis | No AI prescribing | No final AI lab interpretation | No AI treatment decisions | No AI refill approval | No AI patient eligibility decisions | No AI insurance guarantees | No AI treatment guarantees | No unauthorized AI record release | No final AI billing decisions | No AI legal decisions | Stop routine AI processing during emergencies | Human review for clinical content | Urgent escalation for emergency content | Route medical questions to staff or provider | Route lab questions to provider | Route medication and refill questions to provider | Route insurance guarantees to staff or billing | Route angry callers to humans | Route no-fault disputes to case or billing staff | Log every AI action | Show review status on every AI output",
  }),
  section({
    number: 31, slug: "mandatory-safety-scripts", title: "Mandatory Safety Scripts",
    mandate: "Use approved, immutable safety language for emergencies, medical questions, insurance, treatments, and handoffs.",
    ownerRoles: ["medical_director", "privacy_officer", "administrator"], interfaceRoute: "/ai-assistants",
    databaseObjects: ["settings", "ai_reviews", "audit_logs"], deliveryStatus: "GOVERNED", deliveryMode: "governance",
    features: "Emergency 911 and emergency-room script | Medical-question non-advice and routing script | Insurance no-guarantee and verification script | Luxe Medi licensed-provider treatment-review script | Human-handoff office-review script",
  }),
  section({
    number: 32, slug: "luxe-medi", title: "Luxe Medi-Specific Features",
    mandate: "Support medical-spa services, consent, packages, memberships, media, mobile care, conversion, and provider review.",
    ownerRoles: ["clinic_owner", "provider", "front_desk", "growth_manager"], interfaceRoute: "/luxe-medi",
    databaseObjects: ["organizations", "appointments", "encounters", "consents", "payments", "subscriptions", "documents"], deliveryStatus: "PLANNED", deliveryMode: "native",
    features: "Public service catalog | Injectables | Botox | Juvederm and fillers | IV hydration | Weight-loss services | Body contouring | Lymphatic drainage | Pre and post-operative care | Teeth whitening | Tooth gems | Mobile and at-home services | Consultation requests | Treatment-consent templates | Provider treatment-eligibility review | Deposits | Packages | Memberships | Session tracking | Follow-up visits | Before-and-after media | Photography consent | Provider assignment | Inventory roadmap | Service pricing | Promotion tracking | Lead conversion | Client reactivation | Treatment-plan tracking",
  }),
  section({
    number: 33, slug: "digital-front-door", title: "Public Websites and Digital Front Door",
    mandate: "Provide accessible, transparent, mobile public sites that feed approved requests and leads into ClinicOS.",
    ownerRoles: ["clinic_owner", "growth_manager", "administrator"], interfaceRoute: "/",
    databaseObjects: ["organizations", "providers", "settings", "appointments", "message_threads", "activity_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Luxe Medi home page | Luxe Medi services page | Luxe Medi weight loss page | Luxe Medi IV hydration page | Luxe Medi injectables page | Luxe Medi packages and memberships page | Luxe Medi about page | Luxe Medi booking and appointment request | Luxe Medi forms page | Luxe Medi contact page | Luxe Medi privacy page | Luxe Medi HIPAA information where applicable | Luxe Medi terms page | Luxe Medi service pricing | Luxe Medi provider profiles | Luxe Medi deposit and payment flow | Luxe Medi CRM connection | BFM home page | BFM about page | BFM providers page | BFM services page | BFM new patients page | BFM insurance information | BFM telemedicine page | BFM forms page | BFM patient portal | BFM contact page | BFM Privacy Notice | BFM appointment-request flow | BFM CRM and ClinicOS connection | Content management | Location consistency | Provider transparency | Lead capture | Appointment requests | Portal access | Accessibility | Mobile responsiveness | Search optimization | Analytics | Privacy and cookie controls",
  }),
  section({
    number: 34, slug: "saas-commercialization", title: "SaaS Sales, Onboarding, and Commercialization",
    mandate: "Sell, configure, train, support, bill, and grow ClinicOS as a repeatable clinic SaaS product.",
    ownerRoles: ["super_administrator", "sales", "customer_success"], interfaceRoute: "/capabilities",
    databaseObjects: ["organizations", "subscriptions", "settings", "users", "activity_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "ClinicOS marketing site | Product landing page | Book-a-demo flow | Sales lead capture | Demo scheduling | Demo-mode tenant | Guided product tour | Sample patient data | Sample clinic data | Clinic-type selector | Primary-care template | Med-spa template | Urgent-care template | No-fault template | Workers compensation template | Specialist-office template | Organization onboarding | Location setup | Provider setup | Staff setup | Role setup | Appointment-type setup | Form-template setup | Billing-settings setup | Quality-settings setup | Integration setup | Data-migration planning | Subscription plans | Setup fees | Monthly subscriptions | Module pricing | Usage pricing | Customer billing | Trial controls | Founding-clinic pricing | Customer support | Training center | Knowledge base | Implementation checklist | Support tickets | Feature requests | Customer-success dashboard",
  }),
  section({
    number: 35, slug: "integration-administration", title: "Integration Administration",
    mandate: "Govern every vendor and standards connection through security, credentials, monitoring, retry, and audit controls.",
    ownerRoles: ["administrator", "integration_owner", "security_officer"], interfaceRoute: "/integrations",
    databaseObjects: ["integrations", "integration_events", "api_keys", "audit_logs"], deliveryStatus: "DEMO", deliveryMode: "adapter-ready",
    features: "Integration marketplace | Connection status | Vendor | Integration purpose | Required data | Authentication status | BAA requirement | Compliance risk | Implementation owner | Current phase | Test connection | Error logs | Retry | Disable | Credential rotation | Webhook management | API key management | Rate-limit monitoring | Integration audit history | FHIR category | SMART on FHIR category | HL7 category | C-CDA category | TEFCA and QHIN category | HIE category | Carequality category | Quest category | Labcorp category | BioReference category | Lenox Hill and RadNet-style imaging category | Hospital category | Eligibility services category | Clearinghouse category | Stripe category | Square category | Twilio voice and SMS category | Retell and AI voice category | Telemedicine vendor category | E-prescribing vendor category | Clinical-reference layer category | External EMR category | Patient portal API category",
  }),
  section({
    number: 36, slug: "security-privacy-compliance", title: "Security, Privacy, and Compliance Controls",
    mandate: "Build defense in depth, privacy governance, incident readiness, and safe development without claiming certification prematurely.",
    ownerRoles: ["security_officer", "privacy_officer", "administrator"], interfaceRoute: "/settings",
    databaseObjects: ["auth_sessions", "passkey_credentials", "roles", "permissions", "consents", "access_grants", "audit_logs", "settings"], deliveryStatus: "FOUNDATION", deliveryMode: "governance",
    features: "HIPAA-conscious architecture | Business Associate Agreements | Vendor inventory | Risk assessment | Role-based access | Organization isolation | Multifactor authentication | Strong password policy | Session timeouts | Device and session management | Encryption in transit | Encryption at rest | Secure secrets management | Audit logs | Immutable critical-event logs | Data backups | Backup restoration | Disaster recovery | Incident-response plan | Breach-response workflow | Data-retention policy | Data-destruction policy | Patient communication consent | SMS consent | Call consent | Call-recording disclosure | Notice of Privacy Practices | Staff training | Security alerts | Failed-login monitoring | Suspicious-access monitoring | Data export monitoring | Minimum-necessary rules | Information-access and release controls | Information-blocking review | Synthetic-data development | No real PHI in development | Production and development separation | Penetration-testing roadmap | Vulnerability-management roadmap",
  }),
  section({
    number: 37, slug: "reliability-observability", title: "Reliability and Observability",
    mandate: "Make system, integration, queue, cost, storage, backup, incident, and deployment health visible and recoverable.",
    ownerRoles: ["super_administrator", "engineering", "security_officer"], interfaceRoute: "/system-health",
    databaseObjects: ["integration_events", "activity_logs", "audit_logs", "settings"], deliveryStatus: "PLANNED", deliveryMode: "governance",
    features: "System health dashboard | API health | Database health | Integration health | Message-queue health | Failed-job queue | Retry controls | Error logging | Performance monitoring | Audit-log monitoring | Usage monitoring | AI and API cost monitoring | Hosting-cost monitoring | Storage monitoring | Failed-payment monitoring | SMS and email delivery monitoring | Laboratory-interface failures | Claim-interface failures | Backup status | Incident status | Maintenance notices | Service-status page | Rollback support | Version history | Deployment history | Feature-flag rollback | Manual fallback workflows",
  }),
  section({
    number: 38, slug: "high-design-ux", title: "High-Design User Experience",
    mandate: "Deliver an accessible, premium, responsive healthcare interface with complete operational states.",
    ownerRoles: ["design", "product", "accessibility_reviewer"], interfaceRoute: "/dashboard",
    databaseObjects: ["settings", "activity_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Premium healthcare SaaS appearance | Modern sidebar | Top navigation | Role-specific workspaces | Clean typography | White and soft-gray foundation | Navy and black text | Refined healthcare accent colors | Rounded cards | Clear status badges | Risk badges | Sticky patient header | Clinical timeline | Polished tables | Search | Filters | Saved views | Bulk actions | Keyboard navigation | Responsive desktop | Tablet support | Mobile support | Accessible color contrast | Screen-reader support | Elegant empty states | Loading states | Error states | Confirmation dialogs | Undo where safe | Guided onboarding | Contextual help | Demo walkthrough | Print-friendly chart views",
  }),
  section({
    number: 39, slug: "core-data-objects", title: "Required Core Data Objects",
    mandate: "Maintain explicit persistence architecture for every required healthcare, operational, network, revenue, and governance object.",
    ownerRoles: ["engineering", "data_architect", "security_officer"], interfaceRoute: "/feature-registry",
    databaseObjects: ["all canonical ClinicOS tables"], deliveryStatus: "FOUNDATION", deliveryMode: "governance",
    features: "organizations | locations | departments | facilities | users | roles | permissions | providers | provider_credentials | network_connections | data_sharing_agreements | patients | patient_identifiers | patient_matches | patient_contacts | emergency_contacts | patient_insurance | patient_pharmacies | patient_preferences | consents | access_grants | record_requests | appointments | appointment_types | provider_availability | rooms | resources | check_ins | waitlist | encounters | soap_notes | clinical_notes | note_templates | smart_phrases | vitals | allergies | medications | medication_reconciliations | refill_requests | prescriptions | medication_warnings | medication_events | problems | diagnoses | procedures | orders | referrals | immunizations | care_plans | patient_instructions | documents | document_categories | document_reviews | form_templates | form_submissions | signatures | lab_orders | lab_results | lab_result_items | imaging_orders | imaging_results | billing_accounts | superbills | claims | claim_lines | payments | payment_links | invoices | patient_balances | denials | remittances | insurance_verifications | prior_authorizations | nofault_cases | workers_comp_cases | case_documents | case_tasks | case_packets | quality_measures | quality_gaps | patient_quality_status | outreach_campaigns | message_threads | messages | call_logs | sms_logs | email_logs | tasks | escalations | notifications | ai_summaries | ai_classifications | ai_drafts | ai_reviews | audit_logs | activity_logs | integrations | integration_events | api_keys | settings | subscriptions",
  }),
  section({
    number: 40, slug: "definition-of-complete", title: "Day-One Definition of Complete",
    mandate: "Prevent screen-only, dead, untested, undocumented, insecure, or misleading feature claims.",
    ownerRoles: ["product", "engineering", "security_officer", "sales"], interfaceRoute: "/feature-registry",
    databaseObjects: ["feature_registry_sections", "feature_registry_capabilities"], deliveryStatus: "GOVERNED", deliveryMode: "governance",
    features: "Defined user and purpose | Visible interface | Database model | Access and permission rules | Audit logging | Validation | Error and recovery behavior | Manual fallback | Integration contract where needed | Automated or documented testing | Demo data | Documentation | Security review | Acceptance criteria",
  }),
  section({
    number: 41, slug: "virtual-care-teams", title: "Virtual Care Teams and Care Team Rooms",
    mandate: "Let authorized clinicians and coordinators work as one accountable care team across organization boundaries.",
    ownerRoles: ["provider", "case_manager", "referral_coordinator", "patient"], interfaceRoute: "/care-teams",
    databaseObjects: ["care_team_rooms", "care_team_members", "messages", "documents", "tasks", "care_plans", "audit_logs"], deliveryStatus: "PLANNED", deliveryMode: "native",
    features: "Care Team Room | Cross-organization care team | Care-team member role | Represented organization | Shared care plan | Team notes | Team messages | Team documents | Team tasks | Referral-formed care team | Episode-formed care team | Patient-selected care participants | Care-team invitation | Care-team acceptance | Care-team removal | Minimum-necessary team access | Team activity timeline | Team handoff | Team alert | Team audit history | Care Constellation network graph",
  }),
  section({
    number: 42, slug: "diagnostic-capacity-exchange", title: "Diagnostic Capacity Exchange",
    mandate: "Match authorized orders to verified diagnostic capacity without hiding payer, urgency, provenance, or manual fallback.",
    ownerRoles: ["provider", "referral_coordinator", "scheduler", "diagnostic_partner"], interfaceRoute: "/capacity-exchange",
    databaseObjects: ["capacity_listings", "facilities", "imaging_orders", "lab_orders", "referrals", "appointments", "network_connections"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Diagnostic capacity search | Open-slot publishing | Modality filter | Test filter | Body-part filter | Location filter | Distance filter | Insurance filter | No-fault filter | Workers compensation filter | Urgency filter | Earliest-available ranking | Verified diagnostic facility | Capacity reservation request | Capacity acceptance | Capacity rejection | Cross-clinic scheduling | Patient scheduling confirmation | Order packet transfer | Authorization status | Diagnostic appointment tracking | Travel-booking-style comparison | Manual phone fallback | Failed reservation recovery | Capacity Exchange audit history",
  }),
  section({
    number: 43, slug: "injury-episode-room", title: "Injury Episode Room",
    mandate: "Coordinate clinical, legal, payer, diagnostic, document, deadline, and revenue work around one injury episode.",
    ownerRoles: ["case_manager", "provider", "biller", "external_partner"], interfaceRoute: "/injury-episodes",
    databaseObjects: ["episode_rooms", "nofault_cases", "workers_comp_cases", "case_documents", "case_tasks", "case_packets", "claims"], deliveryStatus: "DEMO", deliveryMode: "manual-fallback",
    features: "Injury Episode Room | Accident summary | Claim summary | Carrier participant | Adjuster participant | Attorney participant | Diagnostic participant | Treating-provider participant | Injured body-part map | Treatment timeline | Imaging status | Missing-document checklist | Deadline board | Authorization status | Billing status | Packet readiness | Claim readiness score | Responsible-person indicator | Next-action indicator | Episode risk status | Episode collaboration log | External participant access boundary | Episode export | Episode audit history",
  }),
  section({
    number: 44, slug: "coding-revenue-intelligence", title: "Medical Coding and Revenue Intelligence",
    mandate: "Prepare explainable coding and claim-readiness guidance while preserving coder and provider approval authority.",
    ownerRoles: ["provider", "biller", "revenue_cycle_manager", "coding_reviewer"], interfaceRoute: "/claim-readiness",
    databaseObjects: ["encounters", "diagnoses", "procedures", "superbills", "claims", "claim_lines", "denials", "ai_drafts", "ai_reviews"], deliveryStatus: "PLANNED", deliveryMode: "governance",
    features: "Coding copilot | ICD-10 suggestion draft | CPT suggestion draft | Modifier suggestion draft | Documentation-support check | Medical-necessity checklist | Claim readiness score | Missing provider signature detection | Missing diagnosis support detection | Missing authorization detection | Missing result attachment detection | Claim edit explanation | Denial pattern intelligence | Appeal packet preparation | Revenue leakage detection | Under-coding review flag | Over-coding risk flag | Human coding approval | Provider attestation | Explainable recommendation | Coding provenance | Coding version history | No autonomous claim decision | Claim Readiness progress meter",
  }),
  section({
    number: 45, slug: "medical-knowledge-engine", title: "Medical Knowledge Engine",
    mandate: "Serve governed, provenance-rich knowledge through trusted, network, and organization-specific layers.",
    ownerRoles: ["medical_director", "knowledge_reviewer", "provider", "administrator"], interfaceRoute: "/knowledge",
    databaseObjects: ["knowledge_items", "knowledge_reviews", "documents", "settings", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "governance",
    features: "Trusted-reference knowledge layer | Network-approved knowledge layer | Organization-specific knowledge layer | Knowledge source provenance | Source publication date | Source effective date | Knowledge version | Review status | Clinical reviewer | Review date | Expiration date | Superseded-content status | Knowledge search | Contextual retrieval | Citation display | Organization policy overlay | Conflict warning | Knowledge correction workflow | Knowledge rollback | Knowledge-access audit | No unreviewed clinical authority | Human interpretation requirement",
  }),
  section({
    number: 46, slug: "governed-learning", title: "Governed Learning Engine",
    mandate: "Improve workflows only from authorized, reviewed feedback without silently changing clinical or legal behavior.",
    ownerRoles: ["medical_director", "ai_reviewer", "security_officer", "product"], interfaceRoute: "/ai-assistants",
    databaseObjects: ["ai_reviews", "ai_drafts", "activity_logs", "audit_logs", "settings"], deliveryStatus: "GOVERNED", deliveryMode: "governance",
    features: "Approved-feedback learning | Rejected-output learning signal | Human correction capture | Organization-scoped learning | Network-scoped approved learning | Model-version tracking | Prompt-version tracking | Evaluation dataset | Synthetic test cases | Regression evaluation | Safety evaluation | Bias review | Rollback threshold | Learning change approval | Learning release note | No silent policy learning | No autonomous diagnosis learning | No autonomous prescribing learning | No hidden cross-tenant learning | Learning audit history",
  }),
  section({
    number: 47, slug: "health-passport-consent-wallet", title: "Health Passport and Consent Wallet",
    mandate: "Give patients a portable, understandable record and fine-grained control over authorized sharing.",
    ownerRoles: ["patient", "patient_proxy", "privacy_officer", "provider"], interfaceRoute: "/health-passport",
    databaseObjects: ["health_passports", "consent_wallets", "consents", "access_grants", "record_requests", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Health Passport | Consent Wallet | Portable identity summary | Portable medication list | Portable allergy list | Portable problem list | Portable immunization list | Portable care-plan summary | Emergency summary | Patient-selected data bundle | Patient-selected receiving organization | Purpose-of-use approval | Time-limited consent | Category-limited consent | Consent withdrawal | Sharing receipt | QR presentation roadmap | Wallet recovery | Proxy management | Patient-visible access history | Correction request | Downloadable approved record | Source provenance | Expiration alert | Emergency-access preference",
  }),
  section({
    number: 48, slug: "universal-intake-passport", title: "Universal Intake Passport",
    mandate: "Let patients reuse verified intake information while requiring review, freshness, consent, and clinic-specific additions.",
    ownerRoles: ["patient", "front_desk", "provider", "privacy_officer"], interfaceRoute: "/intake-passport",
    databaseObjects: ["intake_passports", "form_submissions", "patient_preferences", "consents", "documents"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Universal Intake Passport | Reusable demographics | Reusable insurance | Reusable pharmacy | Reusable medication history | Reusable allergy history | Reusable surgical history | Reusable family history | Reusable social history | Patient confirmation date | Field freshness indicator | Field-level reuse consent | Clinic-specific supplemental questions | Conditional intake additions | Changed-answer highlighting | Source submission link | Staff review | Provider review | Patient correction | Version history | Mobile intake reuse | Manual form fallback | Intake Passport audit history",
  }),
  section({
    number: 49, slug: "care-handoffs", title: "Real-Time Collaboration and Care Handoffs",
    mandate: "Make every transfer of responsibility explicit, acknowledged, time-bound, and recoverable.",
    ownerRoles: ["provider", "nurse", "medical_assistant", "case_manager"], interfaceRoute: "/care-teams",
    databaseObjects: ["care_handoffs", "tasks", "messages", "notifications", "escalations", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Structured care handoff | Sending clinician | Receiving clinician | Represented organization | Patient context | Situation summary | Background summary | Assessment summary draft | Requested action | Due time | Priority | Handoff acceptance | Handoff rejection | Clarification request | Read receipt | Acknowledgment timer | Overdue escalation | Shift handoff | Referral handoff | Discharge handoff | Diagnostic-result handoff | Responsibility transfer | Handoff resolution | Handoff audit trail",
  }),
  section({
    number: 50, slug: "capacity-marketplace", title: "Cross-Clinic Scheduling and Capacity Marketplace",
    mandate: "Expose approved clinical capacity across the network without bypassing eligibility, authorization, or clinic control.",
    ownerRoles: ["scheduler", "location_manager", "provider", "network_partner"], interfaceRoute: "/capacity-exchange",
    databaseObjects: ["capacity_listings", "provider_availability", "rooms", "resources", "appointments", "network_connections"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Cross-clinic availability | Provider capacity listing | Room capacity listing | Equipment capacity listing | Diagnostic capacity listing | Specialty capacity listing | Telemedicine capacity listing | Capacity eligibility rule | Capacity payer rule | Capacity geographic rule | Capacity request | Capacity hold | Capacity expiration | Capacity booking | Capacity cancellation | Capacity waitlist | Network transfer confirmation | Referral-linked booking | Capacity utilization analytics | Capacity marketplace audit history",
  }),
  section({
    number: 51, slug: "patient-navigation-agent", title: "Patient Navigation Agent",
    mandate: "Help patients complete approved administrative next steps while escalating clinical, emergency, insurance, and dispute questions.",
    ownerRoles: ["patient", "front_desk", "care_navigator", "provider"], interfaceRoute: "/patient-navigation",
    databaseObjects: ["tasks", "appointments", "referrals", "messages", "notifications", "ai_drafts", "ai_reviews"], deliveryStatus: "FOUNDATION", deliveryMode: "governance",
    features: "Patient journey guidance | Next administrative step | Appointment guidance | Intake guidance | Insurance-document guidance | Referral guidance | Lab scheduling guidance | Imaging scheduling guidance | Payment guidance | Follow-up reminder | Transportation-resource handoff | Language-aware navigation | Accessibility-aware navigation | Human navigator handoff | Emergency escalation | Medical-question escalation | Insurance no-guarantee script | Progress checklist | Patient acknowledgment | Navigation audit history",
  }),
  section({
    number: 52, slug: "provider-consultation-marketplace", title: "Provider Consultation Marketplace",
    mandate: "Connect verified providers for documented consultation while preserving credential, consent, compensation, and clinical responsibility boundaries.",
    ownerRoles: ["provider", "medical_director", "credentialing_manager", "administrator"], interfaceRoute: "/provider-network",
    databaseObjects: ["provider_consultations", "providers", "provider_credentials", "network_connections", "messages", "documents"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Verified-provider directory | Consultation availability | Specialty search | Subspecialty search | State-license filter | Telemedicine-eligibility filter | Accepted-payer filter | Consultation request | Clinical question | Supporting packet | Consultation acceptance | Consultation decline | Consultation scheduling | Provider-to-provider secure room | Consultation note | Return recommendation | Requesting-provider responsibility | Consultant credential snapshot | Compensation adapter roadmap | Consultation closure | Consultation audit history",
  }),
  section({
    number: 53, slug: "medspa-rewards-ecosystem", title: "Med-Spa Rewards and Allē-Ready Ecosystem",
    mandate: "Support med-spa loyalty and manufacturer programs through explicit adapters without claiming unavailable vendor connectivity.",
    ownerRoles: ["clinic_owner", "front_desk", "provider", "growth_manager"], interfaceRoute: "/luxe-medi",
    databaseObjects: ["subscriptions", "payments", "appointments", "inventory_items", "integrations", "activity_logs"], deliveryStatus: "VENDOR_DEPENDENT", deliveryMode: "adapter-ready",
    features: "Clinic loyalty profile | Rewards balance display adapter | Rewards enrollment status | Manufacturer-program adapter | Allē-ready integration contract | Offer eligibility review | Promotion disclosure | Service-package linkage | Membership benefit linkage | Treatment-session linkage | Patient consent | Vendor acknowledgment | Failed-sync queue | Manual rewards fallback | No unsupported rewards claim | Rewards audit history",
  }),
  section({
    number: 54, slug: "inventory-supply-intelligence", title: "Inventory and Supply Intelligence",
    mandate: "Track clinical and med-spa inventory, custody, expiration, use, replenishment, and cost with controlled automation.",
    ownerRoles: ["location_manager", "clinical_staff", "inventory_manager", "clinic_owner"], interfaceRoute: "/inventory",
    databaseObjects: ["inventory_items", "inventory_lots", "inventory_transactions", "procedures", "appointments", "tasks"], deliveryStatus: "PLANNED", deliveryMode: "native",
    features: "Inventory catalog | Location inventory | Lot number | Serial number | Expiration date | Quantity on hand | Reserved quantity | Reorder point | Unit cost | Vendor | Controlled-item flag | Cold-chain flag | Receipt transaction | Adjustment transaction | Procedure usage | Patient-linked usage where permitted | Waste documentation | Transfer between locations | Recall workflow | Expiration alert | Low-stock alert | Reorder recommendation | Purchase-order adapter | Inventory reconciliation | Inventory audit history",
  }),
  section({
    number: 55, slug: "credentialing-network", title: "Credentialing and Provider Network",
    mandate: "Keep provider identity, authority, affiliations, expirations, verification, and network eligibility current and reviewable.",
    ownerRoles: ["credentialing_manager", "medical_director", "administrator", "provider"], interfaceRoute: "/provider-network",
    databaseObjects: ["providers", "provider_credentials", "facilities", "network_connections", "documents", "tasks"], deliveryStatus: "PLANNED", deliveryMode: "adapter-ready",
    features: "Credentialing profile | Primary-source verification status | NPI verification | License verification | DEA verification | Sanction-screening adapter | Malpractice coverage | Facility privilege | Hospital affiliation | Supervising relationship | Credential expiration queue | Renewal task | Credential document | Verification evidence | Network eligibility | Consultation eligibility | Prescribing eligibility | Telemedicine state eligibility | Credential exception review | Credentialing audit history",
  }),
  section({
    number: 56, slug: "pharmacy-network", title: "Connected Pharmacy Network",
    mandate: "Coordinate pharmacy selection, prescription transmission, status, clarification, prior authorization, and fallback under provider control.",
    ownerRoles: ["provider", "clinical_staff", "patient", "pharmacy_partner"], interfaceRoute: "/medications",
    databaseObjects: ["patient_pharmacies", "medications", "refill_requests", "prescriptions", "medication_warnings", "medication_events", "clinical_orders", "prior_authorizations", "messages", "integrations", "integration_events", "tasks", "audit_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Verified-pharmacy directory | Preferred pharmacy | Pharmacy hours | Pharmacy location | Electronic prescribing adapter | Prescription transmission status | Pharmacy acknowledgment | Clarification request | Prior-authorization status | Formulary response | Refill status | Medication availability signal roadmap | Alternate pharmacy request | Failed transmission queue | Manual prescription fallback | EPCS boundary | PDMP boundary | Provider approval | Pharmacy communication audit history",
  }),
  section({
    number: 57, slug: "laboratory-network", title: "Connected Laboratory Network",
    mandate: "Coordinate verified laboratory capacity, orders, collection, structured results, provenance, review, release, and interface recovery.",
    ownerRoles: ["provider", "lab_reviewer", "referral_coordinator", "laboratory_partner"], interfaceRoute: "/labs",
    databaseObjects: ["facilities", "lab_orders", "lab_results", "lab_result_items", "capacity_listings", "integrations", "integration_events"], deliveryStatus: "VENDOR_DEPENDENT", deliveryMode: "adapter-ready",
    features: "Verified laboratory directory | Laboratory capability profile | Collection-site capacity | Mobile phlebotomy roadmap | Electronic order adapter | Order acknowledgment | Specimen status | Result acknowledgment | Structured-result normalization | Corrected-result handling | Critical-result escalation | Result provenance | Ordering-clinic routing | Connected-clinic result sharing | Interface failure queue | Manual result fallback | Laboratory performance analytics | Laboratory network audit history",
  }),
  section({
    number: 58, slug: "remote-monitoring-wearables", title: "Home Health, Remote Monitoring, and Wearables",
    mandate: "Ingest consented home observations through governed adapters without treating device data as autonomous clinical judgment.",
    ownerRoles: ["patient", "provider", "care_manager", "home_health_partner"], interfaceRoute: "/remote-monitoring",
    databaseObjects: ["remote_observations", "patients", "care_plans", "tasks", "escalations", "integrations"], deliveryStatus: "FOUNDATION", deliveryMode: "adapter-ready",
    features: "Remote monitoring enrollment | Device consent | Device registry | Wearable adapter | Home blood-pressure observation | Home glucose observation | Home weight observation | Pulse-oximetry observation | Symptom check-in | Patient-entered observation | Device-entered observation | Observation provenance | Observation quality flag | Threshold configured by provider | Review queue | Missed-reading task | Human-reviewed escalation | Care-plan linkage | Device disconnection alert | Manual observation fallback | Remote monitoring audit history",
  }),
  section({
    number: 59, slug: "emergency-bridge", title: "Emergency and Urgent-Care Bridge",
    mandate: "Recognize urgent administrative signals, stop routine automation, provide approved emergency language, and create a visible human escalation.",
    ownerRoles: ["all_staff", "provider", "patient", "care_navigator"], interfaceRoute: "/urgent-bridge",
    databaseObjects: ["escalations", "notifications", "messages", "call_logs", "care_handoffs", "audit_logs"], deliveryStatus: "GOVERNED", deliveryMode: "governance",
    features: "Emergency phrase detection | Urgent symptom phrase detection | Stop routine automation | 911 and emergency-room script | Urgent staff alert | Urgent provider alert | Acknowledgment requirement | Escalation timer | Failed-contact escalation | Emergency contact display | Patient location prompt | No autonomous triage | No diagnosis | No treatment advice | Urgent handoff | Resolution note | False-positive review | Emergency bridge audit history",
  }),
  section({
    number: 60, slug: "network-growth", title: "Connected-Care Network Growth",
    mandate: "Grow the verified network through measurable invitations, onboarding, service coverage, and trusted participation controls.",
    ownerRoles: ["clinic_owner", "network_manager", "sales", "customer_success"], interfaceRoute: "/network",
    databaseObjects: ["organizations", "facilities", "network_connections", "subscriptions", "activity_logs"], deliveryStatus: "PLANNED", deliveryMode: "native",
    features: "Invite clinic | Invite provider | Referral-partner invitation | Diagnostic-partner invitation | Laboratory-partner invitation | Pharmacy-partner invitation | Hospital-partner invitation | Network application | Verification queue | Participation agreement | Coverage map | Specialty-gap map | Geographic-gap map | Referral-volume insight | Connection activation | Connection suspension | Network service-level monitoring | Network adoption analytics | Network value report | Network growth audit history",
  }),
  section({
    number: 61, slug: "voice-first-assistant", title: "Voice-First ClinicOS Copilot",
    mandate: "Let authorized users speak wherever safe instead of typing, with visible transcription, confirmation, safety routing, and a complete manual fallback.",
    ownerRoles: ["patient", "all_staff", "provider", "clinic_owner"], interfaceRoute: "/voice-assistant",
    databaseObjects: ["voice_sessions", "ai_drafts", "ai_reviews", "messages", "tasks", "audit_logs"], deliveryStatus: "DEMO", deliveryMode: "adapter-ready",
    features: "Push-to-talk input | Start and stop recording | Live listening state | Live waveform | Partial transcript | Final transcript | Transcript editing | Confirm before sending | Cancel recording | Re-record | Keyboard fallback | Voice search | Voice command bar | Voice message draft | Voice intake completion | Provider dictation draft | Front-desk voice command | Patient portal voice request | Owner voice query | Language selection | Accessibility labels | Microphone permission handling | Unsupported-browser handling | Network-failure recovery | Speaker label | Transcription provenance | Transcription confidence | Retention control | No ambient recording by default | Recording disclosure | Consent check | Emergency-language detection | Medical-question routing | Human review gate | Voice-agent human handoff | Voice action audit history | Approved transcription-vendor adapter | Browser voice demo with synthetic data only",
  }),
  section({
    number: 62, slug: "design-system", title: "ClinicOS Premium Design System",
    mandate: "Make status, responsibility, next action, risk, provenance, and audit history legible through a calm luxury-grade healthcare command center.",
    ownerRoles: ["design", "product", "accessibility_reviewer", "all_users"], interfaceRoute: "/design-system",
    databaseObjects: ["settings", "organizations", "locations", "activity_logs"], deliveryStatus: "FOUNDATION", deliveryMode: "native",
    features: "Apple-level calm | Hospital command-center clarity | Luxury med-spa polish | Medical Mode | Luxe Mode | Network Mode | White and pearl-gray foundation | Deep navy and charcoal typography | Soft clinical-blue accent | Champagne Luxe accent | Dark network command-center option | Spacious layout | Rounded cards | Refined shadows | Thin dividers | Clear status badges | Clear risk badges | Smooth purposeful transitions | LifeChart Timeline | Care Constellation | ClosedLoop Referrals | Command Center | Injury Episode Room | Claim Readiness | Capacity Exchange | ClinicOS Copilot command bar | ClinicOS Flow View | Current-status indicator | Responsible-person indicator | Next-action indicator | Risk-level indicator | Audit-trail indicator | Owner role workspace | Provider role workspace | Front-desk role workspace | Patient mobile-first workspace | Responsive desktop | Tablet quick actions | Mobile quick actions | Accessible contrast | Screen-reader support | Keyboard navigation | Print-friendly clinical view | No clutter | No outdated hospital-software aesthetic",
  }),
];

export function slugifyRegistryValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function canonicalCapabilityId(sectionNumber: number, feature: string) {
  return `p0-${String(sectionNumber).padStart(2, "0")}-${slugifyRegistryValue(feature)}`;
}

export function buildCompletionPlan(section: CanonicalRegistrySection, feature: string): Record<CompletionGateKey, string> {
  const dataObjects = section.databaseObjects.join(", ");
  const roles = section.ownerRoles.join(", ");
  return {
    userAndPurpose: `${roles}: ${feature} is a required ${section.title} capability.`,
    visibleInterface: `${section.interfaceRoute} must expose ${feature} with role-appropriate empty, loading, success, and error states.`,
    databaseArchitecture: `${feature} must persist through ${dataObjects} or an explicitly versioned adapter contract.`,
    accessAndPermissions: `${feature} requires least-privilege rules for ${roles}, tenant scope, and minimum-necessary access where patient data is involved.`,
    auditLogging: `Access, mutation, export, sharing, approval, and failure events for ${feature} must be attributable and timestamped.`,
    validation: `${feature} requires server-side schema, tenant, lifecycle, and domain validation before persistence or transmission.`,
    errorRecovery: `${feature} must show actionable errors, preserve work safely, and support retry or staff escalation.`,
    manualFallback: `${feature} remains visible with a documented staff workflow when automation or a vendor connection is unavailable.`,
    integrationContract: `${feature} requires a versioned interface, acknowledgment, provenance, and failure contract when external systems are involved.`,
    testing: `${feature} requires permission, tenant-isolation, validation, failure, recovery, and representative workflow coverage.`,
    demoData: `${feature} must be demonstrable with synthetic records and no real PHI.`,
    documentation: `${feature} must be represented in product, API, operational, and sales documentation without overstating live connectivity.`,
    securityReview: `${feature} requires data classification, threat review, retention review, and vendor or BAA review where applicable.`,
    acceptanceCriteria: `${feature} is complete only when it is implemented, connected, permissioned, audited, recoverable, tested, documented, and demonstrated.`,
  };
}

export const canonicalCapabilityCount = clinicOsDayOneRegistry.reduce((total, entry) => total + entry.features.length, 0);
