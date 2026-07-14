import type { AppointmentStatus } from "@/lib/types";

export const appointmentStatusLabels = {
  REQUESTED: "Requested",
  PENDING_CONFIRMATION: "Pending Confirmation",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_ROOM: "In Room",
  WITH_PROVIDER: "With Provider",
  CHECKOUT: "Checkout",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
  RESCHEDULED: "Rescheduled",
} as const satisfies Record<string, AppointmentStatus>;

export type AppointmentStatusKey = keyof typeof appointmentStatusLabels;

const statusKeys = Object.keys(appointmentStatusLabels) as AppointmentStatusKey[];

const allowedTransitions: Record<AppointmentStatusKey, AppointmentStatusKey[]> = {
  REQUESTED: ["PENDING_CONFIRMATION", "CONFIRMED", "CANCELLED"],
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
  CHECKED_IN: ["IN_ROOM", "CANCELLED"],
  IN_ROOM: ["WITH_PROVIDER"],
  WITH_PROVIDER: ["CHECKOUT"],
  CHECKOUT: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  RESCHEDULED: [],
};

export function isAppointmentStatusKey(value: string): value is AppointmentStatusKey {
  return statusKeys.includes(value as AppointmentStatusKey);
}

export function appointmentStatusLabel(value: string): AppointmentStatus {
  return isAppointmentStatusKey(value) ? appointmentStatusLabels[value] : "Requested";
}

export function appointmentStatusKey(value: AppointmentStatus): AppointmentStatusKey {
  return statusKeys.find((key) => appointmentStatusLabels[key] === value) ?? "REQUESTED";
}

export function canTransitionAppointment(from: string, to: string) {
  return isAppointmentStatusKey(from)
    && isAppointmentStatusKey(to)
    && allowedTransitions[from].includes(to);
}

export function nextAppointmentStatuses(status: AppointmentStatus) {
  return allowedTransitions[appointmentStatusKey(status)].map((key) => ({
    key,
    label: appointmentStatusLabels[key],
  }));
}
