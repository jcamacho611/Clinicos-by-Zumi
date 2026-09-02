import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AccessTermsPage from "@/app/legal/access-terms/page";
import LegalDocumentStatusPage from "@/app/legal/[document]/page";
import PrivacyPage from "@/app/legal/privacy/page";
import {
  getLegalDocument,
  type LegalDocumentDefinition,
  type LegalDocumentKey,
} from "@/lib/legal/document-registry";

type VisibleMetadata = Pick<LegalDocumentDefinition, "title" | "version" | "effectiveDate">;

async function renderWithGovernedMetadata(
  key: LegalDocumentKey,
  metadata: VisibleMetadata,
  render: () => string | Promise<string>,
) {
  const definition = getLegalDocument(key);
  expect(definition, `${key} must remain registered`).toBeDefined();

  const original = {
    title: definition!.title,
    version: definition!.version,
    effectiveDate: definition!.effectiveDate,
  };

  Object.assign(definition!, metadata);
  try {
    return await render();
  } finally {
    Object.assign(definition!, original);
  }
}

describe("public legal-document metadata convergence", () => {
  it("renders Privacy metadata from the canonical legal-document registry", async () => {
    const markup = await renderWithGovernedMetadata(
      "privacy_policy",
      {
        title: "TEST ONLY Governed Privacy Title",
        version: "test-privacy-version.7",
        effectiveDate: "2099-01-07",
      },
      () => renderToStaticMarkup(<PrivacyPage />),
    );

    expect(markup).toContain("TEST ONLY Governed Privacy Title");
    expect(markup).toContain("Version test-privacy-version.7");
    expect(markup).toContain("Draft effective date");
    expect(markup).toContain('<time dateTime="2099-01-07">2099-01-07</time>');
  });

  it("renders Access Terms metadata from the canonical legal-document registry", async () => {
    const markup = await renderWithGovernedMetadata(
      "access_terms",
      {
        title: "TEST ONLY Governed Access Terms Title",
        version: "test-access-version.9",
        effectiveDate: "2099-02-09",
      },
      () => renderToStaticMarkup(<AccessTermsPage />),
    );

    expect(markup).toContain("TEST ONLY Governed Access Terms Title");
    expect(markup).toContain("Version test-access-version.9");
    expect(markup).toContain("Draft effective date");
    expect(markup).toContain('<time dateTime="2099-02-09">2099-02-09</time>');
  });

  it("keeps generic legal status pages on the same canonical metadata", async () => {
    const markup = await renderWithGovernedMetadata(
      "cookie_notice",
      {
        title: "TEST ONLY Governed Cookie Notice Title",
        version: "test-cookie-version.3",
        effectiveDate: "2099-03-03",
      },
      async () => renderToStaticMarkup(await LegalDocumentStatusPage({
        params: Promise.resolve({ document: "cookies" }),
      })),
    );

    expect(markup).toContain("TEST ONLY Governed Cookie Notice Title");
    expect(markup).toContain("test-cookie-version.3");
    expect(markup).toContain("2099-03-03");
  });
});
