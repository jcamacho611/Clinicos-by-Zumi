import Link from "next/link";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { gridPublicEntryContext } from "@/lib/grid/public-entry";

export const metadata = {
  title: "Klinikos Grid — Healthcare capacity exchange",
  description:
    "Tell Klinikos what you need or what you have. Grid routes real healthcare people, work, space, equipment, services, education, referrals, organizations, and capacity into the governed exchange.",
};

type GridGatewaySearchParams = {
  from?: string | string[];
  intent?: string | string[];
};

export default async function GridGatewayPage({
  searchParams,
}: {
  searchParams: Promise<GridGatewaySearchParams>;
}) {
  const { from, intent } = await searchParams;
  const entryContext = gridPublicEntryContext(from, intent);

  return (
    <main className="grid-canvas min-h-screen overflow-hidden bg-[#050303] text-[#f8efed]" data-klinikos-ds>
      <header className="relative z-20 border-b border-[#e28b85]/10 bg-[#050303]/92 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <KlinikosWordmark
            href="/"
            framed
            inverse
            markClassName="h-12 w-12"
            textClassName="h-[21px] w-[188px]"
            className="gap-3"
          />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[.18em] text-[#e6817b] md:block">
            Grid
          </span>
          <Link
            className="ml-auto inline-flex min-h-11 items-center rounded-full border border-[#e28b85]/14 px-4 text-xs font-semibold text-[#bca5a1] transition hover:border-[#efaaa1]/30 hover:text-[#fff8f6]"
            href="/grid/browse"
          >
            Open Grid map
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-full bg-[#e6817b] px-5 text-xs font-semibold text-[#19090b] transition hover:bg-[#efaaa1]"
            href="/login"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52rem] bg-[radial-gradient(circle_at_50%_12%,rgba(139,35,42,.24),transparent_38%),radial-gradient(circle_at_82%_42%,rgba(230,129,123,.05),transparent_24%)]"
        />

        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1500px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:gap-16 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#e6817b]">Klinikos Grid</p>
            <h1 className="mt-6 text-balance text-5xl font-light leading-[.93] tracking-[-.065em] sm:text-7xl lg:text-[82px]">
              WHAT DO YOU NEED?
            </h1>
            <p className="mt-5 text-2xl font-light tracking-[-.04em] text-[#cbb4b0] sm:text-3xl">
              WHAT DO YOU HAVE?
            </p>
            <p className="mt-7 max-w-xl text-sm leading-7 text-[#9f8985] sm:text-base">
              Say it naturally. Grid will structure the request, preserve your intent, and move you into the real map, results, or offer path without making you learn a marketplace taxonomy first.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-[11px] text-[#8f7a76]">
              <span>Real supply only.</span>
              <span aria-hidden="true">•</span>
              <span>Eligibility before ranking.</span>
              <span aria-hidden="true">•</span>
              <span>No fake availability.</span>
            </div>
          </div>

          <div className="w-full max-w-3xl lg:justify-self-end">
            {entryContext && (
              <aside
                className="mb-3 border-l-2 border-[#e6817b] bg-[#100708]/62 px-5 py-4"
                aria-label="Continue from Zumi"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#e6817b]">Continue from Zumi</p>
                <p className="mt-2 text-sm font-medium text-[#fff8f6]">{entryContext.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-[#a8908b]">{entryContext.body}</p>
              </aside>
            )}

            <p className="mb-3 text-[12px] font-semibold tracking-[-.01em] text-[#e9aaa4]">
              What are you trying to find or offer?
            </p>
            <GridExchangeField
              initialIntent={entryContext?.intent ?? "all"}
              initialQuery={entryContext?.initialQuery ?? ""}
            />

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#e28b85]/10 pt-4">
              <p className="max-w-xl text-[11px] leading-5 text-[#806d69]">
                Discovery can stay public. Sign-in is requested only when saving, posting, connecting, booking, applying, claiming, or another persistent action creates value.
              </p>
              <Link className="shrink-0 text-[11px] font-semibold text-[#d98e87] hover:text-[#efaaa1]" href="/grid/browse">
                Open map →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
