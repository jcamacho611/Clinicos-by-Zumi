/**
 * Audit Logging Service
 * Logs security events, consent acceptances, and compliance events
 */

import { prisma } from '@/lib/prisma';
import { getClientIp, getUserAgent } from '@/lib/request-utils';

export interface AuditLogPayload {
  userId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentLogPayload {
  userId: string;
  termVersion: string;
  acceptedText?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a security/compliance event
 */
export async function logAuditEvent(payload: AuditLogPayload): Promise<void> {
  try {
    await prisma.userAuditLog.create({
      data: {
        userId: payload.userId,
        action: payload.action,
        details: payload.details || {},
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error(`[AUDIT] Failed to log ${payload.action} for user ${payload.userId}:`, error);
    // Don't throw; audit failures should not break the app
  }
}

/**
 * Log a terms/policy acceptance
 */
export async function logTermsAcceptance(payload: ConsentLogPayload): Promise<void> {
  try {
    await prisma.userAcceptance.create({
      data: {
        userId: payload.userId,
        termVersion: payload.termVersion,
        acceptedText: payload.acceptedText,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        timestamp: new Date(),
      },
    });

    // Also log as an audit event
    await logAuditEvent({
      userId: payload.userId,
      action: 'TERMS_ACCEPTED',
      details: { termVersion: payload.termVersion },
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });
  } catch (error) {
    console.error(
      `[AUDIT] Failed to log terms acceptance for user ${payload.userId}:`,
      error
    );
  }
}

/**
 * Log a login attempt (success or failure)
 */
export async function logLoginAttempt(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    details: { reason },
    ipAddress,
    userAgent,
  });
}

/**
 * Log a password reset
 */
export async function logPasswordReset(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'PASSWORD_RESET',
    ipAddress,
    userAgent,
  });
}

/**
 * Log a profile update
 */
export async function logProfileUpdate(
  userId: string,
  changes: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'PROFILE_UPDATED',
    details: { changes },
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit log history for a user
 */
export async function getUserAuditHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const logs = await prisma.userAuditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.userAuditLog.count({ where: { userId } });

    return {
      logs,
      total,
      hasMore: offset + logs.length < total,
    };
  } catch (error) {
    console.error(`[AUDIT] Failed to retrieve audit history for user ${userId}:`, error);
    return { logs: [], total: 0, hasMore: false };
  }
}

/**
 * Get terms acceptance history for a user
 */
export async function getUserTermsHistory(userId: string) {
  try {
    return await prisma.userAcceptance.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  } catch (error) {
    console.error(`[AUDIT] Failed to retrieve terms history for user ${userId}:`, error);
    return [];
  }
}

/**
 * Check if user has accepted a specific terms version
 */
export async function hasUserAcceptedTerms(
  userId: string,
  termVersion: string
): Promise<boolean> {
  try {
    const acceptance = await prisma.userAcceptance.findFirst({
      where: { userId, termVersion },
    });
    return !!acceptance;
  } catch (error) {
    console.error(
      `[AUDIT] Failed to check terms acceptance for user ${userId}:`,
      error
    );
    return false;
  }
}

export default {
  logAuditEvent,
  logTermsAcceptance,
  logLoginAttempt,
  logPasswordReset,
  logProfileUpdate,
  getUserAuditHistory,
  getUserTermsHistory,
  hasUserAcceptedTerms,
};
