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
}

export interface Encounter {
  id: string;
  patientId: string;
  date: string;
  type: string;
  provider: string;
  status: "Draft" | "Ready for Review" | "Signed" | "Locked" | "Addendum Needed";
  chiefComplaint: string;
  hpi: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnoses: Array<{ code: string; label: string }>;
  procedures: Array<{ code: string; label: string }>;
  followUp: string;
  requiresCosignature: boolean;
}

export interface LabResult {
  id: string;
  patientId: string;
  patient: string;
  panel: string;
  vendor: string;
  collectedAt: string;
  resultedAt: string;
  abnormalCount: number;
  reviewStatus: "Needs Review" | "Reviewed" | "Released";
  patientVisible: boolean;
  items: Array<{ name: string; value: string; unit: string; range: string; flag?: "High" | "Low" }>;
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
  type: "encounter" | "lab" | "message" | "document" | "billing" | "task";
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
