import { redirect } from "next/navigation";

export const metadata = {
  title: "Klinikos — one governed operating network",
  description: "Start from the outcome you need: unfinished work, clinic operations, capacity, learning, revenue, or enterprise coordination.",
};

/** Compatibility route for a superseded marketing funnel. */
export default function KlinikosEntryCompatibilityPage() {
  redirect("/start");
}
