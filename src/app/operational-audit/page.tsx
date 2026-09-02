import { redirect } from "next/navigation";

export const metadata = {
  title: "Commercial entry — Klinikos",
  description: "Klinikos now starts with unfinished work and a first useful result rather than a fixed paid funnel.",
};

/** Compatibility route for old inbound links. */
export default function RetiredCommercialCompatibilityPage() {
  redirect("/sales");
}
