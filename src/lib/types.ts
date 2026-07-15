export type RiskLevel = "Normal" | "Needs Staff" | "Needs Provider" | "Urgent" | "Do Not Automate";
export type AppointmentStatus =
  | "Requested"
  | "Pending Confirmation"
  | "Confirmed"
  | "Checked In"
  | "In Room"
  | "With Provider"
  | "Checkout"
  | "Completed"
  | "Cancelled"
  | "No Show"
  | "Rescheduled";

export interface Organization {
  id: string;
  name: string;
  type: "Primary Care" | "Med Spa";
  locations: string[];
}

export interface Patient {
  id: string;
  organizationId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  initials: string;
  dob: string;
  age: number;
  sex: string;
  pronouns: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  insurance: string;
  plan: string;
  memberId: string;
  copay: number;
  balance: number;
  portalStatus: "Active" | "Invited" | "Inactive";
  riskLevel: RiskLevel;
  riskFlags: string[];
  nextAppointment: string;
  provider: string;
  location: string;
  allergies: string[];
  medications: string[];
  problems: string[];
  lastVisit: string;
}

export interface Appointment {
  id: string;
  organizationId: string;
  patientId: string;
  patient: string;
  initials: string;
  time: string;
  endTime: string;
  date: string;
  type: string;
  provider: string;
  location: string;
  status: AppointmentStatus;
  telemedicine: boolean;
  formsComplete: boolean;
  insuranceVerified: boolean;
  paymentDue: number;
  startsAt: string;
  endsAt: string;
}

export interface EncounterAuditEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface Encounter {
  id: string;
  organizationId: string;
  patientId: string;
  date: string;
  type: string;
  provider: string;
  patientName: string;
  patientInitials: string;
  patientMrn: string;
  status: "Draft" | "Ready for Review" | "Signed" | "Locked" | "Addendum Needed";
  chiefComplaint: string;
  hpi: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnoses: Array<{ code: string; label: string }>;
  procedures: Array<{ code: string; label: string }>;
  patientInstructions: string;
  followUp: string;
  requiresCosignature: boolean;
  auditHistory: EncounterAuditEvent[];
}

export interface LabResult {
  id: string;
  patientId: string;
  patient: string;
  panel: string;
  vendor: string;
  collectedAt: string | null;
  resultedAt: string;
  abnormalCount: number;
  critical: boolean;
  reviewStatus: "Needs Review" | "Reviewed" | "Released" | "Corrected";
  patientVisible: boolean;
  source: string;
  sourceReference: string | null;
  version: number;
  correctionOfId: string | null;
  items: Array<{
    id: string;
    name: string;
    value: string;
    unit: string | null;
    range: string | null;
    flag: string | null;
    critical: boolean;
  }>;
}

export interface PatientImagingResult {
  id: string;
  patientId: string;
  title: string;
  study: string;
  modality: string;
  bodyPart: string;
  facility: string;
  source: string;
  sourceReference: string | null;
  findings: string | null;
  impression: string | null;
  imageReference: string | null;
  studyPerformedAt: string;
  status: string;
  urgentSourceFlag: boolean;
  patientVisible: boolean;
  version: number;
  correctionOfId: string | null;
}

export interface Claim {
  id: string;
  patient: string;
  payer: string;
  serviceDate: string;
  amount: number;
  status: "Draft" | "Ready for Review" | "Submitted" | "Accepted" | "Rejected" | "Denied" | "Paid" | "Patient Balance" | "Appealed" | "Closed";
  issue?: string;
}

export interface QualityGap {
  id: string;
  patient: string;
  measure: string;
  due: string;
  status: "Open" | "Outreach" | "Scheduled" | "Closed";
  impact: "High" | "Medium" | "Low";
}

export interface WorkTask {
  id: string;
  title: string;
  patient?: string;
  owner: string;
  due: string;
  priority: "Urgent" | "High" | "Normal";
  category: "Clinical" | "Front Desk" | "Billing" | "Quality" | "Case";
  status: "Open" | "In Progress" | "Complete";
}

export interface TimelineEvent {
  id: string;
  type: "encounter" | "lab" | "imaging" | "message" | "document" | "billing" | "task";
  title: string;
  detail: string;
  timestamp: string;
  status?: string;
}

export interface WorkflowDecision {
  category: string;
  riskLevel: RiskLevel;
  requiresHumanReview: boolean;
  assignedTeam: "Front Desk" | "Provider" | "Billing" | "Quality" | "Case Management";
  action: string;
  blockedFromAutoSend: boolean;
  emergencyMessage?: string;
  safetyMessage?: string;
}
