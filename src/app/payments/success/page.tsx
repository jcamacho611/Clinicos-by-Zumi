import type { Metadata } from "next";
import { readActivationView } from "@/lib/commercial/analysis-activation";
import { PaymentReturnExperience } from "@/components/commercial/payment-return-experience";

export const metadata: Metadata = {
  title: "Payment return | Klinikos",
  description: "Klinikos is waiting for verified server-side payment evidence.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where a buyer lands after checkout.
 *
 * The page reads the reservation's own payment state rather than concluding anything
 * from the fact that a browser arrived here. Someone who abandoned checkout and someone
 * who completed it reach this URL identically, so arrival proves nothing and is never
 * treated as evidence.
 */
export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ activation?: string }>;
}) {
  const { activation } = await searchParams;
  const view = await readActivationView(activation);
  return <PaymentReturnExperience token={activation ?? null} view={view} />;
}
