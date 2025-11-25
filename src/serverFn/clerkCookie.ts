import { auth } from '@clerk/tanstack-react-start/server';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import {
  parseCookies,
  serializeSignedCookie,
  verifySignedPayload,
} from '~/utils/auth';

const COOKIE_NAME = 'clerk_token_v1';

// call this inside a loader; returns { token, userId, expiresAt } (may be freshly fetched)
export const getClerkTokenWithCookie = createServerFn({
  method: 'GET',
}).handler(async () => {
  // const cookieHeader = data?.request.headers.get("cookie")
  const headers = getRequestHeaders();
  const cookieHeader = headers.get('cookie');
  // const cookieHeader = getRequestHeader('cookie')
  const cookies = cookieHeader ? parseCookies(cookieHeader) : {};
  const signed = cookies[COOKIE_NAME] as string | undefined;
  const payload = verifySignedPayload(signed);

  if (payload) {
    try {
      const parsed = JSON.parse(payload) as {
        token: string;
        userId?: string;
        expiresAt: number;
      };
      if (parsed.token && parsed.expiresAt && Date.now() < parsed.expiresAt) {
        // still fresh
        return {
          token: parsed.token,
          userId: parsed.userId ?? null,
          expiresAt: parsed.expiresAt,
          fromCookie: true,
        };
      }
    } catch (e) {
      // fallthrough to refresh
    }
  }

  // Otherwise: fetch from Clerk and create new cookie payload
  const { userId: uid, getToken } = await auth();
  const token = await getToken({ template: 'convex' });
  const userId = uid ?? null;
  // expire slightly earlier than actual token lifetime to be safe
  const ttlMs = 1000 * 60 * 50; // 50 minutes
  const expiresAt = Date.now() + ttlMs;

  return {
    token,
    userId,
    expiresAt,
    fromCookie: false,
  };
});

// helper to produce Set-Cookie header value you can attach to a response
export function makeSetClerkCookieHeader({
  token,
  userId,
  expiresAt,
}: {
  token: string;
  userId?: string | null;
  expiresAt: number;
}) {
  const payload = JSON.stringify({ token, userId, expiresAt });
  return serializeSignedCookie(payload, {
    maxAge: Math.ceil((expiresAt - Date.now()) / 1000),
  });
}
