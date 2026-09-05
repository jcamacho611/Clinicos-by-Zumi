import { redirect } from "next/navigation";

export const metadata = {
  title: "Commercial capabilities — Klinikos",
  description: "Klinikos expands by measured usefulness through governed subscriptions, services, deployment, Grid, EDU, Revenue, Network, and enterprise capabilities.",
};

/** Compatibility route for old inbound links. */
export default function RetiredFoundingCompatibilityPage() {
  redirect("/pricing");
}
