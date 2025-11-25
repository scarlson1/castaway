import { auth } from '@clerk/tanstack-react-start/server';
import { createServerFn } from '@tanstack/react-start';

// TODO: delete - ConvexProviderWithClerk handles token
// https://chatgpt.com/s/t_691e1b20e9e48191a4d28bc790d8990f

// const fetchClerkAuthSchema = z.object({
//   token: z.string().nullable().optional(),
//   userId: z.string().nullable().optional(),
// });

export const fetchClerkAuth = createServerFn({ method: 'GET' })
  // .inputValidator(fetchClerkAuthSchema)
  .handler(async ({ data }) => {
    const start = Date.now();
    const a = await auth();
    const { userId, orgId, isAuthenticated } = a;
    console.log('FETCH_CLERK_AUTH', userId, Date.now() - start);
    // let prevToken = userId === data.userId ? data.token : null;
    // if (prevToken) console.log('USING PREV TOKEN');
    // const token = prevToken ?? (await a.getToken({ template: 'convex' }));
    const token = await a.getToken({ template: 'convex' });
    console.log('TOKEN: ', Date.now() - start);

    return {
      userId,
      orgId,
      // sessionClaims,
      isAuthenticated,
      token,
    };
  });

// rename ?? too similar to fetchClerkAuth
export const getClerkUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { orgId, userId, sessionId, sessionStatus } = await auth();

    return { orgId, userId, sessionId, sessionStatus };
  }
);

export const getClerkToken = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getToken, userId } = await auth();
    const token = await getToken({ template: 'convex' });

    return { token, userId };
  }
);

// server/clerkTokenCache.ts

let cachedToken: string | null = null;
let cachedUserId: string | null = null;
let expiresAt = 0;

// Cache lifetime (Clerk tokens expire every hour — you can refresh more often)
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const getCachedClerkAuth = createServerFn({ method: 'GET' }).handler(
  async () => {
    const now = Date.now();

    // Return cached version if fresh
    if (cachedToken && now < expiresAt) {
      console.log('RETURNING CACHED TOKEN...');
      return {
        token: cachedToken,
        userId: cachedUserId,
        cached: true,
      };
    }

    console.log('GETTING NEW TOKEN...');
    // Otherwise, fetch a new token
    const { getToken, userId } = await auth(); // getAuth()
    const token = await getToken({ template: 'convex' });

    cachedToken = token;
    cachedUserId = userId;
    expiresAt = now + CACHE_TTL;

    return {
      token,
      userId,
      cached: false,
    };
  }
);
