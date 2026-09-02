import { UniverseShell } from "@/components/living-universe/universe-shell";
import { requirePersonAccountSession } from "@/lib/auth/account-session";
import { getMemberHomeProjection } from "@/lib/member/member-home-repository";
import { PRIVATE_PAGE_METADATA } from "@/lib/seo/private-metadata";
import { klinikosPathCatalog } from "@/lib/paths/catalog";

export const metadata = {
  ...PRIVATE_PAGE_METADATA,
  title: "Living Home",
  description: "Your person-owned Klinikos context, evidence, paths, and next actions.",
};

export default async function MemberHomePage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const params = await searchParams;
  const requestedPath = typeof params.path === "string"
    ? klinikosPathCatalog.find((path) => path.id === params.path)
    : undefined;
  const memberReturnTo = requestedPath
    ? `/member?path=${encodeURIComponent(requestedPath.id)}`
    : "/member";
  const session = await requirePersonAccountSession(memberReturnTo);
  const projection = await getMemberHomeProjection(session, requestedPath?.id);

  return <UniverseShell projection={projection} />;
}
