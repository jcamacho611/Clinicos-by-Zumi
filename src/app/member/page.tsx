import { UniverseShell } from "@/components/living-universe/universe-shell";
import { requirePersonAccountSession } from "@/lib/auth/account-session";
import { getMemberHomeProjection } from "@/lib/member/member-home-repository";
import { PRIVATE_PAGE_METADATA } from "@/lib/seo/private-metadata";

export const metadata = {
  ...PRIVATE_PAGE_METADATA,
  title: "Living Home",
  description: "Your person-owned Klinikos context, evidence, paths, and next actions.",
};

export default async function MemberHomePage() {
  const session = await requirePersonAccountSession();
  const projection = await getMemberHomeProjection(session);

  return <UniverseShell projection={projection} />;
}
