import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// schema can be generated from the dashboard from existing data

export default defineSchema(
  {
    // messages: defineTable({
    //   body: v.string(),
    //   user: v.id('users'),
    //   author: v.string(),
    // }),
    // users: defineTable({
    //   name: v.string(),
    //   // tokenIdentifier: v.string(),
    //   // this is UserJSON from @clerk/backend
    //   // clerkUser: v.optional(v.any()),
    //   clerkId: v.string(),
    // }).index('by_clerk_id', ['clerkId']),
    // }).index('by_token', ['tokenIdentifier']),

    users: defineTable({
      clerkId: v.string(),
      backup_code_enabled: v.optional(v.boolean()),
      banned: v.optional(v.boolean()),
      create_organization_enabled: v.optional(v.boolean()),
      created_at: v.float64(),
      delete_self_enabled: v.optional(v.boolean()),
      email_addresses: v.optional(
        v.array(
          v.object({
            created_at: v.optional(v.union(v.float64(), v.null())),
            email_address: v.string(),
            id: v.string(),
            linked_to: v.optional(v.array(v.any())),
            matches_sso_connection: v.optional(v.union(v.boolean(), v.null())),
            object: v.string(),
            reserved: v.optional(v.union(v.boolean(), v.null())),
            updated_at: v.optional(v.union(v.float64(), v.null())),
            verification: v.union(
              v.object({
                attempts: v.any(), // v.null(),
                expire_at: v.any(), // v.null(),
                object: v.any(), // v.string(),
                status: v.any(), // v.string(),
                strategy: v.any(), // v.string(),
              }),
              v.null()
            ),
          })
        )
      ),
      enterprise_accounts: v.optional(v.array(v.any())),
      external_accounts: v.array(v.any()),
      external_id: v.optional(v.union(v.string(), v.null())),
      first_name: v.optional(v.union(v.string(), v.null())),
      has_image: v.boolean(),
      // id: v.string(),
      image_url: v.optional(v.string()),
      last_active_at: v.optional(v.union(v.float64(), v.null())),
      last_name: v.optional(v.union(v.string(), v.null())),
      last_sign_in_at: v.optional(v.union(v.float64(), v.null())),
      legal_accepted_at: v.optional(v.union(v.null(), v.string())),
      locale: v.optional(v.union(v.null(), v.string())),
      locked: v.optional(v.boolean()),
      lockout_expires_in_seconds: v.optional(v.union(v.null(), v.float64())),
      mfa_disabled_at: v.optional(v.null()),
      mfa_enabled_at: v.optional(v.union(v.null(), v.string(), v.float64())),
      object: v.optional(v.string()),
      passkeys: v.optional(v.array(v.any())),
      password_enabled: v.boolean(),
      password_last_updated_at: v.union(v.float64(), v.null()),
      phone_numbers: v.array(v.any()),
      primary_email_address_id: v.optional(v.union(v.null(), v.string())),
      primary_phone_number_id: v.optional(v.union(v.null(), v.string())),
      primary_web3_wallet_id: v.optional(v.union(v.null(), v.string())),
      private_metadata: v.optional(v.array(v.any())), // v.object({}),
      profile_image_url: v.optional(v.union(v.null(), v.string())), // v.string(),
      public_metadata: v.optional(v.any()), // v.object({}),
      saml_accounts: v.array(v.any()),
      totp_enabled: v.boolean(),
      two_factor_enabled: v.boolean(),
      unsafe_metadata: v.optional(v.any()), // v.object({}),
      updated_at: v.float64(),
      username: v.optional(v.union(v.null(), v.string())),
      verification_attempts_remaining: v.union(v.float64(), v.null()),
      web3_wallets: v.optional(v.array(v.any())),
    }).index('by_clerk_id', ['clerkId']),

    user_playback: defineTable({
      // id: v.string(), // "play:user:abc:episode:yyyy", // or fields userId + episodeId as keys
      clerkId: v.string(), // v.id('users'),
      episodeId: v.string(), // TODO: make userId:episodeId unique
      positionSeconds: v.float64(),
      completed: v.boolean(),
      lastUpdatedAt: v.float64(), // v.int64(),
      playedPercentage: v.optional(v.float64()),
    })
      .index('by_clerk_id', ['clerkId'])
      .index('by_clerk_episode', ['clerkId', 'episodeId']),
  },
  {
    schemaValidation: false,
  }
);
