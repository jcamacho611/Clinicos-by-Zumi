import type {
  Appointment,
  Claim,
  Encounter,
  LabResult,
  Organization,
  Patient,
  QualityGap,
  TimelineEvent,
  WorkTask,
} from "@/lib/types";

export const organizations: Organization[] = [
  { id: "org-bfm", name: "Brooklyn Family Medicine", type: "Primary Care", locations: ["Brooklyn Heights", "Crown Heights"] },
  { id: "org-luxe", name: "Luxe Medi", type: "Med Spa", locations: ["Midtown Manhattan"] },
];

export const patients: Patient[] = [
  {
    id: "pt-1001", mrn: "BFM-28419", firstName: "Maya", lastName: "Thompson", initials: "MT", dob: "1985-09-12", age: 40,
    sex: "Female", pronouns: "she/her", phone: "(917) 555-0142", email: "maya.thompson@example.test", preferredLanguage: "English",
    insurance: "Healthfirst", plan: "Essential Plan 3", memberId: "HF-TEST-40218", copay: 25, balance: 75, portalStatus: "Active",
    riskLevel: "Needs Provider", riskFlags: ["Abnormal A1C", "Penicillin allergy"], nextAppointment: "Today, 10:30 AM", provider: "Nadja R., NP",
    location: "Brooklyn Heights", allergies: ["Penicillin - hives"], medications: ["Metformin 500 mg BID", "Lisinopril 10 mg daily"],
    problems: ["Type 2 diabetes", "Essential hypertension"], lastVisit: "Jun 18, 2026",
  },
  {
    id: "pt-1002", mrn: "BFM-28104", firstName: "Darius", lastName: "Coleman", initials: "DC", dob: "1972-02-07", age: 54,
    sex: "Male", pronouns: "he/him", phone: "(718) 555-0188", email: "darius.coleman@example.test", preferredLanguage: "English",
    insurance: "EmblemHealth", plan: "GHI CBP", memberId: "EMB-TEST-90116", copay: 30, balance: 0, portalStatus: "Active",
    riskLevel: "Normal", riskFlags: [], nextAppointment: "Jul 21, 9:00 AM", provider: "Nadja R., NP", location: "Crown Heights",
    allergies: ["No known drug allergies"], medications: ["Atorvastatin 20 mg nightly"], problems: ["Hyperlipidemia"], lastVisit: "May 02, 2026",
  },
  {
    id: "pt-1003", mrn: "BFM-29011", firstName: "Elena", lastName: "Rivera", initials: "ER", dob: "1993-11-21", age: 32,
    sex: "Female", pronouns: "she/her", phone: "(347) 555-0109", email: "elena.rivera@example.test", preferredLanguage: "Spanish",
    insurance: "MetroPlus", plan: "GoldPlus", memberId: "MP-TEST-33981", copay: 15, balance: 40, portalStatus: "Invited",
    riskLevel: "Needs Staff", riskFlags: ["Forms incomplete"], nextAppointment: "Today, 11:15 AM", provider: "Dr. Samuel Lee", location: "Brooklyn Heights",
    allergies: ["Latex - rash"], medications: ["Albuterol HFA as needed"], problems: ["Mild intermittent asthma"], lastVisit: "New patient",
  },
  {
    id: "pt-1004", mrn: "LUX-10428", firstName: "Camille", lastName: "Brooks", initials: "CB", dob: "1989-05-15", age: 37,
    sex: "Female", pronouns: "she/her", phone: "(646) 555-0165", email: "camille.brooks@example.test", preferredLanguage: "English",
    insurance: "Self Pay", plan: "Luxe Membership", memberId: "N/A", copay: 0, balance: 350, portalStatus: "Active",
    riskLevel: "Normal", riskFlags: [], nextAppointment: "Today, 2:00 PM", provider: "Nadja R., NP", location: "Midtown Manhattan",
    allergies: ["No known drug allergies"], medications: [], problems: ["Weight management program"], lastVisit: "Jun 30, 2026",
  },
  {
    id: "pt-1005", mrn: "BFM-27618", firstName: "Anthony", lastName: "Nguyen", initials: "AN", dob: "1966-01-31", age: 60,
    sex: "Male", pronouns: "he/him", phone: "(917) 555-0124", email: "anthony.nguyen@example.test", preferredLanguage: "English",
    insurance: "Aetna", plan: "Open Access", memberId: "AET-TEST-77241", copay: 35, balance: 110, portalStatus: "Inactive",
    riskLevel: "Urgent", riskFlags: ["BP follow-up overdue", "Open care gaps"], nextAppointment: "Not scheduled", provider: "Dr. Samuel Lee", location: "Crown Heights",
    allergies: ["Sulfa - swelling"], medications: ["Amlodipine 10 mg daily"], problems: ["Uncontrolled hypertension"], lastVisit: "Mar 11, 2026",
  },
];

export const appointments: Appointment[] = [
  { id: "apt-1", patientId: "pt-1001", patient: "Maya Thompson", initials: "MT", time: "9:00 AM", endTime: "9:30 AM", date: "Today", type: "Diabetes follow-up", provider: "Nadja R., NP", location: "Brooklyn Heights", status: "Checked In", telemedicine: false, formsComplete: true, insuranceVerified: true, paymentDue: 25 },
  { id: "apt-2", patientId: "pt-1003", patient: "Elena Rivera", initials: "ER", time: "9:45 AM", endTime: "10:30 AM", date: "Today", type: "New patient", provider: "Dr. Samuel Lee", location: "Brooklyn Heights", status: "In Room", telemedicine: false, formsComplete: false, insuranceVerified: false, paymentDue: 15 },
  { id: "apt-3", patientId: "pt-1002", patient: "Darius Coleman", initials: "DC", time: "10:45 AM", endTime: "11:15 AM", date: "Today", type: "Annual wellness", provider: "Nadja R., NP", location: "Brooklyn Heights", status: "Confirmed", telemedicine: true, formsComplete: true, insuranceVerified: true, paymentDue: 30 },
  { id: "apt-4", patientId: "pt-1004", patient: "Camille Brooks", initials: "CB", time: "2:00 PM", endTime: "2:45 PM", date: "Today", type: "Weight management", provider: "Nadja R., NP", location: "Midtown Manhattan", status: "Confirmed", telemedicine: false, formsComplete: true, insuranceVerified: true, paymentDue: 350 },
];

export const encounters: Encounter[] = [
  {
    id: "enc-1001", patientId: "pt-1001", date: "Jul 14, 2026", type: "Diabetes follow-up", provider: "Nadja R., NP", status: "Draft",
    chiefComplaint: "Follow-up for diabetes and elevated home glucose readings.",
    hpi: "40-year-old patient returns for chronic care follow-up. Reports consistent medication use and increased thirst over the last two weeks. Denies acute distress.",
    subjective: "Home fasting readings reported between 145-170 mg/dL. Working on meal planning and walking three days per week.",
    objective: "BP 132/84, HR 76, Temp 98.4 F, Weight 171 lb, BMI 29.4. Alert and in no acute distress.",
    assessment: "Type 2 diabetes with above-goal recent A1C; hypertension currently controlled.",
    plan: "Provider to review medication plan. Reinforce nutrition and activity goals. Repeat A1C in 3 months. Return precautions reviewed.",
    diagnoses: [{ code: "E11.65", label: "Type 2 diabetes mellitus with hyperglycemia" }, { code: "I10", label: "Essential hypertension" }],
    procedures: [{ code: "99214", label: "Established patient office visit" }], followUp: "3 months or sooner as directed", requiresCosignature: false,
  },
];

export const labResults: LabResult[] = [
  {
    id: "lab-1", patientId: "pt-1001", patient: "Maya Thompson", panel: "Comprehensive metabolic + A1C", vendor: "Quest Diagnostics (demo)",
    collectedAt: "Jul 10, 2026", resultedAt: "Jul 11, 2026", abnormalCount: 2, reviewStatus: "Needs Review", patientVisible: false,
    items: [
      { name: "Hemoglobin A1C", value: "8.1", unit: "%", range: "< 7.0", flag: "High" },
      { name: "Glucose", value: "164", unit: "mg/dL", range: "65-99", flag: "High" },
      { name: "Creatinine", value: "0.82", unit: "mg/dL", range: "0.50-0.97" },
    ],
  },
  {
    id: "lab-2", patientId: "pt-1002", patient: "Darius Coleman", panel: "Lipid panel", vendor: "Labcorp (demo)", collectedAt: "Jul 08, 2026", resultedAt: "Jul 09, 2026", abnormalCount: 0, reviewStatus: "Reviewed", patientVisible: false,
    items: [{ name: "LDL", value: "88", unit: "mg/dL", range: "< 100" }],
  },
  {
    id: "lab-3", patientId: "pt-1003", patient: "Elena Rivera", panel: "CBC with differential", vendor: "BioReference (demo)", collectedAt: "Jul 12, 2026", resultedAt: "Jul 13, 2026", abnormalCount: 1, reviewStatus: "Released", patientVisible: true,
    items: [{ name: "Hemoglobin", value: "11.4", unit: "g/dL", range: "11.7-15.5", flag: "Low" }],
  },
];

export const claims: Claim[] = [
  { id: "CLM-72014", patient: "Maya Thompson", payer: "Healthfirst", serviceDate: "Jun 18, 2026", amount: 224, status: "Ready for Review" },
  { id: "CLM-71988", patient: "Darius Coleman", payer: "EmblemHealth", serviceDate: "Jun 02, 2026", amount: 315, status: "Submitted" },
  { id: "CLM-71802", patient: "Anthony Nguyen", payer: "Aetna", serviceDate: "May 18, 2026", amount: 428, status: "Denied", issue: "Missing modifier 25" },
  { id: "CLM-71739", patient: "Elena Rivera", payer: "MetroPlus", serviceDate: "May 12, 2026", amount: 196, status: "Paid" },
];

export const qualityGaps: QualityGap[] = [
  { id: "gap-1", patient: "Anthony Nguyen", measure: "Blood Pressure Control", due: "Overdue 34 days", status: "Open", impact: "High" },
  { id: "gap-2", patient: "Maya Thompson", measure: "Diabetes A1C Control", due: "Review today", status: "Scheduled", impact: "High" },
  { id: "gap-3", patient: "Darius Coleman", measure: "Colorectal Cancer Screening", due: "Due in 21 days", status: "Outreach", impact: "Medium" },
  { id: "gap-4", patient: "Elena Rivera", measure: "Depression Screening", due: "At next visit", status: "Scheduled", impact: "Low" },
];

export const tasks: WorkTask[] = [
  { id: "task-1", title: "Review abnormal A1C before release", patient: "Maya Thompson", owner: "Nadja R., NP", due: "Today, 10:15 AM", priority: "Urgent", category: "Clinical", status: "Open" },
  { id: "task-2", title: "Verify insurance and collect missing ID", patient: "Elena Rivera", owner: "Front Desk", due: "Before 9:45 AM", priority: "High", category: "Front Desk", status: "In Progress" },
  { id: "task-3", title: "Correct modifier on denied claim", patient: "Anthony Nguyen", owner: "Billing Team", due: "Today", priority: "High", category: "Billing", status: "Open" },
  { id: "task-4", title: "Call for BP follow-up outreach", patient: "Anthony Nguyen", owner: "Quality Team", due: "Today", priority: "High", category: "Quality", status: "Open" },
  { id: "task-5", title: "Complete no-fault narrative checklist", patient: "Jordan Kim", owner: "Case Team", due: "Tomorrow", priority: "Normal", category: "Case", status: "Open" },
];

export const patientTimeline: TimelineEvent[] = [
  { id: "tl-1", type: "lab", title: "A1C result received", detail: "Quest demo feed - 8.1%, flagged high and held for provider review.", timestamp: "Jul 11, 9:42 AM", status: "Needs review" },
  { id: "tl-2", type: "message", title: "Patient portal message", detail: "Patient asked whether the new result changes the upcoming visit.", timestamp: "Jul 11, 10:08 AM", status: "Routed to provider" },
  { id: "tl-3", type: "encounter", title: "Primary care follow-up", detail: "Chronic care visit completed with medication reconciliation.", timestamp: "Jun 18, 2:30 PM", status: "Signed" },
  { id: "tl-4", type: "billing", title: "Claim prepared", detail: "Healthfirst claim CLM-72014 is ready for biller review.", timestamp: "Jun 18, 4:12 PM", status: "Ready for review" },
  { id: "tl-5", type: "document", title: "Updated insurance card", detail: "Patient uploaded front and back images through the portal.", timestamp: "Jun 17, 7:44 PM", status: "Verified" },
];

export const imagingQueue = [
  { id: "img-1", patient: "Darius Coleman", study: "Chest X-ray, 2 views", facility: "Lenox Hill Radiology (demo)", ordered: "Jul 08", status: "Report received", review: "Needs review" },
  { id: "img-2", patient: "Elena Rivera", study: "Pelvic ultrasound", facility: "RadNet (demo)", ordered: "Jul 06", status: "Scheduled", review: "Pending" },
  { id: "img-3", patient: "Anthony Nguyen", study: "MRI lumbar spine", facility: "Hospital imaging (demo)", ordered: "Jun 29", status: "Reviewed", review: "Release approved" },
];

export const cases = [
  { id: "NF-2026-118", patient: "Jordan Kim", type: "No-Fault", accident: "Apr 19, 2026", carrier: "Demo Mutual", claim: "NF-DEMO-8812", adjuster: "Taylor M.", attorney: "Northline Legal", status: "Active", packet: 72, revenue: 6840, outstanding: 2180 },
  { id: "WC-2026-041", patient: "Rosa Patel", type: "Workers' Comp", accident: "May 02, 2026", carrier: "Demo Casualty", claim: "WC-DEMO-2201", adjuster: "Morgan S.", attorney: "None", status: "Prior auth needed", packet: 46, revenue: 3920, outstanding: 1480 },
];

export const auditEvents = [
  { actor: "Nadja R., NP", action: "Opened patient chart", target: "Maya Thompson", time: "9:42 AM", source: "Provider workspace" },
  { actor: "AI workflow", action: "Blocked auto-send and escalated", target: "Lab question", time: "9:38 AM", source: "Safety engine" },
  { actor: "Alex Morgan", action: "Verified insurance", target: "Darius Coleman", time: "9:21 AM", source: "Front desk" },
  { actor: "Billing Team", action: "Updated claim status", target: "CLM-71802", time: "8:56 AM", source: "Billing" },
];

export function getPatient(patientId: string) {
  return patients.find((patient) => patient.id === patientId) ?? patients[0];
}

export function getEncounter(encounterId: string) {
  return encounters.find((encounter) => encounter.id === encounterId) ?? encounters[0];
}
