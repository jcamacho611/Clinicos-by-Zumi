import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { LegalAcceptanceRecord } from "@/lib/legal/legal-access";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const BODY_SIZE = 9.5;
const LINE_HEIGHT = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (!text.trim()) return [""];
  const words = text.split(/\s+/u);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

function createPage(pdf: PDFDocument) {
  return pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
}

function drawFooter(page: PDFPage, font: PDFFont, acceptanceId: string) {
  page.drawText(`Klinikos agreement evidence • Acceptance ${acceptanceId}`, {
    x: MARGIN,
    y: 26,
    size: 7,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
}

export async function renderSignedAgreementPdf(record: LegalAcceptanceRecord) {
  if (!record.documentSnapshot || !record.documentSha256 || !record.signedAt || !record.legalName) {
    throw new Error("Executed agreement evidence is incomplete.");
  }

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = createPage(pdf);
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (height: number) => {
    if (y - height >= 48) return;
    drawFooter(page, regular, record.id);
    page = createPage(pdf);
    y = PAGE_HEIGHT - MARGIN;
  };

  const drawWrapped = (text: string, options: { size?: number; font?: PDFFont; gapAfter?: number } = {}) => {
    const size = options.size ?? BODY_SIZE;
    const font = options.font ?? regular;
    const lineHeight = Math.max(LINE_HEIGHT, size * 1.45);
    const lines = wrapLine(text, font, size, CONTENT_WIDTH);
    ensureSpace(lines.length * lineHeight + (options.gapAfter ?? 0));
    for (const line of lines) {
      if (line) {
        page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0.08, 0.08, 0.09) });
      }
      y -= lineHeight;
    }
    y -= options.gapAfter ?? 0;
  };

  drawWrapped("KLINIKOS", { size: 16, font: bold, gapAfter: 8 });
  drawWrapped("EXECUTED ELECTRONIC AGREEMENT", { size: 11, font: bold, gapAfter: 18 });

  for (const rawLine of record.documentSnapshot.split("\n")) {
    const line = rawLine.trimEnd();
    const sectionLike = /^\d+\.\s/u.test(line);
    drawWrapped(line, { font: sectionLike ? bold : regular, size: sectionLike ? 10.5 : BODY_SIZE, gapAfter: line ? 5 : 3 });
  }

  ensureSpace(220);
  y -= 12;
  drawWrapped("Electronic Signature Certificate", { size: 12, font: bold, gapAfter: 10 });
  const certificate = [
    ["Acceptance ID", record.id],
    ["Agreement", `${record.documentKey} / ${record.documentVersion}`],
    ["Document SHA-256", record.documentSha256],
    ["Signed by", record.legalName],
    ["Account email", record.email],
    ["Capacity", record.signerCapacity],
    ["Organization ID", record.organizationId ?? "Not recorded"],
    ["Title", record.signerTitle ?? "Not provided"],
    ["Country / region", [record.signerCountry, record.signerRegion].filter(Boolean).join(" / ") || "Not provided"],
    ["Signature method", record.signatureMethod ?? "typed"],
    ["Signed at", record.signedAt.toISOString()],
  ] as const;

  for (const [label, value] of certificate) {
    drawWrapped(`${label}: ${value}`, { size: 8.5, gapAfter: 2 });
  }

  drawWrapped("Electronic signature", { size: 9, font: bold, gapAfter: 2 });
  drawWrapped(record.signatureText ?? record.legalName, { size: 14, font: bold, gapAfter: 12 });

  const acknowledgments = record.acknowledgments && typeof record.acknowledgments === "object"
    ? Object.entries(record.acknowledgments as Record<string, unknown>).filter(([, value]) => value === true).map(([key]) => key)
    : [];
  if (acknowledgments.length) {
    drawWrapped(`Affirmative acknowledgments: ${acknowledgments.join(", ")}`, { size: 8.5, gapAfter: 8 });
  }

  drawWrapped(
    "This certificate records the electronic execution evidence preserved by Klinikos. It does not represent notarization, a qualified electronic signature, legal advice, professional credential verification, payment evidence, or healthcare authorization.",
    { size: 8, gapAfter: 8 },
  );

  drawFooter(page, regular, record.id);
  return pdf.save();
}
