export const gridParticipantKinds = [
  "professional",
  "space_owner",
  "seller",
  "equipment_owner",
  "service_provider",
  "organization",
  "education_partner",
  "referral_partner",
  "buyer",
  "student",
] as const;

export type GridParticipantKind = (typeof gridParticipantKinds)[number];

export const gridPortalRegistry: Record<GridParticipantKind, {
  label: string;
  joinHref: string;
  homeHref: string;
  inventoryKinds: string[];
  primaryActions: string[];
}> = {
  professional: {
    label: "Professional",
    joinHref: "/grid/join",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["availability", "work_capacity", "professional_service"],
    primaryActions: ["Set availability", "View opportunities", "Accept offers", "Track earnings"],
  },
  space_owner: {
    label: "Space owner",
    joinHref: "/grid/join/location",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["room", "chair", "facility_capacity", "lab_capacity", "imaging_capacity", "training_space"],
    primaryActions: ["List capacity", "Set availability", "Review requests", "Track bookings", "Track earnings"],
  },
  seller: {
    label: "Seller",
    joinHref: "/grid/join/seller?type=product",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["product", "supply"],
    primaryActions: ["Create listing", "Manage inventory", "Review orders", "Track fulfillment", "Track revenue"],
  },
  equipment_owner: {
    label: "Equipment owner",
    joinHref: "/grid/join/seller?type=equipment",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["equipment", "equipment_capacity"],
    primaryActions: ["List equipment", "Set availability", "Review reservations", "Track utilization", "Track revenue"],
  },
  service_provider: {
    label: "Service provider",
    joinHref: "/grid/join/seller?type=service",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["professional_service", "project_capacity"],
    primaryActions: ["Publish services", "Review leads", "Accept work", "Manage clients", "Track revenue"],
  },
  organization: {
    label: "Organization",
    joinHref: "/grid/join/location?type=organization",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["provider_capacity", "facility_capacity", "appointment_capacity", "network_capacity"],
    primaryActions: ["Post needs", "Publish capacity", "Review matches", "Manage bookings", "Track spend and revenue"],
  },
  education_partner: {
    label: "Education partner",
    joinHref: "/grid/join/seller?type=education",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["preceptor_capacity", "placement", "training_seat", "education_capacity"],
    primaryActions: ["Publish opportunities", "Review applicants", "Manage placements", "Track hours", "Track contracts"],
  },
  referral_partner: {
    label: "Referral partner",
    joinHref: "/grid/join/seller?type=referral",
    homeHref: "/grid/opportunities",
    inventoryKinds: ["referral_capacity", "consultation_capacity", "diagnostic_capacity", "partner_capacity"],
    primaryActions: ["Publish capacity", "Review referrals", "Manage handoffs", "Confirm receipt", "Track completion"],
  },
  buyer: {
    label: "Buyer",
    joinHref: "/grid",
    homeHref: "/grid/browse",
    inventoryKinds: [],
    primaryActions: ["Search Grid", "Save needs", "Request access", "Track bookings"],
  },
  student: {
    label: "Student",
    joinHref: "/grid/browse?intent=education",
    homeHref: "/grid/browse?intent=education",
    inventoryKinds: [],
    primaryActions: ["Find placements", "Apply", "Track requirements", "Track hours"],
  },
};

export function gridPortalFor(kind: GridParticipantKind) {
  return gridPortalRegistry[kind];
}
