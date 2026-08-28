import { safeReturnTo } from "@/lib/auth/return-to";
import { requireAgreementAirlockPass } from "@/lib/legal/agreement-airlock";
import { IdentityCreateClient } from "./IdentityCreateClient";

export default async function IdentityCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo) ?? "/home";
  await requireAgreementAirlockPass(returnTo);

  return (
    <IdentityCreateClient
      emailLabel="Email"
      nameLabel="Name"
      returnTo={returnTo}
      submitLabel="Continue securely"
    />
  );
}
