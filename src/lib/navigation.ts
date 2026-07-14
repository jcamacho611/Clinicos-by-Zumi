export const navigation = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", label: "Command center", icon: "LayoutDashboard" },
      { href: "/front-desk", label: "Front desk", icon: "Headphones" },
      { href: "/provider", label: "Provider workspace", icon: "Stethoscope" },
    ],
  },
  {
    label: "Care delivery",
    items: [
      { href: "/patients", label: "Patient charts", icon: "Users" },
      { href: "/schedule", label: "Schedule", icon: "CalendarDays" },
      { href: "/encounters", label: "Encounters", icon: "ClipboardPlus" },
      { href: "/telemedicine", label: "Telemedicine", icon: "Video" },
    ],
  },
  {
    label: "Clinical",
    items: [
      { href: "/labs", label: "Labs", icon: "FlaskConical" },
      { href: "/imaging", label: "Imaging", icon: "ScanLine" },
      { href: "/documents", label: "Documents", icon: "Files" },
      { href: "/forms", label: "Intake & forms", icon: "ClipboardList" },
    ],
  },
  {
    label: "Revenue & quality",
    items: [
      { href: "/billing", label: "Billing", icon: "ReceiptText" },
      { href: "/insurance", label: "Insurance", icon: "ShieldCheck" },
      { href: "/cases", label: "No-fault / WC", icon: "BriefcaseMedical" },
      { href: "/quality", label: "Quality & HEDIS", icon: "ChartNoAxesCombined" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/messages", label: "Messages", icon: "MessagesSquare" },
      { href: "/tasks", label: "Tasks", icon: "ListChecks" },
      { href: "/escalations", label: "Escalations", icon: "Siren" },
      { href: "/ai-assistants", label: "AI assistants", icon: "Sparkles" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/portal", label: "Portal preview", icon: "MonitorSmartphone" },
      { href: "/integrations", label: "Integration roadmap", icon: "Blocks" },
      { href: "/settings", label: "Settings & audit", icon: "Settings2" },
    ],
  },
] as const;

export const workspaceMeta: Record<string, { title: string; eyebrow: string }> = {
  dashboard: { title: "Command center", eyebrow: "Practice overview" },
  "front-desk": { title: "Front desk", eyebrow: "Today at a glance" },
  provider: { title: "Provider workspace", eyebrow: "Clinical priority queue" },
  patients: { title: "Patient charts", eyebrow: "Unified record" },
  schedule: { title: "Schedule", eyebrow: "Multi-location calendar" },
  encounters: { title: "Encounters", eyebrow: "Documentation workspace" },
  telemedicine: { title: "Telemedicine", eyebrow: "Virtual care operations" },
  labs: { title: "Labs", eyebrow: "Review and release" },
  imaging: { title: "Imaging", eyebrow: "Orders and reports" },
  documents: { title: "Documents", eyebrow: "Controlled clinical records" },
  forms: { title: "Intake & forms", eyebrow: "Consent and readiness" },
  billing: { title: "Billing", eyebrow: "Revenue cycle" },
  insurance: { title: "Insurance", eyebrow: "Eligibility and authorization" },
  cases: { title: "No-fault / workers' comp", eyebrow: "Case operations" },
  quality: { title: "Quality & HEDIS", eyebrow: "Care-gap intelligence" },
  messages: { title: "Messages", eyebrow: "Secure communication" },
  tasks: { title: "Tasks", eyebrow: "Work queue" },
  escalations: { title: "Escalations", eyebrow: "Human review required" },
  "ai-assistants": { title: "AI assistants", eyebrow: "Safe workflow automation" },
  portal: { title: "Patient portal", eyebrow: "Patient experience preview" },
  integrations: { title: "Integration roadmap", eyebrow: "Standards and partners" },
  settings: { title: "Settings & audit", eyebrow: "Organization controls" },
};
