import { Suspense } from "react";
import type { Metadata } from "next";
import { ActivateAccountForm } from "@/components/access/activate-account-form";
import { commandSurfaces } from "@/lib/design/command-system";

export const metadata: Metadata = {
  title: "Set your Klinikos password",
  robots: { index: false, follow: false },
};

/**
 * Where a paid buyer finishes becoming an account.
 *
 * Provisioning creates the organization and attaches the buyer's identity to it, but a
 * user with no credential cannot sign in. This page is the other half of that: it is
 * the only place the activation token issued at provisioning is spent.
 *
 * Deliberately not indexed. The token is the secret, so the page must not be
 * discoverable and its URL must not be shared.
 */
export default function ActivatePage() {
  return (
    <main className="min-h-screen bg-[#05090f] px-5 py-16 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-md">
        <p className={commandSurfaces.eyebrow}>Klinikos</p>
        <h1 className={`${commandSurfaces.headline} mt-3 text-3xl`}>Set your password.</h1>
        <p className="mt-4 text-[13px] leading-7 text-slate-400">
          Your purchase created a Klinikos organization and attached this address to it. Choose a password and you
          will sign in to that same organization — not a new one.
        </p>

        <div className={`${commandSurfaces.panelRaised} mt-8 p-6`}>
          <Suspense fallback={<p className="text-[13px] text-slate-400">Checking your link&hellip;</p>}>
            <ActivateAccountForm />
          </Suspense>
        </div>

        <p className="mt-6 text-[12px] leading-6 text-slate-500">
          Activation links expire 24 hours after they are issued. If yours has expired, ask Klinikos to send another —
          the account and everything it was granted are unaffected.
        </p>
      </div>
    </main>
  );
}
