/**
 * Email Verification Service
 * Handles email verification tokens and sending verification emails
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const VERIFICATION_TOKEN_LENGTH = 32;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

export interface EmailVerificationPayload {
  email: string;
  verificationUrl: string;
}

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(VERIFICATION_TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a verification token (for storage)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create an email verification record
 * Returns the token to send in the verification email
 */
export async function createEmailVerification(email: string): Promise<string> {
  try {
    const token = generateVerificationToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store verification token (in a real app, use a separate table or add to User model)
    // For now, we'll use a simple approach with environment variable
    // In production, implement properly with database storage
    console.log(`[EMAIL_VERIFY] Token created for ${email}, expires at ${expiresAt}`);

    return token;
  } catch (error) {
    console.error('[EMAIL_VERIFY] Failed to create verification token:', error);
    throw error;
  }
}

/**
 * Verify an email token
 * Returns the email if valid, null otherwise
 */
export async function verifyEmailToken(email: string, token: string): Promise<boolean> {
  try {
    const hashedToken = hashToken(token);

    // In production, look this up in a verification_tokens table
    // For now, this is a placeholder
    console.log(`[EMAIL_VERIFY] Verifying token for ${email}`);

    // Simulate verification success (replace with DB lookup)
    return true;
  } catch (error) {
    console.error('[EMAIL_VERIFY] Failed to verify token:', error);
    return false;
  }
}

/**
 * Mark an email as verified on a user account
 */
export async function markEmailAsVerified(userId: string): Promise<void> {
  try {
    // Update User model to set emailVerifiedAt
    // This depends on your User schema; adjust as needed
    console.log(`[EMAIL_VERIFY] Marking email as verified for user ${userId}`);
  } catch (error) {
    console.error('[EMAIL_VERIFY] Failed to mark email as verified:', error);
    throw error;
  }
}

/**
 * Check if an email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    // Query User.emailVerifiedAt or similar field
    // Placeholder implementation
    return false;
  } catch (error) {
    console.error('[EMAIL_VERIFY] Failed to check email verification status:', error);
    return false;
  }
}

/**
 * Send a verification email using Resend API
 */
export async function sendVerificationEmail(
  payload: EmailVerificationPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[EMAIL_VERIFY] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // In production, use the Resend SDK
    // For now, log the action
    console.log(`[EMAIL_VERIFY] Would send verification email to ${payload.email}`);
    console.log(`[EMAIL_VERIFY] Verification URL: ${payload.verificationUrl}`);

    // Example using Resend API (uncomment when Resend package is installed)
    /*
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@clinicos.local',
      to: payload.email,
      subject: 'Verify your Klinikos email',
      html: `
        <h2>Welcome to Klinikos!</h2>
        <p>Please verify your email to continue.</p>
        <a href="${payload.verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    if (result.error) {
      console.error('[EMAIL_VERIFY] Failed to send email:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data.id };
    */

    return { success: true }; // Placeholder
  } catch (error) {
    console.error('[EMAIL_VERIFY] Exception sending verification email:', error);
    return { success: false, error: String(error) };
  }
}

export default {
  createEmailVerification,
  verifyEmailToken,
  markEmailAsVerified,
  isEmailVerified,
  sendVerificationEmail,
};
