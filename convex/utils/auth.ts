import type { QueryCtx } from 'convex/_generated/server';

export async function getClerkId(auth: QueryCtx['auth']) {
  const identity = await auth.getUserIdentity();
  const clerkId = identity?.subject;
  if (!clerkId) throw new Error('Must be signed in');

  return clerkId;
}

export async function getClerkIdIfExists(auth: QueryCtx['auth']) {
  const identity = await auth.getUserIdentity();
  const clerkId = identity?.subject;

  return clerkId || null;
}
