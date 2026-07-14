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
    label: "Connected care",
    items: [
      { href: "/network", label: "Network command", icon: "Network" },
      { href: "/care-teams", label: "Care Constellation", icon: "Orbit" },
      { href: "/capacity-exchange", label: "Capacity Exchange", icon: "Route" },
      { href: "/injury-episodes", label: "Injury Episode Room", icon: "HeartHandshake" },
      { href: "/health-passport", label: "Health Passport", icon: "Fingerprint" },
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
      { href: "/voice-assistant", label: "Talk to ClinicOS", icon: "AudioLines" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/portal", label: "Portal preview", icon: "MonitorSmartphone" },
      { href: "/integrations", label: "Integration roadmap", icon: "Blocks" },
      { href: "/settings", label: "Settings & audit", icon: "Settings2" },
      { href: "/feature-registry", label: "P0 feature registry", icon: "BookOpenCheck" },
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
  network: { title: "Network command", eyebrow: "Connected-care mission control" },
  "care-teams": { title: "Care Constellation", eyebrow: "Virtual care team" },
  "capacity-exchange": { title: "Capacity Exchange", eyebrow: "Network availability" },
  "injury-episodes": { title: "Injury Episode Room", eyebrow: "Case command center" },
  "health-passport": { title: "Health Passport", eyebrow: "Patient-controlled portability" },
  "voice-assistant": { title: "Talk to ClinicOS", eyebrow: "Voice-first Copilot" },
  "feature-registry": { title: "Priority Zero registry", eyebrow: "ClinicOS product constitution" },
  portal: { title: "Patient portal", eyebrow: "Patient experience preview" },
  integrations: { title: "Integration roadmap", eyebrow: "Standards and partners" },
  settings: { title: "Settings & audit", eyebrow: "Organization controls" },
};
