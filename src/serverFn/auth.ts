import { auth } from '@clerk/tanstack-react-start/server';
import { createServerFn } from '@tanstack/react-start';
import z from 'zod';

// TODO: delete - ConvexProviderWithClerk handles token
// https://chatgpt.com/s/t_691e1b20e9e48191a4d28bc790d8990f

const fetchClerkAuthSchema = z.object({
  token: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
});

export const fetchClerkAuth = createServerFn({ method: 'GET' })
  .inputValidator(fetchClerkAuthSchema)
  .handler(async ({ data }) => {
    const start = Date.now();
    const a = await auth();
    const { userId, orgId, isAuthenticated } = a;
    console.log('FETCH_CLERK_AUTH', userId, Date.now() - start);
    let prevToken = userId === data.userId ? data.token : null;
    if (prevToken) console.log('USING PREV TOKEN');
    const token = prevToken ?? (await a.getToken({ template: 'convex' }));
    console.log('TOKEN: ', Date.now() - start);

    return {
      userId,
      orgId,
      // sessionClaims,
      isAuthenticated,
      token,
    };
  });

export const fetchClerkAuthOnly = createServerFn({ method: 'GET' }).handler(
  async () => {
    const a = await auth();
    const { userId, orgId, isAuthenticated } = a;

    return {
      userId,
      orgId,
      // sessionClaims,
      isAuthenticated,
    };
  }
);

export const getClerkToken = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getToken, userId } = await auth();
    const token = await getToken({ template: 'convex' });

    return { token, userId };
  }
);
