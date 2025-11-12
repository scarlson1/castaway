import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// schema can be generated from the dashboard from existing data

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    user: v.id('users'),
    author: v.string(),
  }),
  users: defineTable({
    name: v.string(),
    // tokenIdentifier: v.string(),
    // this is UserJSON from @clerk/backend
    clerkUser: v.optional(v.any()),
    clerkId: v.string(),
  }).index('by_clerk_id', ['clerkId']),
  // }).index('by_token', ['tokenIdentifier']),

  user_playback: defineTable({
    // id: v.string(), // "play:user:abc:episode:yyyy", // or fields userId + episodeId as keys
    userId: v.id('users'),
    episodeId: v.string(), // TODO: make userId:episodeId unique
    positionSeconds: v.float64(),
    completed: v.boolean(),
    lastUpdatedAt: v.float64(), // v.int64(),
    playedPercentage: v.optional(v.float64()),
  })
    .index('by_userId', ['userId'])
    .index('by_user_episode', ['userId', 'episodeId']),
});
