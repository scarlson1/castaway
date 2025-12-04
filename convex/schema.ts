import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// schema can be generated from the dashboard from existing data

export default defineSchema({
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

  podcasts: defineTable({
    podcastId: v.string(), // podcast index guid ??
    feedUrl: v.string(),
    link: v.optional(v.union(v.string(), v.null())),
    title: v.string(),
    author: v.string(),
    ownerName: v.string(),
    description: v.string(),
    imageUrl: v.union(v.string(), v.null()),
    itunesId: v.union(v.number(), v.null()),
    lastFetchedAt: v.number(), // ms
    mostRecentEpisode: v.optional(v.union(v.number(), v.null())), // ms
    language: v.optional(v.string()),
    episodeCount: v.optional(v.union(v.number(), v.null())), // aggregate count from db query ??
    categories: v.optional(v.any()),
    categoryArray: v.optional(v.array(v.string())),
    explicit: v.optional(v.union(v.boolean(), v.null())),
    funding: v.optional(
      v.object({ url: v.union(v.string(), v.null()), message: v.string() })
    ),
    embedding: v.optional(v.array(v.number())),
    // embeddingId: v.optional(v.id('episodeEmbeddings')),
  })
    .index('by_podId', ['podcastId'])
    .index('by_itunesId', ['itunesId'])
    .index('by_lastFetched', ['lastFetchedAt'])
    .index('by_podId_lastFetched', ['podcastId', 'lastFetchedAt'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      // filterFields: ['categoryArray']
    }),

  // fetch to get embedding: https://stack.convex.dev/the-magic-of-embeddings

  subscriptions: defineTable({
    clerkId: v.string(),
    itunesId: v.optional(v.union(v.number(), v.null())),
    podcastId: v.string(), // guid
    subscribedAt: v.float64(),
    // settings: v.object({
    autoDownload: v.boolean(),
    notificationNew: v.boolean(),
    podConvexId: v.id('podcasts'), // v.optional(v.union(v.id('podcasts'), v.null())),
    // }),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_user_podId', ['clerkId', 'podcastId']),

  episodes: defineTable({
    episodeId: v.string(),
    podcastId: v.string(),
    title: v.string(),
    podcastTitle: v.string(),
    publishedAt: v.number(), // ms
    audioUrl: v.string(),
    image: v.union(v.string(), v.null()),
    durationSeconds: v.union(v.number(), v.null()),
    sizeBytes: v.union(v.number(), v.null()),
    feedUrl: v.union(v.string(), v.null()),
    feedImage: v.union(v.string(), v.null()),
    feedItunesId: v.union(v.number(), v.null()),
    summary: v.string(), // = description
    enclosureType: v.string(),
    season: v.optional(v.union(v.number(), v.null())),
    episode: v.optional(v.union(v.number(), v.null())),
    episodeType: v.optional(v.union(v.string(), v.null())), // 'full' | 'trailer' | 'bonus'
    explicit: v.union(v.boolean(), v.null()),
    language: v.union(v.string(), v.null()),
    retrievedAt: v.number(), // ms
    embeddingId: v.optional(v.id('episodeEmbeddings')),
    chaptersUrl: v.optional(v.union(v.string(), v.null())),
    transcripts: v.optional(
      v.array(v.object({ url: v.string(), type: v.string() }))
    ),
    persons: v.optional(
      v.array(
        v.object({
          id: v.union(v.number(), v.string()),
          name: v.optional(v.string()),
          role: v.optional(v.string()),
          group: v.optional(v.string()),
          href: v.optional(v.string()),
          img: v.optional(v.string()),
        })
      )
    ),
    socialInteract: v.optional(
      v.array(
        v.object({
          url: v.optional(v.string()),
          uri: v.optional(v.string()),
          protocol: v.optional(v.string()),
          accountId: v.optional(v.string()),
          accountUrl: v.optional(v.string()),
          priority: v.optional(v.number()),
        })
      )
    ),
  })
    .index('by_podId', ['podcastId'])
    .index('by_episodeId', ['episodeId'])
    .index('by_podId_pub', ['podcastId', 'publishedAt'])
    .index('by_podId_episode', ['podcastId', 'episode'])
    .index('by_publishedAt', ['publishedAt'])
    .index('by_embedding', ['embeddingId'])
    .searchIndex('search_body', {
      searchField: 'title',
      filterFields: ['podcastId'],
      // staged: false,
    }),

  episodeEmbeddings: defineTable({
    episodeConvexId: v.id('episodes'),
    episodeGuid: v.string(),
    podcastId: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.any(),
    createdAt: v.number(),
  })
    .index('by_episodeConvexId', ['episodeConvexId'])
    .index('by_episodeGuid', ['episodeGuid'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['podcastId', 'episodeGuid'],
    }),

  user_playback: defineTable({
    // id: v.string(), // "play:user:abc:episode:yyyy", // or fields userId + episodeId as keys
    clerkId: v.string(), // v.id('users'),
    // podcastId: v.optional(v.string()),
    episodeId: v.string(), // TODO: make userId:episodeId unique
    podcastId: v.string(),
    positionSeconds: v.float64(),
    duration: v.optional(v.number()),
    completed: v.boolean(),
    lastUpdatedAt: v.float64(), // v.int64(),
    playedPercentage: v.optional(v.float64()),
    episodeTitle: v.optional(v.string()),
    podcastTitle: v.optional(v.string()),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_clerkId_lastUpdatedAt', ['clerkId', 'lastUpdatedAt'])
    .index('by_clerk_episode', ['clerkId', 'episodeId']),

  // adSegmentsOld: defineTable({
  //   podcastId: v.string(),
  //   episodeId: v.string(),
  //   convexEpId: v.id('episodes'),
  //   audioUrl: v.string(),
  //   ads: v.array(
  //     v.object({
  //       start: v.number(),
  //       end: v.number(),
  //     })
  //   ),
  //   createdAt: v.number(),
  // }).index('by_episodeId', ['episodeId']),

  ads: defineTable({
    podcastId: v.string(),
    episodeId: v.string(),
    convexEpId: v.id('episodes'),
    audioUrl: v.string(),
    start: v.number(),
    end: v.number(),
    duration: v.number(),
    transcript: v.string(),
    confidence: v.number(),
    embedding: v.array(v.number()),
    createdAt: v.number(),
    // TODO: add feedback score
  })
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536, // text-embedding-3-small (1536)  text-embedding-3-large (3072)
      filterFields: ['podcastId'],
    })
    .index('by_episodeId', ['episodeId']),

  adJobs: defineTable({
    episodeId: v.string(),
    audioUrl: v.string(),
    status: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    // audioStorageId: v.optional(v.string()),
    transcript: v.optional(v.any()), // TODO: type
    segments: v.optional(
      v.array(
        v.object({
          start: v.number(),
          end: v.number(),
          duration: v.number(),
          transcript: v.string(),
          confidence: v.number(),
        })
      )
    ),
  }).index('by_episodeId', ['episodeId']),

  adJobWindows: defineTable({
    jobId: v.id('adJobs'),
    classified: v.boolean(),
    // label: v.union(v.null(), v.string()), // use is_ad instead
    text: v.string(),
    start: v.number(),
    end: v.number(),
    is_ad: v.optional(v.boolean()),
    confidence: v.optional(v.number()),
    reason: v.optional(v.string()),
  })
    .index('by_jobId_classified', ['jobId', 'classified'])
    .index('by_jobId', ['jobId']),
});
