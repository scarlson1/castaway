import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'fetch episodes',
  { minutes: 45 },
  internal.episodes.fetchNewEpisodes,
);

// Generate invoices for the previous month
crons.monthly(
  'generateInvoices',
  // Wait a day after the new month starts to generate invoices
  { day: 2, hourUTC: 0, minuteUTC: 0 },
  internal.agent.usage.generateInvoices,
  {},
);

// Delete episodeEmbeddings older than 4 weeks (and their RAG entries)
crons.weekly(
  'prune old episode embeddings',
  { dayOfWeek: 'sunday', hourUTC: 3, minuteUTC: 0 },
  internal.episodeEmbeddings.pruneOldEpisodeEmbeddings,
  {},
);

// Delete episodes (and related records) for podcasts nobody subscribes to
crons.weekly(
  'prune unsubscribed podcast episodes',
  { dayOfWeek: 'saturday', hourUTC: 3, minuteUTC: 0 },
  internal.episodes.pruneUnsubscribedPodcastEpisodes,
  {},
);

// compute user topic embedding for recommendations
// crons.daily('user episode preference', {}, internal.)

export default crons;
