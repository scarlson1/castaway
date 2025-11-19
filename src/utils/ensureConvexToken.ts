import type { RouterContext } from '~/routes/__root';
import { getClerkToken } from '~/serverFn/auth';

export async function ensureConvexToken(context: RouterContext) {
  console.log('CONTEXT: ', context);
  // TODO: need to deal with token refresh
  if (context.token) {
    console.log('TOKEN PRESENT - RETURNING');
    return { token: context.token, userId: context.userId };
  }
  console.log('NO TOKEN - FETCHING...');

  // const { getToken } = await auth();
  // const newToken = await getToken({ template: "convex" });
  const { token: newToken, userId } = await getClerkToken();

  context.token = newToken;
  context.userId = userId;

  // Set token in Convex SSR client
  if (newToken) context.convexQueryClient.serverHttpClient?.setAuth(newToken);

  return { token: newToken, userId };
}
