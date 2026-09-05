export const publicGrowthEvents = [
  "PUBLIC_FIRST_VALUE",
  "PUBLIC_NO_RESULT",
  "FREE_SIGNUP_COMPLETED",
  "PERSON_PATH_RESUMED",
] as const;

export type PublicGrowthEvent = (typeof publicGrowthEvents)[number];

const publicGrowthEventSet = new Set<string>(publicGrowthEvents);

export function isPublicGrowthEvent(value: string): value is PublicGrowthEvent {
  return publicGrowthEventSet.has(value);
}
