// server/cookieUtils.ts
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import crypto from 'crypto';

// Use a server-only secret (set via env var)
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const HMAC_ALGO = 'sha256';
const COOKIE_NAME = 'clerk_token_v1';

// sign data -> "<payload>.<hmac>"
export function signPayload(payload: string) {
  const hmac = crypto
    .createHmac(HMAC_ALGO, COOKIE_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${hmac}`;
}

// verify and return payload or null
export function verifySignedPayload(signed: string | undefined) {
  if (!signed) return null;
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return null;
  const payload = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto
    .createHmac(HMAC_ALGO, COOKIE_SECRET)
    .update(payload)
    .digest('base64url');
  // constant-time compare
  const valid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return valid ? payload : null;
}

// cookie parse helper
export function parseCookies(cookieHeader: string | null) {
  return cookieHeader ? parseCookie(cookieHeader) : {};
}

export function serializeSignedCookie(
  value: string,
  opts?: { maxAge?: number; httpOnly?: boolean }
) {
  const signed = signPayload(value);
  return serializeCookie(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: opts?.maxAge ?? 60 * 60, // default 1 hour
  });
}
