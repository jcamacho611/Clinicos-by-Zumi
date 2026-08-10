/**
 * Request Utilities
 * Extract IP address and user-agent from requests for audit logging
 */

import { IncomingHttpHeaders } from 'http';

/**
 * Extract client IP address from request headers
 * Handles X-Forwarded-For, X-Real-IP, and direct socket connection
 */
export function getClientIp(
  headers: IncomingHttpHeaders | Headers,
  remoteAddr?: string
): string | null {
  // Handle both Node.js IncomingHttpHeaders and Fetch API Headers
  const headerObj = headers instanceof Headers
    ? Object.fromEntries(headers)
    : headers;

  // Check for X-Forwarded-For (proxy, load balancer)
  const forwarded = headerObj['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list; take the first
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }

  // Check for X-Real-IP (nginx, other proxies)
  const realIp = headerObj['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Check for CF-Connecting-IP (Cloudflare)
  const cfIp = headerObj['cf-connecting-ip'];
  if (cfIp) {
    return Array.isArray(cfIp) ? cfIp[0] : cfIp;
  }

  // Fall back to remote address (direct connection)
  return remoteAddr || null;
}

/**
 * Extract user-agent from request headers
 */
export function getUserAgent(
  headers: IncomingHttpHeaders | Headers
): string | null {
  const headerObj = headers instanceof Headers
    ? Object.fromEntries(headers)
    : headers;

  const ua = headerObj['user-agent'];
  return ua ? (Array.isArray(ua) ? ua[0] : ua) : null;
}

/**
 * Extract both IP and user-agent in one call
 */
export function getRequestMetadata(headers: IncomingHttpHeaders | Headers, remoteAddr?: string) {
  return {
    ipAddress: getClientIp(headers, remoteAddr),
    userAgent: getUserAgent(headers),
  };
}

export default {
  getClientIp,
  getUserAgent,
  getRequestMetadata,
};
