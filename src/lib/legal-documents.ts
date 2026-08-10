/**
 * Legal Document Management
 * Handle versioned legal agreements (T&C, privacy, etc.)
 */

import { prisma } from '@/lib/prisma';

export type DocumentType =
  | 'access_terms'
  | 'privacy_policy'
  | 'cookie_policy'
  | 'nda'
  | 'baa'
  | 'marketplace_tos';

export interface LegalDocumentInput {
  docType: DocumentType;
  version: string;
  title: string;
  content: string;
  effectiveAt: Date;
}

/**
 * Create or update a legal document (new version)
 */
export async function createLegalDocument(
  input: LegalDocumentInput
): Promise<any> {
  try {
    // Check if this version already exists
    const existing = await prisma.legalDocument.findFirst({
      where: {
        docType: input.docType,
        version: input.version,
      },
    });

    if (existing) {
      throw new Error(
        `Document version already exists: ${input.docType} v${input.version}`
      );
    }

    // Archive previous active versions
    await prisma.legalDocument.updateMany(
      {
        where: {
          docType: input.docType,
          status: 'active',
        },
      },
      {
        status: 'archived',
      }
    );

    // Create new version
    return await prisma.legalDocument.create({
      data: {
        docType: input.docType,
        version: input.version,
        title: input.title,
        content: input.content,
        effectiveAt: input.effectiveAt,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('[LEGAL] Failed to create document:', error);
    throw error;
  }
}

/**
 * Get the current active version of a document
 */
export async function getCurrentDocument(docType: DocumentType): Promise<any | null> {
  try {
    return await prisma.legalDocument.findFirst({
      where: {
        docType,
        status: 'active',
      },
      orderBy: { effectiveAt: 'desc' },
    });
  } catch (error) {
    console.error(`[LEGAL] Failed to fetch ${docType}:`, error);
    return null;
  }
}

/**
 * Get a specific version of a document
 */
export async function getDocumentVersion(
  docType: DocumentType,
  version: string
): Promise<any | null> {
  try {
    return await prisma.legalDocument.findFirst({
      where: { docType, version },
    });
  } catch (error) {
    console.error(
      `[LEGAL] Failed to fetch ${docType} v${version}:`,
      error
    );
    return null;
  }
}

/**
 * Get all versions of a document (for admin/history)
 */
export async function getDocumentHistory(docType: DocumentType): Promise<any[]> {
  try {
    return await prisma.legalDocument.findMany({
      where: { docType },
      orderBy: { effectiveAt: 'desc' },
    });
  } catch (error) {
    console.error(`[LEGAL] Failed to fetch ${docType} history:`, error);
    return [];
  }
}

/**
 * Get all current active documents (for frontend rendering)
 */
export async function getAllCurrentDocuments(): Promise<Record<DocumentType, any>> {
  const docTypes: DocumentType[] = [
    'access_terms',
    'privacy_policy',
    'cookie_policy',
  ];

  const documents: Record<string, any> = {};

  for (const docType of docTypes) {
    const doc = await getCurrentDocument(docType);
    if (doc) {
      documents[docType] = doc;
    }
  }

  return documents as Record<DocumentType, any>;
}

/**
 * Mark a document as archived (when superseded by new version)
 */
export async function archiveDocument(docType: DocumentType, version: string): Promise<void> {
  try {
    await prisma.legalDocument.updateMany(
      {
        where: {
          docType,
          version,
        },
      },
      {
        status: 'archived',
      }
    );
  } catch (error) {
    console.error(
      `[LEGAL] Failed to archive ${docType} v${version}:`,
      error
    );
  }
}

export default {
  createLegalDocument,
  getCurrentDocument,
  getDocumentVersion,
  getDocumentHistory,
  getAllCurrentDocuments,
  archiveDocument,
};
