import type {
  Claim,
  Organization,
  QualityGap,
  WorkTask,
} from "@/lib/types";

export const organizations: Organization[] = [
  { id: "org-bfm", name: "Brooklyn Family Medicine", type: "Primary Care", locations: ["Brooklyn Heights", "Crown Heights"] },
  { id: "org-luxe", name: "Luxe Medi", type: "Med Spa", locations: ["Midtown Manhattan"] },
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
