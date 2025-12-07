import {
  internalMutation,
  internalQuery,
  // mutation,
  query,
  QueryCtx,
} from './_generated/server';

import { UserJSON } from '@clerk/backend';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';

/**
 * Whether the current user is fully logged in, including having their information
 * synced from Clerk via webhook.
 *
 * Like all Convex queries, errors on expired Clerk token.
 */
export const userLoginStatus = query(
  async (
    ctx
  ): Promise<
    | ['No JWT Token', null]
    | ['No Clerk User', null]
    | ['Logged In', Doc<'users'>]
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // no JWT token, user hasn't completed login flow yet
      return ['No JWT Token', null];
    }
    const user = await getCurrentUser(ctx);
    if (user === null) {
      // If Clerk has not told us about this user we're still waiting for the
      // webhook notification.
      return ['No Clerk User', null];
    }
    return ['Logged In', user];
  }
);

/** The current user, containing user preferences and Clerk user info. */
export const currentUser = query((ctx: QueryCtx) => getCurrentUser(ctx));

/** Get user by Clerk use id (AKA "subject" on auth)  */
export const getUser = internalQuery({
  args: { subject: v.string() },
  async handler(ctx, args) {
    return await userByClerkId(ctx, args.subject);
  },
});

/** Create a new Clerk user or update existing Clerk user data. */
export const updateOrCreateUser = internalMutation({
  args: { data: v.any() }, // no runtime validation, trust Clerk
  // async handler(ctx, { clerkUser }: { clerkUser: UserJSON }) {
  async handler(ctx, { data: clerkUser }: { data: UserJSON }) {
    const userRecord = await userByClerkId(ctx, clerkUser.id);

    if (userRecord === null) {
      // const colors = ["red", "green", "blue"];
      // const color = colors[Math.floor(Math.random() * colors.length)];
      await ctx.db.insert('users', {
        // ...clerkUser,
        clerkId: clerkUser.id,
        username: clerkUser.username,
        first_name: clerkUser.first_name || null,
        last_name: clerkUser.last_name || null,
        image_url: clerkUser.image_url,
        has_image: clerkUser.has_image,
        password_enabled: clerkUser.password_enabled,
        two_factor_enabled: clerkUser.two_factor_enabled,
        totp_enabled: clerkUser.totp_enabled,
        backup_code_enabled: clerkUser.backup_code_enabled,
        email_addresses: clerkUser.email_addresses,
        primary_email_address_id: clerkUser.primary_email_address_id,
        phone_numbers: clerkUser.phone_numbers,
        primary_phone_number_id: clerkUser.primary_phone_number_id,
        banned: clerkUser.banned,
        create_organization_enabled: clerkUser.create_organization_enabled,
        created_at: clerkUser.created_at,
        updated_at: clerkUser.updated_at,
        external_accounts: clerkUser.external_accounts,
        // passkeys: clerkUser.passkeys,
        password_last_updated_at: clerkUser.password_last_updated_at,
        saml_accounts: clerkUser.saml_accounts,
        verification_attempts_remaining:
          clerkUser.verification_attempts_remaining,
      });
    } else {
      await ctx.db.patch(userRecord._id, {
        // ...clerkUser,
        // clerkId: clerkUser.id,
        clerkId: clerkUser.id,
        username: clerkUser.username,
        first_name: clerkUser.first_name || null,
        last_name: clerkUser.last_name || null,
        image_url: clerkUser.image_url,
        has_image: clerkUser.has_image,
        password_enabled: clerkUser.password_enabled,
        two_factor_enabled: clerkUser.two_factor_enabled,
        totp_enabled: clerkUser.totp_enabled,
        backup_code_enabled: clerkUser.backup_code_enabled,
        email_addresses: clerkUser.email_addresses,
        primary_email_address_id: clerkUser.primary_email_address_id,
        phone_numbers: clerkUser.phone_numbers,
        primary_phone_number_id: clerkUser.primary_phone_number_id,
        banned: clerkUser.banned,
        create_organization_enabled: clerkUser.create_organization_enabled,
        created_at: clerkUser.created_at,
        updated_at: clerkUser.updated_at,
        external_accounts: clerkUser.external_accounts,
        // passkeys: clerkUser.passkeys,
        password_last_updated_at: clerkUser.password_last_updated_at,
        saml_accounts: clerkUser.saml_accounts,
        verification_attempts_remaining:
          clerkUser.verification_attempts_remaining,
      });
    }
  },
});

/** Delete a user by clerk user ID. */
export const deleteUser = internalMutation({
  args: { id: v.string() },
  async handler(ctx, { id }) {
    const userRecord = await userByClerkId(ctx, id);

    if (userRecord === null) {
      console.warn("can't delete user, does not exist", id);
    } else {
      await ctx.db.delete(userRecord._id);
    }
  },
});

/** Set the user preference of the color of their text. */
// export const setColor = mutation({
//   args: { color: v.string() },
//   handler: async (ctx, { color }) => {
//     const user = await mustGetCurrentUser(ctx);
//     await ctx.db.patch(user._id, { color });
//   },
// });

// Helpers

export async function userByClerkId(
  ctx: QueryCtx,
  clerkUserId: string
): Promise<Doc<'users'> | null> {
  // ): Promise<(Omit<Doc<'users'>, 'clerkUser'> & { clerkUser: UserJSON }) | null> {
  return await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
    .unique();
}

export async function userById(
  ctx: QueryCtx,
  id: Id<'users'>
): Promise<Doc<'users'> | null> {
  // ): Promise<(Omit<Doc<'users'>, 'clerkUser'> & { clerkUser: UserJSON }) | null> {
  return await ctx.db.get(id);
}

async function getCurrentUser(ctx: QueryCtx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;

  return await userByClerkId(ctx, identity.subject);
}

export async function mustGetCurrentUser(ctx: QueryCtx): Promise<Doc<'users'>> {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");

  return userRecord;
}
