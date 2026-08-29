import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { gridPublicEntryContext } from "@/lib/grid/public-entry";

export const metadata = {
  title: "Klinikos Grid — Healthcare capacity exchange",
  description: "Tell Klinikos what you need or what you have and move directly into the governed healthcare exchange.",
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
    <main className="min-h-screen overflow-hidden bg-[#050303] text-[#f8efed]" data-klinikos-ds>
      <section className="relative isolate grid min-h-screen place-items-center overflow-hidden px-5 py-10 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_18%,rgba(139,35,42,.22),transparent_34%),radial-gradient(circle_at_80%_58%,rgba(230,129,123,.05),transparent_26%)]"
        />

        <div className="w-full max-w-5xl">
          <KlinikosWordmark
            href="/"
            framed
            inverse
            markClassName="h-11 w-11"
            textClassName="h-[20px] w-[180px]"
            className="gap-3"
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#e6817b]">Klinikos Grid</p>
              <h1 className="mt-5 text-balance text-5xl font-light leading-[.94] tracking-[-.065em] sm:text-7xl">
                WHAT DO YOU NEED?
              </h1>
              <p className="mt-5 text-2xl font-light tracking-[-.04em] text-[#cbb4b0] sm:text-3xl">
                WHAT DO YOU HAVE?
              </p>
            </div>

            <div className="w-full">
              {entryContext ? (
                <aside className="mb-4 border-l-2 border-[#e6817b] bg-[#100708]/72 px-5 py-4" aria-label="Continue from Zumi">
                  <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#e6817b]">Continue from Zumi</p>
                  <p className="mt-2 text-sm font-medium text-[#fff8f6]">{entryContext.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#a8908b]">{entryContext.body}</p>
                </aside>
              ) : null}
              <GridExchangeField
                initialIntent={entryContext?.intent ?? "all"}
                initialQuery={entryContext?.initialQuery ?? ""}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
